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
      { error: "Problem id is required" },
      { status: 400 }
    );
  }

  await getAdminDb().collection("problems").doc(id).delete();

  return NextResponse.json({ ok: true });
}
