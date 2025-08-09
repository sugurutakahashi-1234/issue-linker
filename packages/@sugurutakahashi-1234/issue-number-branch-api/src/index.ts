// API package - Thin wrapper for Core functionality

// Re-export only what's needed by CLI and Action
/** @public */
export {
  type CheckOptions,
  type CheckResult,
  checkBranch,
  DEFAULT_CHECK_OPTIONS,
  GitError,
  GitHubError,
  IssueNotFoundError,
  type IssueState,
  type IssueStateFilter,
  ValidationError,
} from "@sugurutakahashi-1234/issue-number-branch-core";
