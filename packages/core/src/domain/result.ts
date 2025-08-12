// Result types for use cases

import type {
  ActionMode,
  CheckMode,
  IssueStatusFilter,
} from "./validation-schemas.js";

// Input configuration that was used for validation
export interface InputConfig {
  text: string;
  checkMode: CheckMode;
  exclude?: string;
  issueStatus: IssueStatusFilter;
  repo: string;
  // Note: githubToken is intentionally not stored for security reasons
  /**
   * Action mode - Used only by GitHub Actions to track where the validation was triggered from.
   * This field is for telemetry/logging purposes only and does not affect the validation logic.
   * @internal
   */
  actionMode?: ActionMode;
}

// Issue information when issues are found
export interface IssueInfo {
  found: number[]; // All issue numbers found in text
  valid: number[]; // Issues that exist and match status filter
  notFound: number[]; // Issues that don't exist in repository
  wrongState: number[]; // Issues with wrong state (e.g., closed when open required)
}

// Error information when validation fails
export interface ErrorInfo {
  type: string;
  message: string;
  stack?: string;
}

// Base result interface for all use cases
export interface BaseResult {
  success: boolean;
  message: string;
  error?: ErrorInfo;
}

// Validation reason for quick categorization
export type ValidationReason =
  | "excluded" // Text was excluded from validation
  | "valid" // Valid issues were found
  | "no-issues" // No issue numbers found in text
  | "invalid-issues" // Issues found but invalid
  | "error"; // Error occurred during validation

// Result type for checkMessage use case
export interface CheckMessageResult extends BaseResult {
  reason: ValidationReason;
  input: InputConfig;
  issues?: IssueInfo;
}

// Result type for createIssueComment use case
export interface CreateIssueCommentResult extends BaseResult {
  commentId?: number;
}

// Result type for checkDuplicateComment use case
export interface CheckDuplicateCommentResult {
  duplicateFound: boolean;
  duplicateCommentId?: number;
  error?: ErrorInfo;
}

// Individual result item for batch comment operations
export interface BatchCommentItemResult {
  issueNumber: number;
  success: boolean;
  skipped?: boolean;
  message?: string;
  commentId?: number;
  error?: ErrorInfo;
}

// Result type for commentOnBranchIssues use case
export interface CommentOnBranchIssuesResult extends BaseResult {
  totalIssues: number;
  commented: number;
  skipped: number;
  failed: number;
  results: BatchCommentItemResult[];
}
