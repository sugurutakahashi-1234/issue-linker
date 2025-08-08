// Domain layer - Pure validation functions

import micromatch from "micromatch";
import type { IssueState, IssueStateFilter } from "../types.js";

/**
 * Validates if a branch should be excluded from validation
 * @param branch - The branch name to check
 * @param pattern - Glob pattern for exclusion
 * @returns true if branch should be excluded
 */
export function validateBranchExclusion(
  branch: string,
  pattern: string,
): boolean {
  if (!pattern) return false;
  return micromatch.isMatch(branch, pattern);
}

/**
 * Validates if an issue state is allowed
 * @param state - The issue state to check
 * @param filter - Issue state filter ("all", "open", or "closed")
 * @returns true if state is allowed
 */
export function validateIssueState(
  state: string,
  filter: IssueStateFilter,
): boolean {
  const normalizedState = state.toLowerCase() as IssueState;

  if (filter === "all") {
    return true;
  }

  return normalizedState === filter;
}
