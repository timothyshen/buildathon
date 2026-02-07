-- Lightweight local tracking for Luma event RSVPs
-- Allows fast page-load lookups without querying Luma API per event

CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  luma_event_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(luma_event_id, user_id)
);

CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_event ON event_rsvps(luma_event_id);
