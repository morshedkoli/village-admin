import { NextRequest, NextResponse } from "next/server";
import { getAdminMessaging } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/verify-admin";

const VALID_TYPES = ["donation", "problem", "citizen", "project", "general", "registration"];

export async function POST(req: NextRequest) {
  // Verify the caller is an authenticated admin
  const verified = await verifyAdmin(req);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: verified.status });
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
      topic: "village_broadcast",
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
