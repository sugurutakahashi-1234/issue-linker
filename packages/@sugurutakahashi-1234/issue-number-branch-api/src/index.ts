// API package - Thin wrapper for Core functionality

// Re-export only what's needed by CLI and Action
/** @public */
export {
  type CheckOptions,
  type CheckResult,
  checkBranch,
  type IssueState,
  type IssueStateFilter,
} from "@sugurutakahashi-1234/issue-number-branch-core";
