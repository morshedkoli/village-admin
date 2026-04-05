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
    name?: string;
    profession?: string;
    phone?: string;
    village?: string;
    email?: string;
    address?: string;
    nidNumber?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
    photoUrl?: string;
  };

  const name = String(body.name ?? "").trim();
  const profession = String(body.profession ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const village = String(body.village ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const address = String(body.address ?? "").trim();
  const nidNumber = String(body.nidNumber ?? "").trim();
  const bloodGroup = String(body.bloodGroup ?? "").trim();
  const dateOfBirth = String(body.dateOfBirth ?? "").trim();
  const photoUrl = String(body.photoUrl ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Citizen name is required" },
      { status: 400 }
    );
  }

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 }
    );
  }

  if (!village) {
    return NextResponse.json(
      { error: "Village name is required" },
      { status: 400 }
    );
  }

  if (email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }
  }

  const adminDb = getAdminDb();
  const userRef = adminDb.collection("users").doc();
  const villageRef = adminDb.collection("villages").doc("main_village");

  await adminDb.runTransaction(async (tx) => {
    tx.set(userRef, {
      name,
      profession,
      phone,
      village,
      email,
      address,
      nidNumber,
      bloodGroup,
      dateOfBirth,
      photoUrl,
      isCitizen: true,
      blocked: false,
      addedBy: verified.email,
      createdAt: FieldValue.serverTimestamp(),
    });

    tx.set(
      villageRef,
      { totalCitizens: FieldValue.increment(1) },
      { merge: true }
    );
  });

  return NextResponse.json({ ok: true });
}
