import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/verify-admin";

/**
 * POST /api/users
 *
 * Creates a citizen record in Firestore.
 * If `password` is supplied, also creates a Firebase Auth account so the
 * citizen can log in with their phone number + password on the mobile app.
 * The Auth email is set to `{phone}@village.app` (internal convention).
 * If the citizen also has a real email it is stored in Firestore only.
 */
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
    password?: string;
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
  const password = String(body.password ?? "").trim();

  // ── Validation ──────────────────────────────────────────────────────

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

  if (password && password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // ── Normalize phone number ──────────────────────────────────────────
  // Strip spaces and non-digit characters (keep leading +)
  const normalizedPhone = phone.startsWith("+")
    ? "+" + phone.slice(1).replace(/\D/g, "")
    : phone.replace(/\D/g, "");

  const adminDb = getAdminDb();
  const adminAuth = getAdminAuth();
  const villageRef = adminDb.collection("villages").doc("main_village");

  // ── With password: create Firebase Auth account first ───────────────
  if (password) {
    // Auth email follows the phone@village.app convention used by the Flutter app.
    const authEmail = `${normalizedPhone}@village.app`;

    let uid: string;

    try {
      // Check if an Auth account already exists for this phone.
      const existing = await adminAuth
        .getUserByEmail(authEmail)
        .catch(() => null);

      if (existing) {
        // Update existing account credentials.
        await adminAuth.updateUser(existing.uid, {
          displayName: name,
          password,
          ...(photoUrl ? { photoURL: photoUrl } : {}),
        });
        uid = existing.uid;
      } else {
        // Create a new Auth account.
        const newUser = await adminAuth.createUser({
          email: authEmail,
          password,
          displayName: name,
          ...(photoUrl ? { photoURL: photoUrl } : {}),
          // phoneNumber must be in E.164 format — only set if it starts with +
          ...(normalizedPhone.startsWith("+")
            ? { phoneNumber: normalizedPhone }
            : {}),
        });
        uid = newUser.uid;
      }
    } catch (authError: unknown) {
      const message =
        authError instanceof Error
          ? authError.message
          : "Failed to create Auth account";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Write Firestore doc using the Auth UID as the document ID.
    const userRef = adminDb.collection("users").doc(uid);

    await adminDb.runTransaction(async (tx) => {
      tx.set(userRef, {
        name,
        profession,
        phone: normalizedPhone,
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
        hasPassword: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(
        villageRef,
        { totalCitizens: FieldValue.increment(1) },
        { merge: true }
      );
    });

    return NextResponse.json({ ok: true, uid });
  }

  // ── Without password: Firestore-only citizen record (no login) ──────
  const userRef = adminDb.collection("users").doc();

  await adminDb.runTransaction(async (tx) => {
    tx.set(userRef, {
      name,
      profession,
      phone: normalizedPhone,
      village,
      email,
      address,
      nidNumber,
      bloodGroup,
      dateOfBirth,
      photoUrl,
      isCitizen: true,
      blocked: false,
      hasPassword: false,
      addedBy: verified.email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(
      villageRef,
      { totalCitizens: FieldValue.increment(1) },
      { merge: true }
    );
  });

  return NextResponse.json({ ok: true });
}
