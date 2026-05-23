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
