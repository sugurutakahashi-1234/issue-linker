// Infrastructure layer - Issue number finding

import { EXTRACT_PATTERNS } from "../domain/constants.js";
import type { CheckMode } from "../domain/validation-schemas.js";

/**
 * Find issue numbers from text based on check mode
 * @param text - The text to search in
 * @param checkMode - The check mode ("default", "branch", or "commit")
 * @returns Array of unique issue numbers found
 */
export function findIssueNumbers(text: string, checkMode: CheckMode): number[] {
  const numbers = new Set<number>();
  const pattern = EXTRACT_PATTERNS[checkMode];
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

  return Array.from(numbers);
}
