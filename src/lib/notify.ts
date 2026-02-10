/**
 * Server-side notification helper
 * Creates notifications via admin client and dispatches push
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchPush } from "@/lib/push";
import type { NotificationType } from "@/types";
import type { Json } from "@/lib/supabase/database.types";

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, unknown>;
}

export async function notifyUser(params: NotifyParams): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    href: params.href ?? null,
    metadata: params.metadata as unknown as Json,
  });

  if (error) {
    console.error("[notify] Failed to create notification:", error);
    return;
  }

  // Fire-and-forget push
  dispatchPush(params.userId, {
    title: params.title,
    body: params.body,
    href: params.href,
  }).catch((err) => console.error("[notify] Push dispatch failed:", err));
}

export async function notifyBulk(notifications: NotifyParams[]): Promise<void> {
  if (notifications.length === 0) return;
  const admin = createAdminClient();

  const rows = notifications.map((n) => ({
    user_id: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    href: n.href ?? null,
    metadata: n.metadata as unknown as Json,
  }));

  const { error } = await admin.from("notifications").insert(rows);
  if (error) {
    console.error("[notify] Bulk insert failed:", error);
    return;
  }

  // Fire-and-forget push for each user
  await Promise.allSettled(
    notifications.map((n) =>
      dispatchPush(n.userId, { title: n.title, body: n.body, href: n.href })
    )
  );
}
