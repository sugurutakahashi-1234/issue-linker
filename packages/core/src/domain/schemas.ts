// Domain layer - Business rules constants

import type { ExtractionMode } from "./types.js";

/**
 * Default exclude patterns for each extraction mode
 */
export const DEFAULT_EXCLUDE_PATTERNS: Record<ExtractionMode, string | null> = {
  default: null,
  branch: "{main,master,develop,release/*,hotfix/*}",
  commit: null, // Will check message prefix instead
};

/**
 * Commit message prefixes to exclude from validation
 */
export const EXCLUDED_COMMIT_PREFIXES = [
  "Rebase",
  "Merge",
  "Revert",
  "fixup!",
  "squash!",
];
