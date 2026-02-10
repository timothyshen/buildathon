/**
 * Web Push Dispatcher
 * Server-side utility for sending push notifications via VAPID
 */

import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Configure VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    "mailto:notifications@swa.xyz",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  href?: string;
}

export async function dispatchPush(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return;
  }

  const admin = createAdminClient();

  // Check user's notification preferences
  const { data: user } = await admin
    .from("users")
    .select("notification_preferences")
    .eq("id", userId)
    .single();

  const prefs = user?.notification_preferences as Record<string, boolean> | null;
  if (!prefs?.push_enabled) return;

  // Get all subscriptions for user
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  // Send to all subscriptions
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
    )
  );

  // Cleanup expired subscriptions (410 Gone)
  const expiredIds: string[] = [];
  results.forEach((result, index) => {
    if (
      result.status === "rejected" &&
      (result.reason as { statusCode?: number })?.statusCode === 410
    ) {
      expiredIds.push(subscriptions[index].id);
    }
  });

  if (expiredIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", expiredIds);
  }
}
