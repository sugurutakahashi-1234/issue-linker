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
  CheckMessageOptions,
  CheckOptions,
  CheckReason,
  CheckResult,
  ExtractionMode,
  GitHubRepository,
  Issue,
  IssueStatus,
  IssueStatusFilter,
} from "./domain/types.js";

// Infrastructure layer exports (if needed by external packages)
// None for now

// Application layer exports
/** @public */
export { checkMessage } from "./application/check-message-use-case.js";
