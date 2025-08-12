// Application layer - Use case for commenting on multiple issues when a branch is created

import * as v from "valibot";
import type {
  BatchCommentItemResult,
  CommentOnBranchIssuesResult,
} from "../domain/result.js";
import {
  type CommentOnBranchIssuesOptions,
  CommentOnBranchIssuesOptionsSchema,
} from "../domain/validation-schemas.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { checkDuplicateComment } from "./check-duplicate-comment-use-case.js";
import { createIssueComment } from "./create-issue-comment-use-case.js";

/**
 * Comment on multiple issues when a branch referencing them is pushed
 * @param options - Options for commenting on issues
 * @returns Result of the batch comment operation
 */
export async function commentOnBranchIssues(
  options: CommentOnBranchIssuesOptions,
): Promise<CommentOnBranchIssuesResult> {
  // Step 1: Validate options
  const validationResult = v.safeParse(
    CommentOnBranchIssuesOptionsSchema,
    options,
  );
  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid options provided",
      results: [],
    };
  }

  const validatedOptions = validationResult.output;

  // Step 2: Get GitHub token
  const githubToken = validatedOptions.githubToken ?? getGitHubToken();

  // Step 3: Build comment body and marker
  const marker = `<!-- issue-linker:branch:${validatedOptions.branchName} -->`;
  const commentBody = `🚀 Development started on branch \`${validatedOptions.branchName}\`\n${marker}`;

  // Step 4: Comment on each issue (in parallel)
  const results = await Promise.all(
    validatedOptions.issueNumbers.map(
      async (issueNumber): Promise<BatchCommentItemResult> => {
        try {
          // Check for duplicate comment
          const duplicateCheck = await checkDuplicateComment({
            repo: validatedOptions.repo,
            issueNumber,
            marker,
            githubToken,
            hostname: validatedOptions.hostname,
          });

          if (duplicateCheck.duplicateFound) {
            return {
              issueNumber,
              success: true,
              skipped: true,
              message: "Duplicate comment already exists",
            };
          }

          // Create comment
          const commentResult = await createIssueComment({
            repo: validatedOptions.repo,
            issueNumber,
            body: commentBody,
            githubToken,
            hostname: validatedOptions.hostname,
          });

          if (commentResult.success) {
            return {
              issueNumber,
              success: true,
              message: commentResult.message,
              ...(commentResult.commentId && {
                commentId: commentResult.commentId,
              }),
            };
          }

          return {
            issueNumber,
            success: false,
            ...(commentResult.error && { error: commentResult.error }),
          };
        } catch (error) {
          // Handle unexpected errors
          return {
            issueNumber,
            success: false,
            error: {
              type: "unknown",
              message: error instanceof Error ? error.message : String(error),
            },
          };
        }
      },
    ),
  );

  // Step 5: Return results
  const hasFailures = results.some((r) => !r.success);

  return {
    success: !hasFailures,
    message: `Processed ${validatedOptions.issueNumbers.length} issue(s)`,
    results,
  };
}
