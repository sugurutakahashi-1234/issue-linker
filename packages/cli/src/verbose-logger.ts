// Verbose output formatter for CLI

import type { CheckMessageResult } from "@issue-linker/core";

/**
 * Print verbose details for validation results
 * @param result - The validation result
 * @param logger - The logging function to use (console.log or console.error)
 */
export function printVerboseDetails(
  result: CheckMessageResult,
  logger: typeof console.log | typeof console.error,
): void {
  // Text preview (first 50 chars)
  const textPreview = result.input.text.replace(/\n/g, " ").substring(0, 50);
  const textDisplay =
    result.input.text.length > 50 ? `${textPreview}...` : textPreview;
  logger(`   Text: "${textDisplay}"`);

  // Check mode (show if not default)
  if (result.input.checkMode !== "default") {
    logger(`   Check mode: ${result.input.checkMode}`);
  }

  // Extract pattern (show if custom)
  if (result.input.extract) {
    logger(`   Extract pattern: "${result.input.extract}"`);
  }

  // Exclude pattern (show if set)
  if (result.input.exclude) {
    logger(`   Exclude pattern: "${result.input.exclude}"`);
  }

  // Issue status filter
  logger(`   Issue status: ${result.input.issueStatus}`);

  // Repository
  logger(`   Repository: ${result.input.repo}`);

  // Issue details (only for failed validations)
  if (result.issues && !result.success) {
    const details = [];

    if (result.issues.valid.length > 0) {
      details.push(`Valid issues: #${result.issues.valid.join(", #")}`);
    }
    if (result.issues.notFound.length > 0) {
      details.push(`Issues not found: #${result.issues.notFound.join(", #")}`);
    }
    if (result.issues.wrongState.length > 0) {
      const wrongStateMessages = result.issues.wrongState.map((issue) => {
        const expected =
          result.input.issueStatus === "all"
            ? ""
            : ` (expected: ${result.input.issueStatus})`;
        return `#${issue.number} is ${issue.actualState}${expected}`;
      });
      details.push(`Wrong state: ${wrongStateMessages.join(", ")}`);
    }

    if (details.length > 0) {
      logger(`   Details: ${details.join(", ")}`);
    }
  }
}
