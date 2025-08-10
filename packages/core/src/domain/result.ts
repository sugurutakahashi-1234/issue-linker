// Unified result type for issue validation

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

// Validation reason for quick categorization
export type ValidationReason =
  | "excluded" // Text was excluded from validation
  | "valid" // Valid issues were found
  | "no-issues" // No issue numbers found in text
  | "invalid-issues" // Issues found but invalid
  | "error"; // Error occurred during validation

// Unified result type used across all layers (core, cli, action)
export interface IssueValidationResult {
  // Basic information (required)
  success: boolean;
  message: string;
  reason: ValidationReason;

  // Input information (complete record of what was executed)
  input: InputConfig;

  // Issue information (only when issues are found)
  issues?: IssueInfo;

  // Error information (only on errors)
  error?: ErrorInfo;
}
