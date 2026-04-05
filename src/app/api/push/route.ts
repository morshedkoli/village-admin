import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getAdminMessaging } from "@/lib/firebase-admin";
import { isBootstrapAdminEmail, normalizeAdminEmail } from "@/lib/admin-access";

const VALID_TYPES = ["donation", "problem", "citizen", "project"];

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  try {
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = normalizeAdminEmail(decoded.email ?? "");

    if (decoded.admin === true || isBootstrapAdminEmail(email)) {
      return true;
    }

    if (!email) return false;
    const adminSnap = await getAdminDb().collection("admins").doc(email).get();
    return adminSnap.exists;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Verify the caller is an authenticated admin
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, type } = await req.json();

  // Input validation
  if (!title || typeof title !== "string" || title.length > 200) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }
  if (!body || typeof body !== "string" || body.length > 1000) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const result = await getAdminMessaging().send({
      topic: "all",
      notification: {
        title,
        body,
      },
      data: {
        type,
        title,
        body,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "default",
        },
      },
    });

    return NextResponse.json({ success: true, messageId: result });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Firebase push notification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
