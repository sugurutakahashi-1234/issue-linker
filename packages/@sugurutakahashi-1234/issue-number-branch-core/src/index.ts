// Core package - Main exports

// Re-export constants
/** @public */
export { DEFAULT_CHECK_OPTIONS } from "./constants.js";

// Re-export error classes
/** @public */
export {
  GitError,
  GitHubError,
  IssueNotFoundError,
  ValidationError,
} from "./domain/errors.js";

// Re-export types
/** @public */
export type {
  CheckOptions,
  CheckReason,
  CheckResult,
  IssueState,
  IssueStateFilter,
} from "./types.js";

// Re-export only what's needed by API package
/** @public */
export { checkBranch } from "./use-cases/check-branch.js";
