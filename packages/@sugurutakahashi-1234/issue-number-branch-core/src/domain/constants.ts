// Constants for issue-number-branch

import type { IssueStatusFilter } from "./types.js";

/**
 * Default values for check options
 */
export const DEFAULT_CHECK_OPTIONS = {
  /** Default glob pattern to exclude branches */
  excludePattern: "{main,master,develop}",
  /** Default issue status filter */
  issueStatus: "all" as IssueStatusFilter,
} as const;
