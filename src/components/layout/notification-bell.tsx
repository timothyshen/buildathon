"use client";

import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/contexts/auth-context";
import type { NotificationType } from "@/types";
import {
  Bell,
  CheckCheck,
  FileText,
  MessageSquare,
  Clock,
  UserPlus,
  Award,
  Star,
  Users,
} from "lucide-react";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "submission_status_changed":
    case "new_submission":
    case "new_track_submission":
      return FileText;
    case "review_received":
    case "track_review_completed":
    case "new_feedback":
      return MessageSquare;
    case "deadline_reminder":
    case "review_deadline":
      return Clock;
    case "team_invite":
      return UserPlus;
    case "winner_announced":
      return Award;
    case "review_assigned":
      return Star;
    case "new_user":
      return Users;
    default:
      return Bell;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(user?.id);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground">
                We&apos;ll let you know when something happens
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = getNotificationIcon(notif.type);
              const isUnread = !notif.readAt;

              return (
                <button
                  key={notif.id}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    isUnread ? "bg-muted/30" : ""
                  }`}
                  onClick={() => {
                    if (isUnread) markRead(notif.id);
                    if (notif.href) router.push(notif.href);
                  }}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate text-sm ${
                          isUnread ? "font-medium" : ""
                        }`}
                      >
                        {notif.title}
                      </p>
                      {isUnread && (
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {notif.body}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
