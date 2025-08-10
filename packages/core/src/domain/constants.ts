// Constants for issue-linker

import type { IssueStatusFilter } from "./validation-schemas.js";

/**
 * Default values for check options
 */
export const DEFAULT_CHECK_OPTIONS = {
  /** Default glob pattern to exclude branches */
  excludePattern: "{main,master,develop}",
  /** Default issue status filter */
  issueStatus: "all" as IssueStatusFilter,
} as const;
