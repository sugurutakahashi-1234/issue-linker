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
    // Extract all issue numbers from branch name
    // Common patterns: 123-456-feature, feat/123-124, issue-123-456-fix
    // Use negative lookbehind/lookahead to avoid matching numbers in version strings like "v2.0"
    const pattern = /(?<![.\d])(\d{1,7})(?![.\d])/g;
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      const num = match[1];
      if (num) {
        const issueNumber = Number.parseInt(num, 10);
        if (issueNumber > 0 && issueNumber <= 9999999) {
          numbers.add(issueNumber);
        }
      }
    }
  }

  return Array.from(numbers);
}
