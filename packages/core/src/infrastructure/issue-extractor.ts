// Infrastructure layer - Issue number extraction

import type { ExtractionMode } from "../domain/types.js";

/**
 * Extract issue numbers from text based on mode
 * @param text - The text to extract from
 * @param mode - The extraction mode ("default", "branch", or "commit")
 * @returns Array of unique issue numbers found
 */
export function extractIssueNumbers(
  text: string,
  mode: ExtractionMode,
): number[] {
  const numbers = new Set<number>();

  if (mode === "default" || mode === "commit") {
    // Extract #123 format only
    const matches = text.matchAll(/#(\d+)/g);
    for (const match of matches) {
      const num = match[1];
      if (num) {
        const issueNumber = Number.parseInt(num, 10);
        if (issueNumber > 0 && issueNumber <= 9999999) {
          numbers.add(issueNumber);
        }
      }
    }
  } else if (mode === "branch") {
    // Priority patterns for branch names
    const patterns = [
      /^(\d{1,7})[-_]/, // Start with number: 123-feature, 123_feature
      /\/(\d{1,7})[-_]/, // After slash: feat/123-desc, feat/123_desc
      /#(\d{1,7})(?:\b|$)/, // With hash: #123, feat/#123-desc
      /[-_](\d{1,7})[-_]/, // After hyphen/underscore: feature-123-, issue_123-
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        const issueNumber = Number.parseInt(match[1], 10);
        if (issueNumber > 0 && issueNumber <= 9999999) {
          numbers.add(issueNumber);
          break; // Use first match only for branch mode
        }
      }
    }
  }

  return Array.from(numbers);
}
