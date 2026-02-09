/**
 * Google Analytics 4 Data API utilities
 */

export interface GAMetrics {
  activeUsers: number;
  totalUsers: number;
  sessions: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
}

/**
 * Exchange refresh token for access token
 */
async function getAccessToken(refreshToken: string): Promise<string> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google Analytics credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(`Failed to refresh token: ${data.error || "Unknown error"}`);
  }

  return data.access_token;
}

/**
 * Fetch GA4 metrics for the last 7 days
 */
export async function fetchGAMetrics(
  propertyId: string,
  refreshToken: string
): Promise<GAMetrics> {
  const accessToken = await getAccessToken(refreshToken);

  // GA4 Data API - Run Report
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [
          {
            startDate: "7daysAgo",
            endDate: "today",
          },
        ],
        metrics: [
          { name: "activeUsers" },
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`GA API error: ${data.error?.message || "Unknown error"}`);
  }

  // Extract metrics from response
  const row = data.rows?.[0];
  if (!row) {
    return {
      activeUsers: 0,
      totalUsers: 0,
      sessions: 0,
      pageviews: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
    };
  }

  const values = row.metricValues || [];

  return {
    activeUsers: parseInt(values[0]?.value || "0", 10),
    totalUsers: parseInt(values[1]?.value || "0", 10),
    sessions: parseInt(values[2]?.value || "0", 10),
    pageviews: parseInt(values[3]?.value || "0", 10),
    bounceRate: parseFloat(values[4]?.value || "0") * 100, // Convert to percentage
    avgSessionDuration: Math.round(parseFloat(values[5]?.value || "0")),
  };
}

/**
 * Fetch daily active users (DAU) for today
 */
export async function fetchGADailyActiveUsers(
  propertyId: string,
  refreshToken: string
): Promise<number> {
  const accessToken = await getAccessToken(refreshToken);

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [
          {
            startDate: "today",
            endDate: "today",
          },
        ],
        metrics: [{ name: "activeUsers" }],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`GA API error: ${data.error?.message || "Unknown error"}`);
  }

  const value = data.rows?.[0]?.metricValues?.[0]?.value;
  return parseInt(value || "0", 10);
}

/**
 * Verify GA connection is still valid
 */
export async function verifyGAConnection(refreshToken: string): Promise<boolean> {
  try {
    await getAccessToken(refreshToken);
    return true;
  } catch {
    return false;
  }
}
