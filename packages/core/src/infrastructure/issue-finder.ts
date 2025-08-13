// Infrastructure layer - Issue number finding

import { EXTRACT_PATTERNS } from "../domain/constants.js";
import type { CheckMode } from "../domain/validation-schemas.js";

/**
 * Find issue numbers from text based on check mode or custom pattern
 * @param text - The text to search in
 * @param checkMode - The check mode ("default", "branch", or "commit")
 * @param customPattern - Optional custom extraction pattern (overrides mode default)
 * @returns Array of unique issue numbers found
 */
export function findIssueNumbers(
  text: string,
  checkMode: CheckMode,
  customPattern?: string,
): number[] {
  const numbers = new Set<number>();

  // Use custom pattern if provided, otherwise use mode default
  let pattern: RegExp;
  if (customPattern) {
    try {
      // Ensure the pattern has global flag
      pattern = new RegExp(customPattern, "g");
    } catch (error) {
      // If invalid regex, throw error with helpful message
      throw new Error(
        `Invalid extraction pattern: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else {
    pattern = EXTRACT_PATTERNS[checkMode];
  }

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
