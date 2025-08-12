// Factory functions for creating CheckMessageResult objects

import type {
  CheckMessageResult,
  ErrorInfo,
  InputConfig,
  IssueInfo,
} from "./result.js";

/**
 * Create a result for when text is excluded from validation
 */
export function createExcludedResult(input: InputConfig): CheckMessageResult {
  return {
    success: true,
    message: "Text was excluded from validation",
    reason: "excluded",
    input,
  };
}

/**
 * Create a result for when no issue numbers are found
 */
export function createNoIssuesResult(input: InputConfig): CheckMessageResult {
  return {
    success: false,
    message: "No issue number found in text",
    reason: "no-issues",
    input,
  };
}

/**
 * Create a result for when valid issues are found
 */
export function createValidResult(
  issues: IssueInfo,
  input: InputConfig,
): CheckMessageResult {
  return {
    success: true,
    message: `Valid issue(s) found: #${issues.valid.join(", #")} in ${input.repo}`,
    reason: "valid",
    input,
    issues,
  };
}

/**
 * Create a result for when invalid issues are found
 */
export function createInvalidResult(
  issues: IssueInfo,
  input: InputConfig,
): CheckMessageResult {
  // Build detailed message
  const parts: string[] = [];

  if (issues.notFound.length > 0) {
    parts.push(`Issues not found: #${issues.notFound.join(", #")}`);
  }

  if (issues.wrongState.length > 0) {
    parts.push(`Wrong state: #${issues.wrongState.join(", #")}`);
  }

  const message = `${parts.join("; ")} in ${input.repo}`;

  return {
    success: false,
    message,
    reason: "invalid-issues",
    input,
    issues,
  };
}

/**
 * Create a result for when an error occurs
 */
export function createErrorResult(
  error: Error | unknown,
  input: InputConfig,
): CheckMessageResult {
  const errorInfo: ErrorInfo = {
    type: error instanceof Error ? error.constructor.name : "UnknownError",
    message: error instanceof Error ? error.message : String(error),
    ...(error instanceof Error && error.stack && { stack: error.stack }),
  };

  return {
    success: false,
    message: errorInfo.message,
    reason: "error",
    input,
    error: errorInfo,
  };
}
