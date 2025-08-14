// Application layer - Use case for creating issue comments

import * as v from "valibot";
import type { CreateIssueCommentResult } from "../domain/result.js";
import {
  type CreateIssueCommentArgs,
  CreateIssueCommentArgsSchema,
  type ValidatedCreateIssueCommentArgs,
} from "../domain/validation-schemas.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { createIssueComment as createGitHubComment } from "../infrastructure/github-client.js";
import { parseRepositoryString } from "../infrastructure/repository-parser.js";

/**
 * Create a comment on a GitHub issue
 * @param args - Arguments for creating the comment
 * @returns Result of the comment creation
 */
export async function createIssueComment(
  args: CreateIssueCommentArgs,
): Promise<CreateIssueCommentResult> {
  // Step 1: Validate args
  const validationResult = v.safeParse(CreateIssueCommentArgsSchema, args);
  if (!validationResult.success) {
    return {
      success: false,
      message: `Invalid arguments: ${validationResult.issues[0]?.message ?? "Unknown error"}`,
      error: {
        type: "validation-error",
        message:
          validationResult.issues[0]?.message ?? "Invalid arguments provided",
      },
    };
  }

  const validatedArgs: ValidatedCreateIssueCommentArgs =
    validationResult.output;

  // Step 2: Parse repository string
  const { owner, repo } = parseRepositoryString(validatedArgs.repo);

  // Step 3: Get GitHub token (from args or environment)
  const token = validatedArgs.githubToken ?? getGitHubToken();
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
    const commentId = await createGitHubComment(
      owner,
      repo,
      validatedArgs.issueNumber,
      validatedArgs.body,
      token,
      validatedArgs.hostname,
    );

    return {
      success: true,
      message: `Comment created successfully on issue #${validatedArgs.issueNumber}`,
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
