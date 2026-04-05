import { getAuth } from "firebase/auth";

export async function sendPushNotification({
  title,
  body,
  type,
}: {
  title: string;
  body: string;
  type: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = getAuth().currentUser;
    if (!user) return { success: false, error: "Not authenticated" };

    const token = await user.getIdToken();

    const res = await fetch("/api/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, body, type }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        success: false,
        error: err.error || "Push notification failed",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Firebase push request error:", err);
    return { success: false, error: "Network error sending push notification" };
  }
}
