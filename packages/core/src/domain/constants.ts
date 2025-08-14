// Constants for issue-linker

import type { CheckMode } from "./validation-schemas.js";

// ===== Exclude Patterns (Glob) =====

/**
 * Exclude patterns for each check mode using glob syntax (minimatch)
 */
export const EXCLUDE_PATTERNS: Record<CheckMode, string | undefined> = {
  default: undefined,
  branch:
    "{main,master,develop,release/**,renovate/**,dependabot/**,release-please*,snyk/**,imgbot/**,all-contributors/**}",
  commit:
    "{Rebase*,Merge*,Revert*,fixup!*,squash!*,Applied suggestion*,Apply automatic changes,Automated Change*,Update branch*,Auto-merge*,(cherry picked from commit*,Initial commit,Update README.md,Update *.md,Updated content}",
} as const;

// ===== Extract Patterns (RegExp) =====

/**
 * Extract patterns for issue numbers using regular expressions
 * All patterns should capture the issue number in group 1
 */
export const EXTRACT_PATTERNS: Record<CheckMode, RegExp> = {
  default: /#(\d+)/g, // #123 format only
  commit: /#(\d+)/g, // Same as default
  branch: /(?<![.\d])(\d{1,7})(?![.\d])/g, // Numbers not in version strings (e.g., v2.0)
} as const;

// ===== Skip Markers =====

/**
 * Skip markers that bypass validation entirely
 * Case-insensitive patterns to match skip markers with space or hyphen
 */
export const SKIP_MARKERS = [
  /\[skip issue-linker\]/i,
  /\[issue-linker skip\]/i,
  /\[skip-issue-linker\]/i,
  /\[issue-linker-skip\]/i,
] as const;
