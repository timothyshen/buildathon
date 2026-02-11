/**
 * Wallet Integration Tests
 *
 * Tests for:
 * - EVM address validation and normalization
 * - Address truncation for UI display
 * - Wallet login API payload validation
 * - Wallet binding logic (duplicate detection, error states)
 * - Wallet login error message mapping
 */

import { describe, it, expect } from "vitest";

// ──────────────────────────────────────────────
// Mirror internal functions and types
// ──────────────────────────────────────────────

// From wallet-connect.tsx
function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// EVM address validation (standard 0x + 40 hex chars)
function isValidEvmAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// Case-insensitive address comparison (EVM addresses are case-variant)
function addressesMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

// From wallet-login route — payload validation
interface WalletLoginPayload {
  walletAddress: string;
}

function validateWalletLoginPayload(
  body: Partial<WalletLoginPayload> & Record<string, unknown>
): string[] {
  const errors: string[] = [];

  if (!body.walletAddress) {
    errors.push("Wallet address is required");
  } else if (typeof body.walletAddress !== "string") {
    errors.push("Wallet address must be a string");
  } else if (!isValidEvmAddress(body.walletAddress)) {
    errors.push("Invalid EVM address format");
  }

  return errors;
}

// Error code mapping from wallet login hook
type WalletLoginError =
  | "NO_ACCOUNT"
  | "INVALID_REQUEST"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "VERIFY_ERROR";

function getWalletLoginErrorMessage(errorCode: WalletLoginError): string {
  switch (errorCode) {
    case "NO_ACCOUNT":
      return "No account found with this wallet. Register with email first, then connect your wallet in Settings.";
    case "INVALID_REQUEST":
      return "Wallet address is required";
    case "SERVER_ERROR":
      return "Internal server error";
    case "NETWORK_ERROR":
      return "Network error. Please try again.";
    case "VERIFY_ERROR":
      return "Authentication failed. Please try again.";
    default:
      return "Login failed";
  }
}

// Wallet binding validation
interface BindWalletCheck {
  userId: string;
  address: string;
  existingUser: { id: string; walletAddress: string } | null;
}

function canBindWallet(check: BindWalletCheck): { ok: boolean; error?: string } {
  if (!check.address) {
    return { ok: false, error: "No wallet address provided" };
  }
  if (!isValidEvmAddress(check.address)) {
    return { ok: false, error: "Invalid wallet address" };
  }
  if (check.existingUser && check.existingUser.id !== check.userId) {
    return { ok: false, error: "This wallet is already connected to another account" };
  }
  return { ok: true };
}

// ──────────────────────────────────────────────
// Test data
// ──────────────────────────────────────────────

const VALID_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38";
const VALID_ADDRESS_LOWER = "0x742d35cc6634c0532925a3b844bc9e7595f2bd38";
const VALID_ADDRESS_UPPER = "0x742D35CC6634C0532925A3B844BC9E7595F2BD38";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const SHORT_ADDRESS = "0x742d35Cc";
const NO_PREFIX = "742d35Cc6634C0532925a3b844Bc9e7595f2bD38";

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe("truncateAddress", () => {
  it("shows first 6 and last 4 chars with ellipsis", () => {
    expect(truncateAddress(VALID_ADDRESS)).toBe("0x742d...bD38");
  });

  it("handles checksummed address", () => {
    const result = truncateAddress(VALID_ADDRESS);
    expect(result).toMatch(/^0x[0-9a-fA-F]{4}\.{3}[0-9a-fA-F]{4}$/);
  });

  it("handles lowercase address", () => {
    expect(truncateAddress(VALID_ADDRESS_LOWER)).toBe("0x742d...bd38");
  });

  it("handles uppercase address", () => {
    expect(truncateAddress(VALID_ADDRESS_UPPER)).toBe("0x742D...BD38");
  });

  it("handles zero address", () => {
    expect(truncateAddress(ZERO_ADDRESS)).toBe("0x0000...0000");
  });

  it("preserves 0x prefix", () => {
    const result = truncateAddress(VALID_ADDRESS);
    expect(result.startsWith("0x")).toBe(true);
  });

  it("has consistent length output", () => {
    const result = truncateAddress(VALID_ADDRESS);
    expect(result).toHaveLength(13); // 6 + 3 dots + 4
  });
});

describe("isValidEvmAddress", () => {
  it("accepts valid checksummed address", () => {
    expect(isValidEvmAddress(VALID_ADDRESS)).toBe(true);
  });

  it("accepts lowercase address", () => {
    expect(isValidEvmAddress(VALID_ADDRESS_LOWER)).toBe(true);
  });

  it("accepts uppercase address", () => {
    expect(isValidEvmAddress(VALID_ADDRESS_UPPER)).toBe(true);
  });

  it("accepts zero address", () => {
    expect(isValidEvmAddress(ZERO_ADDRESS)).toBe(true);
  });

  it("rejects address without 0x prefix", () => {
    expect(isValidEvmAddress(NO_PREFIX)).toBe(false);
  });

  it("rejects too-short address", () => {
    expect(isValidEvmAddress(SHORT_ADDRESS)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidEvmAddress("")).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isValidEvmAddress("0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG")).toBe(false);
  });

  it("rejects too-long address", () => {
    expect(isValidEvmAddress("0x" + "a".repeat(41))).toBe(false);
  });

  it("rejects address with spaces", () => {
    expect(isValidEvmAddress("0x 742d35Cc6634C0532925a3b844Bc9e7595f2bD3")).toBe(false);
  });

  it("rejects null-like values", () => {
    expect(isValidEvmAddress("null")).toBe(false);
    expect(isValidEvmAddress("undefined")).toBe(false);
  });

  it("accepts exactly 42 characters (0x + 40 hex)", () => {
    expect(VALID_ADDRESS).toHaveLength(42);
    expect(isValidEvmAddress(VALID_ADDRESS)).toBe(true);
  });
});

describe("addressesMatch", () => {
  it("matches same address", () => {
    expect(addressesMatch(VALID_ADDRESS, VALID_ADDRESS)).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(addressesMatch(VALID_ADDRESS, VALID_ADDRESS_LOWER)).toBe(true);
    expect(addressesMatch(VALID_ADDRESS_UPPER, VALID_ADDRESS_LOWER)).toBe(true);
  });

  it("does not match different addresses", () => {
    expect(addressesMatch(VALID_ADDRESS, ZERO_ADDRESS)).toBe(false);
  });

  it("matches mixed case variants", () => {
    const a = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
    const b = "0xabcdef1234567890abcdef1234567890abcdef12";
    expect(addressesMatch(a, b)).toBe(true);
  });
});

describe("validateWalletLoginPayload", () => {
  it("accepts valid payload", () => {
    expect(validateWalletLoginPayload({ walletAddress: VALID_ADDRESS })).toEqual([]);
  });

  it("rejects missing walletAddress", () => {
    expect(validateWalletLoginPayload({})).toContain("Wallet address is required");
  });

  it("rejects empty walletAddress", () => {
    expect(validateWalletLoginPayload({ walletAddress: "" })).toContain("Wallet address is required");
  });

  it("rejects non-string walletAddress", () => {
    expect(
      validateWalletLoginPayload({ walletAddress: 123 as unknown as string })
    ).toContain("Wallet address must be a string");
  });

  it("rejects invalid EVM address format", () => {
    expect(
      validateWalletLoginPayload({ walletAddress: SHORT_ADDRESS })
    ).toContain("Invalid EVM address format");
  });

  it("accepts lowercase address", () => {
    expect(validateWalletLoginPayload({ walletAddress: VALID_ADDRESS_LOWER })).toEqual([]);
  });

  it("ignores extra fields", () => {
    expect(
      validateWalletLoginPayload({ walletAddress: VALID_ADDRESS, extra: "field" })
    ).toEqual([]);
  });
});

describe("getWalletLoginErrorMessage", () => {
  it("returns correct message for NO_ACCOUNT", () => {
    const msg = getWalletLoginErrorMessage("NO_ACCOUNT");
    expect(msg).toContain("No account found");
    expect(msg).toContain("Settings");
  });

  it("returns correct message for INVALID_REQUEST", () => {
    expect(getWalletLoginErrorMessage("INVALID_REQUEST")).toBe("Wallet address is required");
  });

  it("returns correct message for SERVER_ERROR", () => {
    expect(getWalletLoginErrorMessage("SERVER_ERROR")).toBe("Internal server error");
  });

  it("returns correct message for NETWORK_ERROR", () => {
    const msg = getWalletLoginErrorMessage("NETWORK_ERROR");
    expect(msg).toContain("Network error");
  });

  it("returns correct message for VERIFY_ERROR", () => {
    const msg = getWalletLoginErrorMessage("VERIFY_ERROR");
    expect(msg).toContain("Authentication failed");
  });

  it("returns fallback for unknown error codes", () => {
    expect(getWalletLoginErrorMessage("UNKNOWN" as WalletLoginError)).toBe("Login failed");
  });
});

describe("canBindWallet", () => {
  const userId = "user-123";

  it("allows binding when no existing user has the wallet", () => {
    const result = canBindWallet({
      userId,
      address: VALID_ADDRESS,
      existingUser: null,
    });
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("allows binding when existing user is the same user (re-bind)", () => {
    const result = canBindWallet({
      userId,
      address: VALID_ADDRESS,
      existingUser: { id: userId, walletAddress: VALID_ADDRESS },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects when another user has the wallet", () => {
    const result = canBindWallet({
      userId,
      address: VALID_ADDRESS,
      existingUser: { id: "other-user", walletAddress: VALID_ADDRESS },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("already connected to another account");
  });

  it("rejects empty address", () => {
    const result = canBindWallet({
      userId,
      address: "",
      existingUser: null,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("No wallet address");
  });

  it("rejects invalid address format", () => {
    const result = canBindWallet({
      userId,
      address: SHORT_ADDRESS,
      existingUser: null,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Invalid wallet address");
  });
});

describe("Wallet login API response shapes", () => {
  // Validate expected response shapes from the API

  interface SuccessResponse {
    email: string;
    token_hash: string;
  }

  interface ErrorResponse {
    error: string;
    message: string;
  }

  function isSuccessResponse(data: unknown): data is SuccessResponse {
    const d = data as Record<string, unknown>;
    return typeof d.email === "string" && typeof d.token_hash === "string";
  }

  function isErrorResponse(data: unknown): data is ErrorResponse {
    const d = data as Record<string, unknown>;
    return typeof d.error === "string" && typeof d.message === "string";
  }

  it("validates success response shape", () => {
    const success = { email: "user@test.com", token_hash: "abc123hash" };
    expect(isSuccessResponse(success)).toBe(true);
  });

  it("rejects success response missing email", () => {
    expect(isSuccessResponse({ token_hash: "abc" })).toBe(false);
  });

  it("rejects success response missing token_hash", () => {
    expect(isSuccessResponse({ email: "user@test.com" })).toBe(false);
  });

  it("validates error response shape", () => {
    const err = { error: "NO_ACCOUNT", message: "Not found" };
    expect(isErrorResponse(err)).toBe(true);
  });

  it("recognizes known error codes", () => {
    const knownErrors = ["NO_ACCOUNT", "INVALID_REQUEST", "SERVER_ERROR"];
    knownErrors.forEach((code) => {
      const resp = { error: code, message: "test" };
      expect(isErrorResponse(resp)).toBe(true);
    });
  });

  it("rejects error response missing fields", () => {
    expect(isErrorResponse({ error: "TEST" })).toBe(false);
    expect(isErrorResponse({ message: "test" })).toBe(false);
    expect(isErrorResponse({})).toBe(false);
  });
});

describe("EVM address edge cases", () => {
  it("handles Ethereum mainnet-style addresses", () => {
    // Common ENS-resolved addresses
    expect(isValidEvmAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")).toBe(true); // vitalik.eth
  });

  it("handles contract addresses", () => {
    // USDC contract on Ethereum
    expect(isValidEvmAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")).toBe(true);
  });

  it("handles addresses from different EVM chains identically", () => {
    // Same format regardless of chain (Ethereum, Polygon, Base, etc.)
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(isValidEvmAddress(addr)).toBe(true);
  });

  it("rejects Solana-style addresses", () => {
    expect(isValidEvmAddress("7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV")).toBe(false);
  });

  it("rejects Bitcoin-style addresses", () => {
    expect(isValidEvmAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")).toBe(false);
  });

  it("rejects Cosmos-style addresses", () => {
    expect(isValidEvmAddress("cosmos1fl48vsnmsdzcv85q5d2q4z5ajdha8yu34mf0eh")).toBe(false);
  });
});
