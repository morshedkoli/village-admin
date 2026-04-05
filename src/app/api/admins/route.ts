import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import {
  getBootstrapAdminEmails,
  isBootstrapAdminEmail,
  normalizeAdminEmail,
} from "@/lib/admin-access";

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

    return { ok: false as const, status: 401, error: "Signed-in user is not an admin" };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to verify admin token";
    const status = message.includes("project_id") ? 500 : 401;
    return { ok: false as const, status, error: message };
  }
}

export async function GET(req: NextRequest) {
  const verified = await verifyAdmin(req);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.status }
    );
  }

  const snap = await getAdminDb()
    .collection("admins")
    .orderBy("email")
    .get();

  const admins = [
    ...getBootstrapAdminEmails().map((email) => ({
      id: email,
      email,
      addedBy: "system",
      addedAt: null,
    })),
    ...snap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: String(data.email ?? doc.id),
          addedBy: String(data.addedBy ?? ""),
          addedAt: data.addedAt?.toDate?.()?.toISOString?.() ?? null,
        };
      })
      .filter((admin) => !isBootstrapAdminEmail(admin.email)),
  ];

  return NextResponse.json({ admins });
}

export async function POST(req: NextRequest) {
  const verified = await verifyAdmin(req);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.status }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = normalizeAdminEmail(typeof body.email === "string" ? body.email : "");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  await getAdminDb().collection("admins").doc(email).set({
    email,
    addedBy: verified.email,
    addedAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
