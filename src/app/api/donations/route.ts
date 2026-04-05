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
    donorName?: string;
    amount?: number;
    paymentMethod?: string;
    senderNumber?: string;
    transactionId?: string;
    status?: "Pending" | "Approved";
  };

  const donorName = String(body.donorName ?? "").trim();
  const paymentMethod = String(body.paymentMethod ?? "").trim();
  const senderNumber = String(body.senderNumber ?? "").trim();
  const transactionId = String(body.transactionId ?? "").trim();
  const status = body.status === "Pending" ? "Pending" : "Approved";
  const amount = Math.round(Number(body.amount ?? 0));

  if (!donorName) {
    return NextResponse.json(
      { error: "Donor name is required" },
      { status: 400 }
    );
  }

  if (!paymentMethod) {
    return NextResponse.json(
      { error: "Payment method is required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Donation amount must be greater than zero" },
      { status: 400 }
    );
  }

  const adminDb = getAdminDb();
  const donationRef = adminDb.collection("donations").doc();
  const villageRef = adminDb.collection("villages").doc("main_village");

  await adminDb.runTransaction(async (tx) => {
    tx.set(donationRef, {
      donorName,
      amount,
      paymentMethod,
      senderNumber,
      transactionId,
      userId: "",
      status,
      createdAt: FieldValue.serverTimestamp(),
      addedBy: verified.email,
      source: "admin",
    });

    if (status === "Approved") {
      tx.set(
        villageRef,
        { totalFundCollected: FieldValue.increment(amount) },
        { merge: true }
      );

      tx.set(adminDb.collection("fund_transactions").doc(), {
        type: "donation",
        amount,
        reference: donorName,
        createdAt: FieldValue.serverTimestamp(),
        addedBy: verified.email,
      });

      tx.set(adminDb.collection("notifications").doc(), {
        title: "নতুন অনুদান",
        body: `${donorName} ৳${amount} অনুদান দিয়েছেন`,
        type: "donation",
        source: "admin",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
