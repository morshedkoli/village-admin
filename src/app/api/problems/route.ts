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
    title?: string;
    description?: string;
    location?: string;
    photoUrl?: string;
    status?: "Pending" | "Approved" | "Completed";
  };

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const location = String(body.location ?? "").trim();
  const photoUrl = String(body.photoUrl ?? "").trim();
  const status =
    body.status === "Approved" || body.status === "Completed"
      ? body.status
      : "Pending";

  if (!title) {
    return NextResponse.json(
      { error: "Problem title is required" },
      { status: 400 }
    );
  }

  if (!description) {
    return NextResponse.json(
      { error: "Problem description is required" },
      { status: 400 }
    );
  }

  await getAdminDb().collection("problems").add({
    title,
    description,
    location,
    photoUrl,
    status,
    createdAt: FieldValue.serverTimestamp(),
    reportedBy: verified.email,
    reportedByName: "Admin",
    source: "admin",
  });

  return NextResponse.json({ ok: true });
}
