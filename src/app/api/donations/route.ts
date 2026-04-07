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
    paymentTarget?: string;
    senderNumber?: string;
    transactionId?: string;
    status?: "Pending" | "Approved";
  };

  const donorName = String(body.donorName ?? "").trim();
  const paymentTarget = String(body.paymentTarget ?? "").trim();
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

  if (!paymentTarget) {
    return NextResponse.json(
      { error: "Please select a receiving account or cash" },
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
  const villageSnap = await adminDb.collection("villages").doc("main_village").get();
  const paymentAccounts = Array.isArray(villageSnap.data()?.paymentAccounts)
    ? (villageSnap.data()?.paymentAccounts as Array<Record<string, unknown>>)
    : [];

  let paymentMethod = "Cash";
  let receivedAccountId = "";
  let receivedAccountLabel = "Cash";

  if (paymentTarget !== "cash") {
    const account = paymentAccounts.find(
      (entry) => String(entry.id ?? "") === paymentTarget
    );

    if (!account) {
      return NextResponse.json(
        { error: "Selected receiving account is no longer available" },
        { status: 400 }
      );
    }

    const accountType = String(account.type ?? "").trim();
    const accountNumber = String(account.number ?? "").trim();
    const holderName = String(account.name ?? "").trim();

    paymentMethod = accountType || "Account";
    receivedAccountId = String(account.id ?? "");
    receivedAccountLabel = [accountType, accountNumber, holderName]
      .filter(Boolean)
      .join(" • ");
  }

  await adminDb.runTransaction(async (tx) => {
    tx.set(donationRef, {
      donorName,
      amount,
      paymentMethod,
      receivedAccountId,
      receivedAccountLabel,
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
      { error: "Donation id is required" },
      { status: 400 }
    );
  }

  await getAdminDb().collection("donations").doc(id).delete();

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

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    action?: "approve" | "reject";
  };

  const { id, action } = body;

  if (!id || !action) {
    return NextResponse.json(
      { error: "Donation id and action are required" },
      { status: 400 }
    );
  }

  const adminDb = getAdminDb();
  const donationRef = adminDb.collection("donations").doc(id);

  try {
    if (action === "approve") {
      await adminDb.runTransaction(async (tx) => {
        const donationSnap = await tx.get(donationRef);
        if (!donationSnap.exists) {
          throw new Error("Donation not found");
        }

        const data = donationSnap.data();
        if (data?.status === "Approved") {
          return;
        }

        const amount = Number(data?.amount ?? 0);
        const donorName = String(data?.donorName ?? "Anonymous");
        const villageRef = adminDb.collection("villages").doc("main_village");

        tx.update(donationRef, {
          status: "Approved",
          approvedBy: verified.email,
          approvedAt: FieldValue.serverTimestamp(),
        });

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
      });
    } else {
      await donationRef.update({
        status: "Rejected",
        rejectedBy: verified.email,
        rejectedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
