// Application layer - Use case for commenting on multiple issues when a branch is created

import * as v from "valibot";
import type {
  CommentOnBranchIssuesResult,
  CommentOnIssueResult,
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
      totalIssues: 0,
      commented: 0,
      skipped: 0,
      failed: 0,
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
      async (issueNumber): Promise<CommentOnIssueResult> => {
        try {
          // Check for duplicate comment
          const duplicateCheck = await checkDuplicateComment({
            repo: validatedOptions.repo,
            issueNumber,
            marker,
            githubToken,
            hostname: validatedOptions.hostname,
          });

          if (duplicateCheck.isDuplicate) {
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
            error: commentResult.message,
          };
        } catch (error) {
          // Handle unexpected errors
          return {
            issueNumber,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    ),
  );

  // Step 5: Calculate summary
  const commented = results.filter((r) => r.success && !r.skipped).length;
  const skipped = results.filter((r) => r.success && r.skipped).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    success: failed === 0,
    totalIssues: validatedOptions.issueNumbers.length,
    commented,
    skipped,
    failed,
    results,
  };
}
