// Application layer - Use case for checking commit messages

import * as v from "valibot";
import { DEFAULT_CHECK_OPTIONS } from "../domain/constants.js";
import { IssueNotFoundError } from "../domain/errors.js";
import type { CheckOptions, CheckResult } from "../domain/types.js";
import { CheckOptionsSchema } from "../domain/validation-schemas.js";
import { isIssueStateAllowed } from "../infrastructure/branch-matcher.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { getGitRemoteUrl } from "../infrastructure/git-client.js";
import { parseRepositoryFromGitUrl } from "../infrastructure/git-url-parser.js";
import { getGitHubIssue } from "../infrastructure/github-client.js";
import { parseRepositoryString } from "../infrastructure/repository-parser.js";

/**
 * Extract issue numbers from commit message
 * @param message - Commit message to check
 * @returns Array of issue numbers found
 */
function extractIssueNumbersFromCommit(message: string): number[] {
  // Match patterns like #123, GH-123, closes #123, fixes #123, etc.
  const patterns = [
    /#(\d+)/g, // #123
    /(?:closes?|fix(?:es)?|resolves?|refs?)\s+#(\d+)/gi, // closes #123, fixes #123
    /GH-(\d+)/gi, // GH-123
  ];

  const issueNumbers = new Set<number>();

  for (const pattern of patterns) {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      const num = match[1];
      if (num) {
        issueNumbers.add(Number.parseInt(num, 10));
      }
    }
  }

  return Array.from(issueNumbers);
}

/**
 * Main use case for checking if a commit message contains valid issue numbers
 * @param message - Commit message to check
 * @param options - Options for the check
 * @returns Result of the check
 */
export async function checkCommit(
  message: string,
  options: Omit<CheckOptions, "branch" | "excludePattern"> = {},
): Promise<CheckResult> {
  // Step 1: Validate options
  const validationResult = v.safeParse(CheckOptionsSchema, {
    ...options,
    branch: "dummy", // Not used for commit checks
  });

  if (!validationResult.success) {
    return {
      success: false,
      reason: "error",
      branch: "commit",
      message:
        validationResult.issues[0]?.message ?? "Invalid options provided",
    };
  }

  const opts = validationResult.output;

  try {
    // Step 2: Extract issue numbers from commit message
    const issueNumbers = extractIssueNumbersFromCommit(message);

    if (issueNumbers.length === 0) {
      return {
        success: false,
        reason: "no-issue-number",
        branch: "commit",
        message: "No issue number found in commit message",
      };
    }

    // Step 3: Get repository information
    const repository = opts.repo
      ? parseRepositoryString(opts.repo)
      : parseRepositoryFromGitUrl(await getGitRemoteUrl());

    // Step 4: Check each issue number
    const githubToken = opts.githubToken ?? getGitHubToken();
    const validIssues: number[] = [];
    const invalidIssues: number[] = [];
    const allowedStatus = opts.issueStatus ?? DEFAULT_CHECK_OPTIONS.issueStatus;

    for (const issueNumber of issueNumbers) {
      try {
        const issue = await getGitHubIssue(
          repository.owner,
          repository.repo,
          issueNumber,
          githubToken,
        );

        if (isIssueStateAllowed(issue.state, allowedStatus)) {
          validIssues.push(issueNumber);
        } else {
          invalidIssues.push(issueNumber);
        }
      } catch (error) {
        if (error instanceof IssueNotFoundError) {
          invalidIssues.push(issueNumber);
        } else {
          throw error;
        }
      }
    }

    // Step 5: Return result based on valid/invalid issues
    if (validIssues.length > 0 && invalidIssues.length === 0) {
      return {
        success: true,
        reason: "issue-found",
        branch: "commit",
        ...(validIssues[0] !== undefined && { issueNumber: validIssues[0] }),
        message: `Valid issue(s) found: #${validIssues.join(", #")} in ${repository.owner}/${repository.repo}`,
        metadata: {
          owner: repository.owner,
          repo: repository.repo,
          checkedIssues: issueNumbers,
        },
      };
    }

    if (invalidIssues.length > 0) {
      return {
        success: false,
        reason: "issue-not-found",
        branch: "commit",
        message: `Invalid or not found issue(s): #${invalidIssues.join(", #")} in ${repository.owner}/${repository.repo}`,
        metadata: {
          owner: repository.owner,
          repo: repository.repo,
          checkedIssues: issueNumbers,
        },
      };
    }

    // Should not reach here
    return {
      success: false,
      reason: "error",
      branch: "commit",
      message: "Unknown error occurred",
    };
  } catch (error) {
    // Error handling
    return {
      success: false,
      reason: "error",
      branch: "commit",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
