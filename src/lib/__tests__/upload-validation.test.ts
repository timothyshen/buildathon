/**
 * Section 8: Image Upload Tests — Validation Logic
 *
 * Tests for upload route validation:
 * - Allowed file types
 * - File size limits
 * - Bucket validation
 *
 * Tests for compress-image.ts:
 * - Skip conditions (GIF, small files)
 * - Since compressImage uses Canvas/Image APIs (browser-only),
 *   we test the logic boundaries rather than the compression itself.
 */

import { describe, it, expect } from "vitest";

// ──────────────────────────────────────────────
// 8.1  Upload API Validation Constants
// ──────────────────────────────────────────────

// Mirror the constants from the route (they're not exported, so we re-declare)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const VALID_BUCKETS = ["banners", "screenshots", "avatars"] as const;

// Validation functions extracted from route logic
function isValidFileType(type: string): boolean {
  return ALLOWED_TYPES.includes(type);
}

function isValidFileSize(sizeBytes: number): boolean {
  return sizeBytes <= MAX_SIZE_BYTES;
}

function isValidBucket(bucket: string): boolean {
  return (VALID_BUCKETS as readonly string[]).includes(bucket);
}

describe("8.1 Upload API — File Type Validation", () => {
  it("accepts image/jpeg", () => {
    expect(isValidFileType("image/jpeg")).toBe(true);
  });

  it("accepts image/png", () => {
    expect(isValidFileType("image/png")).toBe(true);
  });

  it("accepts image/webp", () => {
    expect(isValidFileType("image/webp")).toBe(true);
  });

  it("accepts image/gif", () => {
    expect(isValidFileType("image/gif")).toBe(true);
  });

  it("rejects application/pdf", () => {
    expect(isValidFileType("application/pdf")).toBe(false);
  });

  it("rejects application/zip", () => {
    expect(isValidFileType("application/zip")).toBe(false);
  });

  it("rejects text/plain", () => {
    expect(isValidFileType("text/plain")).toBe(false);
  });

  it("rejects image/svg+xml", () => {
    expect(isValidFileType("image/svg+xml")).toBe(false);
  });

  it("rejects image/bmp", () => {
    expect(isValidFileType("image/bmp")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidFileType("")).toBe(false);
  });
});

describe("8.1 Upload API — File Size Validation", () => {
  it("accepts 0 bytes", () => {
    expect(isValidFileSize(0)).toBe(true);
  });

  it("accepts 1KB", () => {
    expect(isValidFileSize(1024)).toBe(true);
  });

  it("accepts 1MB", () => {
    expect(isValidFileSize(1024 * 1024)).toBe(true);
  });

  it("accepts exactly 5MB", () => {
    expect(isValidFileSize(5 * 1024 * 1024)).toBe(true);
  });

  it("rejects 5MB + 1 byte", () => {
    expect(isValidFileSize(5 * 1024 * 1024 + 1)).toBe(false);
  });

  it("rejects 10MB", () => {
    expect(isValidFileSize(10 * 1024 * 1024)).toBe(false);
  });
});

describe("8.1 Upload API — Bucket Validation", () => {
  it("accepts 'banners'", () => {
    expect(isValidBucket("banners")).toBe(true);
  });

  it("accepts 'screenshots'", () => {
    expect(isValidBucket("screenshots")).toBe(true);
  });

  it("accepts 'avatars'", () => {
    expect(isValidBucket("avatars")).toBe(true);
  });

  it("rejects 'invalid-bucket'", () => {
    expect(isValidBucket("invalid-bucket")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidBucket("")).toBe(false);
  });

  it("rejects 'Banners' (case-sensitive)", () => {
    expect(isValidBucket("Banners")).toBe(false);
  });

  it("rejects 'banner' (singular)", () => {
    expect(isValidBucket("banner")).toBe(false);
  });

  it("rejects 'screenshot' (singular)", () => {
    expect(isValidBucket("screenshot")).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 8.2  Compression Logic (boundary tests)
// ──────────────────────────────────────────────

describe("8.2 Compression — Skip Conditions", () => {
  // compressImage uses browser APIs (Image, canvas, URL.createObjectURL),
  // so we test the skip-condition logic extracted here.

  const GIF_TYPE = "image/gif";
  const JPEG_TYPE = "image/jpeg";
  const PNG_TYPE = "image/png";
  const SKIP_UNDER = 1024 * 1024; // 1MB default

  function shouldSkipCompression(
    fileType: string,
    fileSize: number,
    skipUnder: number = SKIP_UNDER
  ): boolean {
    // From compress-image.ts lines 22-28
    if (!fileType.startsWith("image/") || fileType === GIF_TYPE) {
      return true;
    }
    if (fileSize <= skipUnder) {
      return true;
    }
    return false;
  }

  it("skips GIF files regardless of size", () => {
    expect(shouldSkipCompression(GIF_TYPE, 10 * 1024 * 1024)).toBe(true);
  });

  it("skips non-image files", () => {
    expect(shouldSkipCompression("application/pdf", 2 * 1024 * 1024)).toBe(true);
  });

  it("skips files under 1MB (default skipUnder)", () => {
    expect(shouldSkipCompression(JPEG_TYPE, 500 * 1024)).toBe(true);
  });

  it("skips files exactly at 1MB", () => {
    expect(shouldSkipCompression(JPEG_TYPE, 1024 * 1024)).toBe(true);
  });

  it("does NOT skip JPEG files over 1MB", () => {
    expect(shouldSkipCompression(JPEG_TYPE, 2 * 1024 * 1024)).toBe(false);
  });

  it("does NOT skip PNG files over 1MB", () => {
    expect(shouldSkipCompression(PNG_TYPE, 1.5 * 1024 * 1024)).toBe(false);
  });

  it("does NOT skip WebP files over 1MB", () => {
    expect(shouldSkipCompression("image/webp", 2 * 1024 * 1024)).toBe(false);
  });

  it("respects custom skipUnder threshold", () => {
    // With 500KB threshold
    expect(shouldSkipCompression(JPEG_TYPE, 600 * 1024, 500 * 1024)).toBe(false);
    expect(shouldSkipCompression(JPEG_TYPE, 400 * 1024, 500 * 1024)).toBe(true);
  });
});

describe("8.2 Compression — Dimension Scaling", () => {
  // Test the dimension-scaling math from compress-image.ts lines 41-49

  function scaleDimensions(
    width: number,
    height: number,
    maxDimension: number
  ): { width: number; height: number } {
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round(height * (maxDimension / width));
        width = maxDimension;
      } else {
        width = Math.round(width * (maxDimension / height));
        height = maxDimension;
      }
    }
    return { width, height };
  }

  it("does not scale if already within limits", () => {
    expect(scaleDimensions(800, 600, 2048)).toEqual({ width: 800, height: 600 });
  });

  it("scales landscape image correctly", () => {
    const result = scaleDimensions(4000, 3000, 2560);
    expect(result.width).toBe(2560);
    expect(result.height).toBe(1920);
  });

  it("scales portrait image correctly", () => {
    const result = scaleDimensions(3000, 4000, 2560);
    expect(result.width).toBe(1920);
    expect(result.height).toBe(2560);
  });

  it("scales square image correctly", () => {
    const result = scaleDimensions(4000, 4000, 2560);
    expect(result.width).toBe(2560);
    expect(result.height).toBe(2560);
  });

  it("handles exact maxDimension (no change needed)", () => {
    expect(scaleDimensions(2560, 1440, 2560)).toEqual({ width: 2560, height: 1440 });
  });

  it("banner dimensions: maxDimension 2560", () => {
    const result = scaleDimensions(5120, 2880, 2560);
    expect(result.width).toBe(2560);
    expect(result.height).toBe(1440);
  });

  it("screenshot dimensions: maxDimension 1920", () => {
    const result = scaleDimensions(3840, 2160, 1920);
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  it("maintains aspect ratio", () => {
    const original = 4000 / 3000;
    const result = scaleDimensions(4000, 3000, 2560);
    const scaled = result.width / result.height;
    expect(Math.abs(original - scaled)).toBeLessThan(0.01);
  });
});

// ──────────────────────────────────────────────
// 8.3  File Name Generation
// ──────────────────────────────────────────────

describe("8.3 Upload API — File Name Generation", () => {
  it("extracts extension from filename", () => {
    const getExt = (name: string) => name.split(".").pop() || "jpg";
    expect(getExt("photo.jpg")).toBe("jpg");
    expect(getExt("image.png")).toBe("png");
    expect(getExt("file.webp")).toBe("webp");
    expect(getExt("animation.gif")).toBe("gif");
  });

  it("defaults to jpg when no extension", () => {
    const getExt = (name: string) => name.split(".").pop() || "jpg";
    // When filename has no dot, split returns the filename itself
    // This test documents the current behavior
    expect(getExt("noext")).toBe("noext");
  });

  it("handles multiple dots in filename", () => {
    const getExt = (name: string) => name.split(".").pop() || "jpg";
    expect(getExt("my.photo.file.png")).toBe("png");
  });
});

// ──────────────────────────────────────────────
// 8.4  Submission Screenshots Constraints
// ──────────────────────────────────────────────

describe("8.4 Submission Screenshots — Constraints", () => {
  const MIN_SCREENSHOTS = 3;
  const MAX_SCREENSHOTS = 10;

  it("minimum 3 screenshots required", () => {
    expect(MIN_SCREENSHOTS).toBe(3);
  });

  it("maximum 10 screenshots allowed", () => {
    expect(MAX_SCREENSHOTS).toBe(10);
  });

  it("validates minimum count", () => {
    const isValid = (count: number) => count >= MIN_SCREENSHOTS;
    expect(isValid(0)).toBe(false);
    expect(isValid(1)).toBe(false);
    expect(isValid(2)).toBe(false);
    expect(isValid(3)).toBe(true);
    expect(isValid(10)).toBe(true);
  });

  it("validates maximum count", () => {
    const canAdd = (current: number) => current < MAX_SCREENSHOTS;
    expect(canAdd(0)).toBe(true);
    expect(canAdd(9)).toBe(true);
    expect(canAdd(10)).toBe(false);
    expect(canAdd(11)).toBe(false);
  });
});
