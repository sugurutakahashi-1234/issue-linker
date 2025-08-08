// Constants for issue-number-branch

import type { IssueStateFilter } from "./types.js";

/**
 * Default values for check options
 */
export const DEFAULT_CHECK_OPTIONS = {
  /** Default glob pattern to exclude branches */
  excludePattern: "{main,master,develop}",
  /** Default issue state filter */
  issueState: "all" as IssueStateFilter,
} as const;
