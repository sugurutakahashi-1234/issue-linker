// Constants for issue-linker

import type { CheckMode, IssueStatusFilter } from "./validation-schemas.js";

// ===== Default Values =====

/**
 * Default options for all check operations
 * Single source of truth for all default values
 */
export const DEFAULT_OPTIONS = {
  /** Default check mode */
  mode: "default" as CheckMode,
  /** Default issue status filter */
  issueStatus: "all" as IssueStatusFilter,
  /** Default exclude pattern (undefined means no exclusion) */
  exclude: undefined as string | undefined,
  /** Default repository (undefined means auto-detect from git) */
  repo: undefined as string | undefined,
  /** Default GitHub token (undefined means use environment variable) */
  githubToken: undefined as string | undefined,
} as const;

// ===== Exclude Patterns (Glob) =====

/**
 * Mode-specific exclude patterns using glob syntax (minimatch)
 */
export const MODE_EXCLUDE_GLOBS: Record<CheckMode, string | undefined> = {
  default: undefined,
  branch:
    "{main,master,develop,release/**,renovate/**,dependabot/**,release-please*,snyk/**,imgbot/**,all-contributors/**}",
  commit:
    "{Rebase*,Merge*,Revert*,fixup!*,squash!*,Applied suggestion*,Apply automatic changes,Automated Change*,Update branch*,Auto-merge*,(cherry picked from commit*,Initial commit,Update README.md,Update *.md,Updated content}",
} as const;

// ===== Extract Patterns (RegExp) =====

/**
 * Mode-specific issue number extraction using regular expressions
 * All patterns should capture the issue number in group 1
 */
export const MODE_EXTRACT_REGEXES: Record<CheckMode, RegExp> = {
  default: /#(\d+)/g, // #123 format only
  commit: /#(\d+)/g, // Same as default
  branch: /(?<![.\d])(\d{1,7})(?![.\d])/g, // Numbers not in version strings (e.g., v2.0)
} as const;

// ===== Skip Markers =====

/**
 * Skip markers that bypass validation entirely
 * Case-insensitive patterns to match [skip issue-linker] and [issue-linker skip]
 */
export const SKIP_MARKERS = [
  /\[skip issue-linker\]/i,
  /\[issue-linker skip\]/i,
] as const;
