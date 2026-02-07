// Server-only — never import from client components

const LUMA_API_BASE = "https://public-api.luma.com";

export async function lumaFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) throw new Error("LUMA_API_KEY not configured");

  const res = await fetch(`${LUMA_API_BASE}${path}`, {
    ...options,
    headers: {
      "x-luma-api-key": apiKey,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Luma API error ${res.status}: ${text}`);
  }

  return res.json();
}
