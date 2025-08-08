// Core package - Main exports

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
