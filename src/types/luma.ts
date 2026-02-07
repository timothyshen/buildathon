// Luma (lu.ma) API response types
// API Base: https://public-api.luma.com
// Auth: x-luma-api-key header

export interface LumaHost {
  name?: string;
  avatar_url?: string;
  api_id: string;
}

export interface LumaGeoAddress {
  city?: string;
  region?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  full_address?: string;
  place_id?: string;
  description?: string;
}

export interface LumaEvent {
  api_id: string;
  name: string;
  description: string;
  description_md?: string;
  start_at: string; // ISO 8601
  end_at: string; // ISO 8601
  timezone: string;
  url: string; // lu.ma event URL
  cover_url?: string;
  meeting_url?: string;
  geo_address_json?: LumaGeoAddress | null;
  visibility: string;
  hosts: LumaHost[];
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
