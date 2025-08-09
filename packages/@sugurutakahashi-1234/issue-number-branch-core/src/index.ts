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
  CheckOptions,
  CheckReason,
  CheckResult,
  GitHubRepository,
  Issue,
  IssueStatus,
  IssueStatusFilter,
} from "./domain/types.js";

// Infrastructure layer exports (if needed by external packages)
// None for now

// Application layer exports
/** @public */
export { checkBranch } from "./application/check-branch-use-case.js";
