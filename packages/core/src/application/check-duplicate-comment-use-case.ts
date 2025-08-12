// Application layer - Use case for checking duplicate comments

import * as v from "valibot";
import type { CheckDuplicateCommentResult } from "../domain/result.js";
import {
  type CheckDuplicateCommentOptions,
  CheckDuplicateCommentOptionsSchema,
} from "../domain/validation-schemas.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { listGitHubIssueComments } from "../infrastructure/github-client.js";
import { parseRepositoryString } from "../infrastructure/repository-parser.js";

/**
 * Check if a comment with a specific marker already exists on an issue
 * @param options - Options for checking duplicate comments
 * @returns Result indicating if a duplicate exists
 */
export async function checkDuplicateComment(
  options: CheckDuplicateCommentOptions,
): Promise<CheckDuplicateCommentResult> {
  // Step 1: Validate options
  const validationResult = v.safeParse(
    CheckDuplicateCommentOptionsSchema,
    options,
  );
  if (!validationResult.success) {
    return {
      duplicateFound: false,
      error: {
        type: "validation-error",
        message:
          validationResult.issues[0]?.message ?? "Invalid options provided",
      },
    };
  }

  const validatedOptions = validationResult.output;

  // Step 2: Parse repository string
  const { owner, repo } = parseRepositoryString(validatedOptions.repo);

  // Step 3: Get GitHub token (from options or environment)
  const token = validatedOptions.githubToken ?? getGitHubToken();
  if (!token) {
    // Without a token, we can't check for duplicates, so assume no duplicate
    // This allows the flow to continue but may result in duplicate comments
    return {
      duplicateFound: false,
      error: {
        type: "auth-warning",
        message: "No GitHub token available to check for duplicates",
      },
    };
  }

  try {
    // Step 4: Get existing comments
    const comments = await listGitHubIssueComments(
      owner,
      repo,
      validatedOptions.issueNumber,
      token,
      validatedOptions.hostname,
    );

    // Step 5: Check for marker in comments
    const duplicateComment = comments.find((comment) =>
      comment.body.includes(validatedOptions.marker),
    );

    if (duplicateComment) {
      return {
        duplicateFound: true,
        duplicateCommentId: duplicateComment.id,
      };
    }

    return {
      duplicateFound: false,
    };
  } catch (error: unknown) {
    // On error, assume no duplicate to allow the flow to continue
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      duplicateFound: false,
      error: {
        type: "api-error",
        message: errorMessage,
      },
    };
  }
}
