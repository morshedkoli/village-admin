import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/verify-admin";

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

export async function DELETE(req: NextRequest) {
  const verified = await verifyAdmin(req);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json(
      { error: "Expense id is required" },
      { status: 400 }
    );
  }

  const adminDb = getAdminDb();
  const expenseRef = adminDb.collection("fund_transactions").doc(id);
  const villageRef = adminDb.collection("villages").doc("main_village");

  try {
    await adminDb.runTransaction(async (tx) => {
      const expenseSnap = await tx.get(expenseRef);
      if (!expenseSnap.exists) {
        throw new Error("Expense not found");
      }

      const data = expenseSnap.data() as
        | { type?: string; amount?: number }
        | undefined;
      if (data?.type !== "expense") {
        throw new Error("Transaction is not an expense");
      }

      const amount = Math.max(0, Math.round(Number(data.amount ?? 0)));
      tx.delete(expenseRef);

      if (amount > 0) {
        tx.set(
          villageRef,
          { totalSpent: FieldValue.increment(-amount) },
          { merge: true }
        );
      }
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete expense";
    const status = message === "Expense not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ ok: true });
}
