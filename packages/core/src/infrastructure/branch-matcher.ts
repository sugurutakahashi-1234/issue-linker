// Infrastructure layer - Validation functions

import micromatch from "micromatch";
import type { IssueStatus, IssueStatusFilter } from "../domain/types.js";

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
