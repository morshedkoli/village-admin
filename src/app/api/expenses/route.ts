import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isBootstrapAdminEmail, normalizeAdminEmail } from "@/lib/admin-access";

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401, error: "Missing bearer token" };
  }

  try {
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = normalizeAdminEmail(decoded.email ?? "");

    if (decoded.admin === true || isBootstrapAdminEmail(email)) {
      return { ok: true as const, email };
    }

    const adminSnap = await getAdminDb().collection("admins").doc(email).get();
    if (adminSnap.exists) {
      return { ok: true as const, email };
    }

    return {
      ok: false as const,
      status: 401,
      error: "Signed-in user is not an admin",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to verify admin token";
    const status = message.includes("project_id") ? 500 : 401;
    return { ok: false as const, status, error: message };
  }
}

export async function POST(req: NextRequest) {
  const verified = await verifyAdmin(req);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.status }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    project?: string;
    category?: string;
    amount?: number;
    notes?: string;
  };

  const project = String(body.project ?? "").trim();
  const category = String(body.category ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const amount = Math.round(Number(body.amount ?? 0));

  if (!project) {
    return NextResponse.json(
      { error: "Project or expense title is required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Expense amount must be greater than zero" },
      { status: 400 }
    );
  }

  const adminDb = getAdminDb();
  const expenseRef = adminDb.collection("fund_transactions").doc();
  const villageRef = adminDb.collection("villages").doc("main_village");

  await adminDb.runTransaction(async (tx) => {
    tx.set(expenseRef, {
      type: "expense",
      amount,
      reference: project,
      project,
      category: category || "Other",
      notes,
      createdAt: FieldValue.serverTimestamp(),
      addedBy: verified.email,
    });

    tx.set(
      villageRef,
      { totalSpent: FieldValue.increment(amount) },
      { merge: true }
    );
  });

  return NextResponse.json({ ok: true });
}
