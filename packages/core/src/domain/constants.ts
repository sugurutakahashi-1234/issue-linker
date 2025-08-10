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

// ===== Exclude Rules =====

/**
 * Mode-specific exclude rules
 * All patterns use minimatch syntax
 */
export const EXCLUDE_RULES: Record<CheckMode, string | undefined> = {
  default: undefined,
  branch: "{main,master,develop,release/*,hotfix/*}",
  commit: "{Rebase*,Merge*,Revert*,fixup!*,squash!*}",
} as const;
