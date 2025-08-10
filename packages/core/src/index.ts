// Core package - Main exports

// Domain layer exports
/** @public */
export { DEFAULT_CHECK_OPTIONS } from "./domain/constants.js";

/** @public */
export {
  GitError,
  GitHubError,
  IssueNotFoundError,
  ValidationError,
} from "./domain/errors.js";

/** @public */
export type {
  ErrorInfo,
  InputConfig,
  IssueInfo,
  IssueValidationResult,
  ValidationReason,
} from "./domain/result.js";

/** @public */
export type {
  ActionMode,
  CheckMessageOptions,
  ExtractionMode,
  GetPullRequestCommitsOptions,
  GitHubRepository,
  Issue,
  IssueStatus,
  IssueStatusFilter,
  PullRequestCommit,
} from "./domain/validation-schemas.js";

/** @public */
export {
  CheckMessageOptionsSchema,
  ExtractionModeSchema,
  GetPullRequestCommitsOptionsSchema,
  IssueStatusFilterSchema,
} from "./domain/validation-schemas.js";

// Infrastructure layer exports (if needed by external packages)
// None for now

// Application layer exports
/** @public */
export { checkMessage } from "./application/check-message-use-case.js";

/** @public */
export { getPullRequestCommits } from "./application/get-pull-request-commits-use-case.js";
