// Core package - Main exports

// Domain layer exports
/** @public */
export {
  GitError,
  GitHubError,
  IssueNotFoundError,
  ValidationError,
} from "./domain/errors.js";
/** @public */
export type {
  BaseResult,
  BatchCommentItemResult,
  CheckDuplicateCommentResult,
  CheckMessageResult,
  CommentOnBranchIssuesResult,
  CreateIssueCommentResult,
  ErrorInfo,
  InputConfig,
  IssueInfo,
  ValidationReason,
} from "./domain/result.js";
/** @public */
export type {
  ActionMode,
  CheckDuplicateCommentArgs,
  CheckMessageArgs,
  CheckMode,
  CommentOnBranchIssuesArgs,
  CreateIssueCommentArgs,
  GetPullRequestCommitsArgs,
  GitHubRepository,
  Issue,
  IssueStatus,
  IssueStatusFilter,
  PullRequestCommit,
} from "./domain/validation-schemas.js";
/** @public */
export {
  CheckDuplicateCommentArgsSchema,
  CheckMessageArgsSchema,
  CheckModeSchema,
  CommentOnBranchIssuesArgsSchema,
  CreateIssueCommentArgsSchema,
  GetPullRequestCommitsArgsSchema,
  IssueStatusFilterSchema,
} from "./domain/validation-schemas.js";

// Infrastructure layer exports (if needed by external packages)
// None for now

// Application layer exports
/** @public */
export { checkDuplicateComment } from "./application/check-duplicate-comment-use-case.js";

/** @public */
export { checkMessage } from "./application/check-message-use-case.js";

/** @public */
export { commentOnBranchIssues } from "./application/comment-on-branch-issues-use-case.js";

/** @public */
export { createIssueComment } from "./application/create-issue-comment-use-case.js";

/** @public */
export { getPullRequestCommits } from "./application/get-pull-request-commits-use-case.js";
