/**
 * OAuth State Signing Utilities
 *
 * Signs and verifies OAuth state parameters using HMAC to prevent CSRF attacks.
 */

import { createHmac, randomBytes } from "crypto";

const STATE_SECRET = process.env.OAUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

interface StatePayload {
  submissionId: string;
  userId: string;
  nonce: string;
  exp: number;
}

/**
 * Creates a signed OAuth state parameter
 */
export function createSignedState(submissionId: string, userId: string): string {
  const payload: StatePayload = {
    submissionId,
    userId,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + STATE_EXPIRY_MS,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");

  const signature = createHmac("sha256", STATE_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies and extracts data from a signed OAuth state parameter
 * Returns null if invalid or expired
 */
export function verifySignedState(state: string): { submissionId: string; userId: string } | null {
  try {
    const parts = state.split(".");
    if (parts.length !== 2) {
      return null;
    }

    const [payloadB64, signature] = parts;

    // Verify signature
    const expectedSignature = createHmac("sha256", STATE_SECRET)
      .update(payloadB64)
      .digest("base64url");

    if (signature !== expectedSignature) {
      console.error("[OAuth State] Invalid signature");
      return null;
    }

    // Decode payload
    const payload: StatePayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    );

    // Check expiry
    if (Date.now() > payload.exp) {
      console.error("[OAuth State] State expired");
      return null;
    }

    return {
      submissionId: payload.submissionId,
      userId: payload.userId,
    };
  } catch (err) {
    console.error("[OAuth State] Verification failed:", err);
    return null;
  }
}
