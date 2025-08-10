// Infrastructure layer - Issue number finding

import type { CheckMode } from "../domain/validation-schemas.js";

/**
 * Find issue numbers from text based on check mode
 * @param text - The text to search in
 * @param checkMode - The check mode ("default", "branch", or "commit")
 * @returns Array of unique issue numbers found
 */
export function findIssueNumbers(text: string, checkMode: CheckMode): number[] {
  const numbers = new Set<number>();

  if (checkMode === "default" || checkMode === "commit") {
    // Find #123 format only
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
  } else if (checkMode === "branch") {
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
