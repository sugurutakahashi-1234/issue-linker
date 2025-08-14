// Infrastructure layer - Validation functions

import micromatch from "micromatch";
import { EXCLUDE_PATTERNS } from "../domain/constants.js";
import type {
  CheckMode,
  IssueStatus,
  IssueStatusFilter,
} from "../domain/validation-schemas.js";

/**
 * Validates if a branch should be excluded from validation
 * @param branch - The branch name to check
 * @param pattern - Glob pattern for exclusion
 * @returns true if branch should be excluded
 */
export function isBranchExcluded(branch: string, pattern: string): boolean {
  if (!pattern) return false;
  return micromatch.isMatch(branch, pattern);
}

/**
 * Check if text should be excluded based on mode and pattern
 * @param text - The text to check
 * @param checkMode - The check mode
 * @param customExclude - Optional custom exclude pattern
 * @returns Object with exclusion status and the pattern used
 */
export function shouldExclude(
  text: string,
  checkMode: CheckMode,
  customExclude?: string,
): { excluded: boolean; pattern?: string } {
  // Use custom exclude pattern if provided, otherwise use mode-specific default
  const pattern = customExclude ?? EXCLUDE_PATTERNS[checkMode];

  // No pattern means no exclusion
  if (!pattern) {
    return { excluded: false };
  }

  const excluded = micromatch.isMatch(text, pattern);
  return excluded ? { excluded, pattern } : { excluded };
}

/**
 * Validates if an issue state is allowed
 * @param state - The issue state to check
 * @param filter - Issue state filter ("all", "open", or "closed")
 * @returns true if state is allowed
 */
export function isIssueStateAllowed(
  state: string,
  filter: IssueStatusFilter,
): boolean {
  const normalizedState = state.toLowerCase() as IssueStatus;

  if (filter === "all") {
    return true;
  }

  return normalizedState === filter;
}
