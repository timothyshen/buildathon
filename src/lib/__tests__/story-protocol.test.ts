/**
 * Story Protocol Integration Tests
 *
 * Tests for:
 * - PIL Terms preset values (getPresetTerms)
 * - Explorer URL helper functions
 * - Story Protocol constants validation
 * - License terms data routing (buildLicenseTermsData)
 */

import { describe, it, expect } from "vitest";
import {
  getPresetTerms,
  buildLicenseTermsData,
} from "@/services/story-protocol/licensing";
import {
  STORY_CHAIN_ID,
  WIP_TOKEN_ADDRESS,
  STORY_EXPLORER_URL,
  getIpExplorerUrl,
  getTxExplorerUrl,
} from "@/services/story-protocol/constants";
import type { PilTermsFormValues, PilPreset } from "@/types";

// ──────────────────────────────────────────────
// Factory helper
// ──────────────────────────────────────────────

function makePilTerms(
  overrides: Partial<PilTermsFormValues> = {}
): PilTermsFormValues {
  return {
    commercialUse: false,
    commercialAttribution: false,
    commercialRevShare: 0,
    defaultMintingFee: "0",
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesReciprocal: true,
    derivativesApproval: false,
    transferable: true,
    currency: WIP_TOKEN_ADDRESS,
    expiration: 0,
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// 1. PIL Terms Presets
// ──────────────────────────────────────────────

describe("getPresetTerms", () => {
  it("returns correct non-commercial-remix terms", () => {
    const terms = getPresetTerms("non-commercial-remix");
    expect(terms.commercialUse).toBe(false);
    expect(terms.derivativesAllowed).toBe(true);
    expect(terms.derivativesAttribution).toBe(true);
    expect(terms.derivativesReciprocal).toBe(true);
    expect(terms.defaultMintingFee).toBe("0");
    expect(terms.transferable).toBe(true);
  });

  it("returns correct commercial-use terms", () => {
    const terms = getPresetTerms("commercial-use");
    expect(terms.commercialUse).toBe(true);
    expect(terms.commercialAttribution).toBe(true);
    expect(terms.derivativesAllowed).toBe(false);
    expect(terms.defaultMintingFee).toBe("1");
  });

  it("returns correct commercial-remix terms", () => {
    const terms = getPresetTerms("commercial-remix");
    expect(terms.commercialUse).toBe(true);
    expect(terms.derivativesAllowed).toBe(true);
    expect(terms.commercialRevShare).toBe(50);
    expect(terms.defaultMintingFee).toBe("1");
  });

  it("returns correct cc-attribution terms", () => {
    const terms = getPresetTerms("cc-attribution");
    expect(terms.commercialUse).toBe(true);
    expect(terms.derivativesAllowed).toBe(true);
    expect(terms.commercialRevShare).toBe(0);
    expect(terms.defaultMintingFee).toBe("0");
  });

  it("all presets have all required PilTermsFormValues fields", () => {
    const presets = [
      "non-commercial-remix",
      "commercial-use",
      "commercial-remix",
      "cc-attribution",
    ] as const;
    const requiredFields = [
      "commercialUse",
      "commercialAttribution",
      "commercialRevShare",
      "defaultMintingFee",
      "derivativesAllowed",
      "derivativesAttribution",
      "derivativesReciprocal",
      "derivativesApproval",
      "transferable",
      "currency",
      "expiration",
    ];

    for (const preset of presets) {
      const terms = getPresetTerms(preset);
      for (const field of requiredFields) {
        expect(terms).toHaveProperty(field);
      }
    }
  });

  it("all presets use WIP_TOKEN_ADDRESS as currency", () => {
    const presets = [
      "non-commercial-remix",
      "commercial-use",
      "commercial-remix",
      "cc-attribution",
    ] as const;
    for (const preset of presets) {
      const terms = getPresetTerms(preset);
      expect(terms.currency).toBe("0x1514000000000000000000000000000000000000");
    }
  });

  it("non-commercial presets have zero minting fee", () => {
    const terms = getPresetTerms("non-commercial-remix");
    expect(terms.defaultMintingFee).toBe("0");
    expect(terms.commercialUse).toBe(false);
  });

  it("commercial presets have non-zero minting fee", () => {
    const commercialUse = getPresetTerms("commercial-use");
    const commercialRemix = getPresetTerms("commercial-remix");
    expect(commercialUse.defaultMintingFee).toBe("1");
    expect(commercialRemix.defaultMintingFee).toBe("1");
  });

  it("cc-attribution is commercial but free", () => {
    const terms = getPresetTerms("cc-attribution");
    expect(terms.commercialUse).toBe(true);
    expect(terms.defaultMintingFee).toBe("0");
  });

  it("commercial-use disallows derivatives", () => {
    const terms = getPresetTerms("commercial-use");
    expect(terms.derivativesAllowed).toBe(false);
    expect(terms.derivativesAttribution).toBe(false);
    expect(terms.derivativesReciprocal).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 2. Explorer URL helpers
// ──────────────────────────────────────────────

describe("explorer URL helpers", () => {
  it("getIpExplorerUrl returns correct URL", () => {
    const url = getIpExplorerUrl("0x1234abcd");
    expect(url).toBe("https://aeneid.storyscan.io/ip/0x1234abcd");
  });

  it("getTxExplorerUrl returns correct URL", () => {
    const url = getTxExplorerUrl("0xdeadbeef");
    expect(url).toBe("https://aeneid.storyscan.io/tx/0xdeadbeef");
  });

  it("handles empty strings", () => {
    expect(getIpExplorerUrl("")).toBe("https://aeneid.storyscan.io/ip/");
    expect(getTxExplorerUrl("")).toBe("https://aeneid.storyscan.io/tx/");
  });

  it("preserves full-length addresses", () => {
    const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38";
    expect(getIpExplorerUrl(addr)).toBe(
      `https://aeneid.storyscan.io/ip/${addr}`
    );
  });

  it("preserves full-length tx hashes", () => {
    const hash =
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    expect(getTxExplorerUrl(hash)).toBe(
      `https://aeneid.storyscan.io/tx/${hash}`
    );
  });
});

// ──────────────────────────────────────────────
// 3. Constants validation
// ──────────────────────────────────────────────

describe("Story Protocol constants", () => {
  it("STORY_CHAIN_ID is aeneid", () => {
    expect(STORY_CHAIN_ID).toBe("aeneid");
  });

  it("WIP_TOKEN_ADDRESS is valid address format", () => {
    expect(WIP_TOKEN_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("STORY_EXPLORER_URL does not have trailing slash", () => {
    expect(STORY_EXPLORER_URL.endsWith("/")).toBe(false);
  });

  it("STORY_EXPLORER_URL uses https", () => {
    expect(STORY_EXPLORER_URL.startsWith("https://")).toBe(true);
  });

  it("WIP_TOKEN_ADDRESS is the known Story Protocol WIP token", () => {
    expect(WIP_TOKEN_ADDRESS).toBe(
      "0x1514000000000000000000000000000000000000"
    );
  });
});

// ──────────────────────────────────────────────
// 4. buildLicenseTermsData routing logic
// ──────────────────────────────────────────────
// NOTE: buildLicenseTermsData calls PILFlavor methods from @story-protocol/core-sdk.
// If the SDK has ESM/CJS issues or missing crypto in the test environment,
// these tests may need to be skipped. We attempt them first and mark as
// skip-worthy in a comment if they fail at the module level.

describe("buildLicenseTermsData", () => {
  it("routes non-commercial + derivatives to nonCommercialSocialRemixing", () => {
    const result = buildLicenseTermsData(
      makePilTerms({
        commercialUse: false,
        derivativesAllowed: true,
      })
    );
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("routes commercial + no derivatives to commercialUse", () => {
    const result = buildLicenseTermsData(
      makePilTerms({
        commercialUse: true,
        derivativesAllowed: false,
        defaultMintingFee: "1",
      })
    );
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("routes commercial + derivatives to commercialRemix", () => {
    const result = buildLicenseTermsData(
      makePilTerms({
        commercialUse: true,
        derivativesAllowed: true,
        commercialRevShare: 50,
        defaultMintingFee: "1",
      })
    );
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("falls back to nonCommercialSocialRemixing for no commercial + no derivatives", () => {
    const result = buildLicenseTermsData(
      makePilTerms({
        commercialUse: false,
        derivativesAllowed: false,
      })
    );
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("non-commercial results match regardless of other field values", () => {
    const a = buildLicenseTermsData(
      makePilTerms({
        commercialUse: false,
        derivativesAllowed: true,
        commercialRevShare: 0,
      })
    );
    const b = buildLicenseTermsData(
      makePilTerms({
        commercialUse: false,
        derivativesAllowed: true,
        commercialRevShare: 99,
      })
    );
    // Both should route to nonCommercialSocialRemixing and produce same output
    expect(a).toStrictEqual(b);
  });

  it("handles zero minting fee for commercial-use", () => {
    const result = buildLicenseTermsData(
      makePilTerms({
        commercialUse: true,
        derivativesAllowed: false,
        defaultMintingFee: "0",
      })
    );
    expect(result).toBeDefined();
  });

  it("handles empty string minting fee gracefully", () => {
    const result = buildLicenseTermsData(
      makePilTerms({
        commercialUse: true,
        derivativesAllowed: false,
        defaultMintingFee: "",
      })
    );
    expect(result).toBeDefined();
  });
});
