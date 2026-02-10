"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { notificationsService } from "@/services";
import type { Notification, NotificationType } from "@/types";
import { toast } from "sonner";

const HIGH_PRIORITY_TYPES: NotificationType[] = [
  "submission_status_changed",
  "review_received",
  "winner_announced",
];

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

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);

  // Initial load
  useEffect(() => {
    if (!userId) return;

    async function load() {
      setIsLoading(true);
      const [listRes, countRes] = await Promise.all([
        notificationsService.list(userId!, { page: 1, pageSize: 20 }),
        notificationsService.getUnreadCount(userId!),
      ]);

      setNotifications(listRes.data);
      setHasMore(listRes.hasMore);
      setUnreadCount(countRes.data);
      setIsLoading(false);
    }

    load();
  }, [userId]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = toNotification(payload.new as Record<string, unknown>);
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          if (HIGH_PRIORITY_TYPES.includes(newNotif.type)) {
            toast(newNotif.title, { description: newNotif.body });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      await notificationsService.markRead(id, userId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [userId]
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await notificationsService.markAllRead(userId);
    setNotifications((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date() }))
    );
    setUnreadCount(0);
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!userId || !hasMore) return;
    const nextPage = pageRef.current + 1;
    const res = await notificationsService.list(userId, {
      page: nextPage,
      pageSize: 20,
    });
    pageRef.current = nextPage;
    setNotifications((prev) => [...prev, ...res.data]);
    setHasMore(res.hasMore);
  }, [userId, hasMore]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    loadMore,
    hasMore,
  };
}
