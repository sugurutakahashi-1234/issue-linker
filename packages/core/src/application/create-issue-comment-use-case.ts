// Application layer - Use case for creating issue comments

import * as v from "valibot";
import type { CommentResult } from "../domain/result.js";
import {
  type CreateIssueCommentOptions,
  CreateIssueCommentOptionsSchema,
} from "../domain/validation-schemas.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { createGitHubIssueComment } from "../infrastructure/github-client.js";
import { parseRepositoryString } from "../infrastructure/repository-parser.js";

/**
 * Create a comment on a GitHub issue
 * @param options - Options for creating the comment
 * @returns Result of the comment creation
 */
export async function createIssueComment(
  options: CreateIssueCommentOptions,
): Promise<CommentResult> {
  // Step 1: Validate options
  const validationResult = v.safeParse(
    CreateIssueCommentOptionsSchema,
    options,
  );
  if (!validationResult.success) {
    return {
      success: false,
      message: `Invalid options: ${validationResult.issues[0]?.message ?? "Unknown error"}`,
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
    return {
      success: false,
      message: "GitHub token is required for commenting on issues",
      error: {
        type: "auth-error",
        message: "No GitHub token provided or found in environment",
      },
    };
  }

  try {
    // Step 4: Create the comment
    const commentId = await createGitHubIssueComment(
      owner,
      repo,
      validatedOptions.issueNumber,
      validatedOptions.body,
      token,
      validatedOptions.hostname,
    );

    return {
      success: true,
      message: `Comment created successfully on issue #${validatedOptions.issueNumber}`,
      commentId,
    };
  } catch (error: unknown) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to create comment: ${errorMessage}`,
      error: {
        type: "api-error",
        message: errorMessage,
      },
    };
  }
}
