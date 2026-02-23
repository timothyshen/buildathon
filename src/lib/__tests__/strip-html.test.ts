/**
 * stripHtml Tests
 *
 * Tests for stripHtml from utils.ts
 */

import { describe, it, expect } from "vitest";
import { stripHtml } from "../utils";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("replaces &nbsp; with space", () => {
    expect(stripHtml("Hello&nbsp;world")).toBe("Hello world");
  });

  it("replaces &amp; with &", () => {
    expect(stripHtml("A&amp;B")).toBe("A&B");
  });

  it("replaces &lt; and &gt;", () => {
    expect(stripHtml("&lt;div&gt;")).toBe("<div>");
  });

  it("replaces &quot; with double quote", () => {
    expect(stripHtml("&quot;hello&quot;")).toBe('"hello"');
  });

  it("replaces &#39; with single quote", () => {
    expect(stripHtml("it&#39;s")).toBe("it's");
  });

  it("normalizes multiple whitespace to single space", () => {
    expect(stripHtml("hello   world")).toBe("hello world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(stripHtml("  hello  ")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });

  it("returns empty string for null-ish input", () => {
    expect(stripHtml(null as unknown as string)).toBe("");
    expect(stripHtml(undefined as unknown as string)).toBe("");
  });

  it("handles complex HTML", () => {
    const html = '<div class="test"><h1>Title</h1> <p>Some <em>text</em> here</p></div>';
    expect(stripHtml(html)).toBe("Title Some text here");
  });

  it("handles self-closing tags", () => {
    expect(stripHtml("line1<br/>line2")).toBe("line1line2");
  });
});
