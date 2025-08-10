// Constants for issue-linker

import type { CheckMode, IssueStatusFilter } from "./validation-schemas.js";

// ===== Type Definitions =====

/**
 * Exclude rule types for different check modes
 */
type ExcludeRule =
  | { type: "none" }
  | { type: "pattern"; value: string }
  | { type: "prefixes"; values: readonly string[] };

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
 * Defines how each mode handles exclusions
 */
export const EXCLUDE_RULES: Record<CheckMode, ExcludeRule> = {
  default: {
    type: "none",
  },
  branch: {
    type: "pattern",
    value: "{main,master,develop,release/*,hotfix/*}",
  },
  commit: {
    type: "prefixes",
    values: ["Rebase", "Merge", "Revert", "fixup!", "squash!"] as const,
  },
} as const;
