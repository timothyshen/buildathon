// Luma (lu.ma) API response types
// API Base: https://public-api.luma.com
// Auth: x-luma-api-key header

export interface LumaHost {
  name?: string;
  avatar_url?: string;
  api_id: string;
}

export interface LumaGeoAddress {
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  city_state?: string;
  full_address?: string;
  google_maps_place_id?: string;
  apple_maps_place_id?: string;
  description?: string;
}

export interface LumaEvent {
  api_id: string;
  name: string;
  description: string;
  description_md?: string;
  start_at: string; // ISO 8601
  end_at: string; // ISO 8601
  duration_interval?: string;
  timezone: string;
  url: string; // lu.ma event URL
  cover_url?: string;
  meeting_url?: string;
  zoom_meeting_url?: string;
  geo_address_json?: LumaGeoAddress | null;
  geo_latitude?: string;
  geo_longitude?: string;
  visibility: string;
  user_api_id?: string;
  calendar_api_id?: string;
  hosts?: LumaHost[]; // Not returned by /v1/calendar/list-events
}

export interface LumaEventEntry {
  api_id: string;
  event: LumaEvent;
  tags?: string[];
}

export interface LumaListEventsResponse {
  entries: LumaEventEntry[];
  has_more: boolean;
  next_cursor?: string;
}
