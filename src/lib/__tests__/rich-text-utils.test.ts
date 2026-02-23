/**
 * Rich Text Utilities Tests
 *
 * Tests for rich-text-utils.ts:
 * - normalizeEscapedSlashes
 */

import { describe, it, expect } from "vitest";
import { normalizeEscapedSlashes } from "../rich-text-utils";

describe("normalizeEscapedSlashes", () => {
  it("converts escaped forward slashes to normal slashes", () => {
    expect(normalizeEscapedSlashes("hello\\/world")).toBe("hello/world");
  });

  it("handles multiple escaped slashes", () => {
    expect(normalizeEscapedSlashes("a\\/b\\/c\\/d")).toBe("a/b/c/d");
  });

  it("leaves normal slashes untouched", () => {
    expect(normalizeEscapedSlashes("a/b/c")).toBe("a/b/c");
  });

  it("handles mixed escaped and normal slashes", () => {
    expect(normalizeEscapedSlashes("a/b\\/c/d")).toBe("a/b/c/d");
  });

  it("returns empty string unchanged", () => {
    expect(normalizeEscapedSlashes("")).toBe("");
  });

  it("handles string with no slashes", () => {
    expect(normalizeEscapedSlashes("hello world")).toBe("hello world");
  });

  it("handles HTML content with escaped slashes", () => {
    const input = '<p>Check out https:\\/\\/example.com<\\/p>';
    const expected = '<p>Check out https://example.com</p>';
    expect(normalizeEscapedSlashes(input)).toBe(expected);
  });
});
