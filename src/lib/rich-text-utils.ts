/**
 * Rich Text Utilities
 * Pure helper functions for rich text content processing.
 */

/**
 * Normalize escaped forward slashes that may appear from JSON serialization.
 * Converts `\/` sequences back to `/`.
 */
export function normalizeEscapedSlashes(content: string): string {
  return content.replace(/\\\//g, "/");
}
