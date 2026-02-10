# Notifications System Design

In-app notifications with browser push for the buildathon platform. Supabase Realtime for instant delivery, Web Push API with VAPID keys for browser notifications.

## Data Model

### notifications table

| Column     | Type          | Notes                                    |
|------------|---------------|------------------------------------------|
| id         | uuid, PK      |                                          |
| user_id    | uuid, FK       | → users.id                              |
| type       | text          | notification type enum                    |
| title      | text          | "Your submission was accepted"           |
| body       | text          | "Project X in Cohort Y has been accepted"|
| href       | text, nullable | deep link path, e.g. "/submissions/abc"  |
| read_at    | timestamptz, nullable | null = unread                    |
| metadata   | jsonb, nullable | extra context (submission_id, cohort_id) |
| created_at | timestamptz   | default now()                            |

Index: `(user_id, read_at, created_at DESC)` for fast unread queries.

### push_subscriptions table

| Column     | Type          | Notes                     |
|------------|---------------|---------------------------|
| id         | uuid, PK      |                           |
| user_id    | uuid, FK       | → users.id               |
| endpoint   | text          | push service URL           |
| p256dh     | text          | encryption key             |
| auth       | text          | auth secret                |
| created_at | timestamptz   | default now()             |

Unique constraint: `(user_id, endpoint)`.

### Notification types

```
submission_status_changed | review_received | deadline_reminder |
team_invite | winner_announced | review_assigned |
review_deadline | new_track_submission | track_review_completed |
new_submission | new_user | new_feedback
```

### User preferences

Add `notification_preferences` jsonb column to `users` table:

```json
{
  "push_enabled": true,
  "submission_updates": true,
  "review_alerts": true,
  "deadline_reminders": true,
  "team_activity": true
}
```

## Architecture

Three layers, no event bus or queue.

### 1. Notification Service (`src/services/notifications.service.ts`)

- `create(userId, type, title, body, href?, metadata?)` — insert into DB + dispatch push
- `createBulk(notifications[])` — batch insert for multi-recipient events
- `markRead(id, userId)` / `markAllRead(userId)`
- `list(userId, { unreadOnly?, page?, pageSize? })`
- `getUnreadCount(userId)`

### 2. Push Dispatcher (`src/lib/push.ts`)

- Uses `web-push` npm package with VAPID keys from env vars
- `sendPush(userId, payload)` — looks up all subscriptions for user, sends to each
- Auto-cleanup on 410 Gone (expired subscriptions)
- Called by notification service after DB insert
- Checks user's `notification_preferences` before sending

### 3. Notification Triggers

Direct calls in existing services:

| Event                    | Triggered in              | Recipients        |
|--------------------------|---------------------------|--------------------|
| Submission status change | submissions.service.ts    | Submitter          |
| Review received          | reviews.service.ts        | Submitter          |
| Deadline reminder        | cron job                  | Non-submitted participants |
| Team invite              | teams.service.ts          | Invitee            |
| Winner announced         | admin action              | Winner + all participants |
| Review assigned          | admin action              | Judge              |
| Review deadline          | cron job                  | Judges with pending |
| New track submission     | submissions.service.ts    | Track sponsor      |
| Track review completed   | reviews.service.ts        | Track sponsor      |
| New submission           | submissions.service.ts    | All admins         |
| New user registered      | auth.service.ts           | All admins         |
| New feedback             | feedback creation         | All admins         |

## In-App UI

### Bell icon (DashboardHeader)

- Right side of header, next to user dropdown
- Unread count badge (red dot with number, max "99+")
- Click opens popover panel

### Notification panel

- Max height 400px, scrollable
- Header: "Notifications" + "Mark all read" ghost button
- Each item: type icon + title (bold if unread) + body (truncated) + relative timestamp
- Unread: `bg-muted/50` background + blue dot
- Click → markRead() + navigate to href
- Empty state: bell icon + "No notifications yet"

### Notification preferences (Settings page)

- New section between Wallet and Danger Zone
- Toggle for push notifications (triggers browser permission + subscription)
- Per-category toggles: submission updates, review alerts, deadline reminders, team activity
- Stored in `notification_preferences` jsonb on users table

### Realtime subscription

- `useNotifications()` hook subscribes to `notifications` table filtered by `user_id`
- On INSERT → increment unread count, show toast for high-priority types
- Set up in dashboard layout, cleaned up on unmount

## Web Push

### Service worker (`public/sw.js`)

- Listens for `push` events, shows native notification via `showNotification()`
- Listens for `notificationclick` → `clients.openWindow(href)`
- No caching or offline strategy

### VAPID keys

- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` in env
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` exposed to client
- One dependency: `web-push` npm package

### Subscription flow

1. User toggles push in settings
2. `Notification.requestPermission()`
3. Register service worker → `pushManager.subscribe({ applicationServerKey })`
4. POST subscription to `/api/push/subscribe`
5. Saved to `push_subscriptions` table

### Unsubscribe flow

- Toggle off → `subscription.unsubscribe()` → DELETE `/api/push/subscribe` → remove from DB

### API routes

- `POST /api/push/subscribe` — save subscription (authenticated)
- `DELETE /api/push/subscribe` — remove subscription (authenticated)

### Delivery

- Push payload: `{ title, body, href }` (under 4KB)
- Failed pushes (410) trigger auto-cleanup

## Deadline Reminder Cron

### API route: `POST /api/cron/deadline-reminders`

- Secured with `CRON_SECRET` header (same as traction-sync)
- Runs every 30 minutes via Vercel Cron

### Logic

1. Query active cohorts with `submission_deadline` within 24h or 1h
2. Dedup: check if notification with same type + user_id + cohort_id + reminder_type exists in last 24h
3. Find participants who haven't submitted to that cohort
4. Bulk create notifications + push dispatch

### Vercel cron config

```json
{ "crons": [{ "path": "/api/cron/deadline-reminders", "schedule": "*/30 * * * *" }] }
```

## Files

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx_notifications.sql` | Create | DB tables, indexes, RLS |
| `src/types/index.ts` | Modify | Add Notification, PushSubscription, NotificationPreferences types |
| `src/services/notifications.service.ts` | Create | CRUD + bulk create |
| `src/lib/push.ts` | Create | Web push dispatcher |
| `public/sw.js` | Create | Service worker for push |
| `src/hooks/use-notifications.ts` | Create | Realtime subscription + unread count |
| `src/components/layout/notification-bell.tsx` | Create | Bell icon + popover panel |
| `src/components/layout/dashboard-header.tsx` | Modify | Add NotificationBell |
| `src/app/(dashboard)/settings/page.tsx` | Modify | Add notification preferences section |
| `src/app/api/push/subscribe/route.ts` | Create | Push subscription endpoints |
| `src/app/api/cron/deadline-reminders/route.ts` | Create | Deadline reminder cron |
| `src/services/submissions.service.ts` | Modify | Add notification triggers |
| `src/services/reviews.service.ts` | Modify | Add notification triggers |
