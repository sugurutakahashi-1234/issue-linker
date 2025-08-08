// Core package - Main exports

// Re-export constants
/** @public */
export { DEFAULT_CHECK_OPTIONS } from "./constants.js";
/** @public */
export type {
  CheckOptions,
  CheckResult,
  IssueState,
  IssueStateFilter,
} from "./types.js";

// Re-export only what's needed by API package
/** @public */
export { checkBranch } from "./use-cases/check-branch.js";
