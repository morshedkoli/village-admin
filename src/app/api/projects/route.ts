import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/verify-admin";

function sanitizeProjectBody(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const estimatedCost = Math.max(0, Math.round(Number(body.estimatedCost ?? 0)));
  const allocatedFunds = Math.max(
    0,
    Math.round(Number(body.allocatedFunds ?? 0))
  );
  const status = String(body.status ?? "Planning").trim() || "Planning";
  const photos = Array.isArray(body.photos)
    ? body.photos.map((item) => String(item)).filter(Boolean)
    : [];
  const updates = Array.isArray(body.updates)
    ? body.updates.map((item) => String(item)).filter(Boolean)
    : [];
  const spendingReport = Array.isArray(body.spendingReport)
    ? body.spendingReport.map((item) => String(item)).filter(Boolean)
    : [];

  return {
    title,
    description,
    estimatedCost,
    allocatedFunds,
    status,
    photos,
    updates,
    spendingReport,
  };
}

export async function POST(req: NextRequest) {
  const verified = await verifyAdmin(req);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.status }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const project = sanitizeProjectBody(body);

  if (!project.title) {
    return NextResponse.json(
      { error: "Project title is required" },
      { status: 400 }
    );
  }

  await getAdminDb().collection("projects").add({
    ...project,
    createdAt: FieldValue.serverTimestamp(),
    addedBy: verified.email,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const verified = await verifyAdmin(req);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.status }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json(
      { error: "Project id is required" },
      { status: 400 }
    );
  }

  const project = sanitizeProjectBody(body);

  if (!project.title) {
    return NextResponse.json(
      { error: "Project title is required" },
      { status: 400 }
    );
  }

  await getAdminDb().collection("projects").doc(id).set(
    {
      ...project,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: verified.email,
    },
    { merge: true }
  );

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
      { error: "Project id is required" },
      { status: 400 }
    );
  }

  await getAdminDb().collection("projects").doc(id).delete();

  return NextResponse.json({ ok: true });
}
