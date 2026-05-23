import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "./firebase-admin";
import { isBootstrapAdminEmail, normalizeAdminEmail } from "./admin-access";

export type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; status: number; error: string };

/**
 * Verifies that the request comes from an authenticated admin user.
 * Checks: Firebase custom claim → bootstrap email → Firestore admins collection.
 */
export async function verifyAdmin(req: NextRequest): Promise<VerifyResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }

  try {
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = normalizeAdminEmail(decoded.email ?? "");

    if (decoded.admin === true || isBootstrapAdminEmail(email)) {
      return { ok: true, email };
    }

    if (!email) {
      return { ok: false, status: 401, error: "No email associated with this account" };
    }

    const adminSnap = await getAdminDb().collection("admins").doc(email).get();
    if (adminSnap.exists) {
      return { ok: true, email };
    }

    return {
      ok: false,
      status: 401,
      error: "Signed-in user is not an admin",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to verify admin token";
    const status = message.includes("project_id") ? 500 : 401;
    return { ok: false, status, error: message };
  }
}
