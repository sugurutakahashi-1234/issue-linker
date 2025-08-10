// Infrastructure layer - Validation functions

import micromatch from "micromatch";
import { minimatch } from "minimatch";
import {
  DEFAULT_EXCLUDE_PATTERNS,
  EXCLUDED_COMMIT_PREFIXES,
} from "../domain/schemas.js";
import type {
  ExtractionMode,
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
 * @param mode - The extraction mode
 * @param customExclude - Optional custom exclude pattern
 * @returns true if text should be excluded
 */
export function shouldExclude(
  text: string,
  mode: ExtractionMode,
  customExclude?: string,
): boolean {
  // Use custom exclude pattern if provided
  if (customExclude) {
    return minimatch(text, customExclude);
  }

  // Check mode-specific default exclusions
  if (mode === "branch") {
    const defaultPattern = DEFAULT_EXCLUDE_PATTERNS.branch;
    if (defaultPattern) {
      return minimatch(text, defaultPattern);
    }
  } else if (mode === "commit") {
    // Check if commit message starts with excluded prefix
    return EXCLUDED_COMMIT_PREFIXES.some((prefix) => text.startsWith(prefix));
  }

  return false;
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
