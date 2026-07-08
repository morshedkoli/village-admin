import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/verify-admin";

export async function PATCH(req: NextRequest) {
  const verified = await verifyAdmin(req);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.status }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    paymentAccounts?: Record<string, unknown>;
  };

  const updateData: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Village name is required" },
        { status: 400 }
      );
    }
    updateData.name = name;
  }

  if (body.paymentAccounts && typeof body.paymentAccounts === "object") {
    updateData.paymentAccounts = body.paymentAccounts;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No settings changes provided" },
      { status: 400 }
    );
  }

  await getAdminDb()
    .collection("villages")
    .doc("main_village")
    .set(updateData, { merge: true });

  return NextResponse.json({ ok: true });
}
