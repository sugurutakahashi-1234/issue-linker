// Pure functions only (no I/O operations)

import micromatch from "micromatch";

/** @public */
export type AllowedState = "open" | "closed";

/** @public */
export function isExcluded(branch: string, excludeGlob: string): boolean {
  const patterns = excludeGlob
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (patterns.length === 0) return false;
  return micromatch.isMatch(branch, patterns);
}

/** @public */
export function extractIssueNumbers(branch: string): number[] {
  const set = new Set<number>();
  const re = /\d{1,7}/g;
  for (const m of branch.matchAll(re)) {
    set.add(Number(m[0]));
  }
  return [...set];
}

// TODO: Add more detailed error handling
// TODO: Consider supporting JIRA format (ABC-123) in future versions
