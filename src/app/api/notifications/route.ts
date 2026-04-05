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
    body?: string;
    type?: string;
  };

  const title = String(body.title ?? "").trim();
  const message = String(body.body ?? "").trim();
  const type = String(body.type ?? "donation").trim();

  if (!title) {
    return NextResponse.json(
      { error: "Notification title is required" },
      { status: 400 }
    );
  }

  if (!message) {
    return NextResponse.json(
      { error: "Notification message is required" },
      { status: 400 }
    );
  }

  await getAdminDb().collection("notifications").add({
    title,
    body: message,
    type,
    source: "admin",
    createdAt: FieldValue.serverTimestamp(),
    addedBy: verified.email,
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
      { error: "Notification id is required" },
      { status: 400 }
    );
  }

  await getAdminDb().collection("notifications").doc(id).delete();

  return NextResponse.json({ ok: true });
}
