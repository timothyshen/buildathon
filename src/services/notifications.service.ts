/**
 * Notifications Service
 * Handles notification CRUD operations
 */

import { createClient } from "@/lib/supabase/client";
import type { Notification, NotificationType } from "@/types";
import type { Json } from "@/lib/supabase/database.types";
import type { ServiceResponse, PaginatedResponse, QueryOptions } from "./types";
import { success, error, paginated } from "./types";

export interface NotificationsService {
  create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    href?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ServiceResponse<Notification>>;
  list(
    userId: string,
    options?: QueryOptions & { unreadOnly?: boolean }
  ): Promise<PaginatedResponse<Notification>>;
  getUnreadCount(userId: string): Promise<ServiceResponse<number>>;
  markRead(id: string, userId: string): Promise<ServiceResponse<void>>;
  markAllRead(userId: string): Promise<ServiceResponse<void>>;
}

function toNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as NotificationType,
    title: row.title as string,
    body: row.body as string,
    href: row.href as string | undefined,
    readAt: row.read_at ? new Date(row.read_at as string) : undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

async function create(data: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, unknown>;
}): Promise<ServiceResponse<Notification>> {
  const supabase = createClient();
  const { data: row, error: dbError } = await supabase
    .from("notifications")
    .insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      href: data.href ?? null,
      metadata: (data.metadata ?? null) as Json,
    })
    .select("*")
    .single();

  if (dbError) {
    return error(dbError.message, null as unknown as Notification);
  }

  return success(toNotification(row));
}

async function list(
  userId: string,
  options?: QueryOptions & { unreadOnly?: boolean }
): Promise<PaginatedResponse<Notification>> {
  const supabase = createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (options?.unreadOnly) {
    query = query.is("read_at", null);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + pageSize - 1);

  const { data, error: dbError, count } = await query;

  if (dbError) {
    return {
      data: [],
      success: false,
      error: dbError.message,
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
  }

  const notifications = (data || []).map(toNotification);
  return paginated(notifications, count || 0, page, pageSize);
}

async function getUnreadCount(
  userId: string
): Promise<ServiceResponse<number>> {
  const supabase = createClient();
  const { count, error: dbError } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (dbError) {
    return error(dbError.message, 0);
  }

  return success(count || 0);
}

async function markRead(
  id: string,
  userId: string
): Promise<ServiceResponse<void>> {
  const supabase = createClient();
  const { error: dbError } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (dbError) {
    return error(dbError.message, undefined as unknown as void);
  }

  return success(undefined as unknown as void);
}

async function markAllRead(
  userId: string
): Promise<ServiceResponse<void>> {
  const supabase = createClient();
  const { error: dbError } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (dbError) {
    return error(dbError.message, undefined as unknown as void);
  }

  return success(undefined as unknown as void);
}

export const notificationsService: NotificationsService = {
  create,
  list,
  getUnreadCount,
  markRead,
  markAllRead,
};
