// Use case layer - Main business logic

import { DEFAULT_CHECK_OPTIONS } from "../constants.js";
import { IssueNotFoundError } from "../domain/errors.js";
import { extractIssueNumber } from "../domain/extractors.js";
import { parseGitRemoteUrl } from "../domain/parsers.js";
import { parseRepository, validateCheckOptions } from "../domain/schemas.js";
import {
  validateBranchExclusion,
  validateIssueState,
} from "../domain/validators.js";
import { getGitHubToken } from "../infrastructure/config.js";
import {
  getCurrentGitBranch,
  getGitRemoteUrl,
} from "../infrastructure/git-client.js";
import { getGitHubIssue } from "../infrastructure/github-client.js";
import type { CheckOptions, CheckResult } from "../types.js";

/**
 * Main use case for checking if a branch name contains a valid issue number
 * @param options - Options for the check
 * @returns Result of the check
 */
export async function checkBranch(
  options: CheckOptions = {},
): Promise<CheckResult> {
  // Validate options using domain layer validation
  const validationResult = validateCheckOptions(options);
  if (!validationResult.success) {
    const firstIssue = validationResult.issues[0];
    return {
      success: false,
      reason: "error",
      branch: options.branch ?? "unknown",
      message: firstIssue?.message ?? "Invalid options provided",
    };
  }

  const validatedOptions = validationResult.output;

  // Merge options with defaults
  const excludePattern =
    validatedOptions.excludePattern ?? DEFAULT_CHECK_OPTIONS.excludePattern;
  const issueState =
    validatedOptions.issueState ?? DEFAULT_CHECK_OPTIONS.issueState;
  const githubToken = validatedOptions.githubToken ?? getGitHubToken();

  try {
    // 1. Get branch name (from option or current branch)
    const branch = validatedOptions.branch ?? (await getCurrentGitBranch());

    // 2. Check if branch should be excluded
    if (validateBranchExclusion(branch, excludePattern)) {
      return {
        success: true,
        reason: "excluded",
        branch,
        message: `Branch '${branch}' is excluded from validation`,
      };
    }

    // 3. Extract issue number from branch name
    const issueNumber = extractIssueNumber(branch);
    if (issueNumber === null) {
      return {
        success: false,
        reason: "no-issue-number",
        branch,
        message: `No issue number found in branch '${branch}'`,
      };
    }

    // 4. Get repository information (from options or git remote)
    let owner: string;
    let repoName: string;

    if (validatedOptions.repo) {
      // Parse "owner/repo" format (already validated by schema)
      const parsed = parseRepository(validatedOptions.repo);
      owner = parsed.owner;
      repoName = parsed.repo;
    } else {
      const remoteUrl = await getGitRemoteUrl();
      const parsed = parseGitRemoteUrl(remoteUrl);
      owner = parsed.owner;
      repoName = parsed.repo;
    }

    // 5. Check if the issue exists with allowed state
    try {
      const issue = await getGitHubIssue(
        owner,
        repoName,
        issueNumber,
        githubToken,
      );

      if (validateIssueState(issue.state, issueState)) {
        return {
          success: true,
          reason: "issue-found",
          branch,
          issueNumber,
          message: `Issue #${issueNumber} found in ${owner}/${repoName} (state: ${issue.state})`,
          metadata: {
            owner,
            repo: repoName,
            checkedIssues: [issueNumber],
          },
        };
      } else {
        // Issue exists but state doesn't match
        return {
          success: false,
          reason: "issue-not-found",
          branch,
          message: `Issue #${issueNumber} exists but state '${issue.state}' is not allowed`,
          metadata: {
            owner,
            repo: repoName,
            checkedIssues: [issueNumber],
          },
        };
      }
    } catch (error) {
      if (error instanceof IssueNotFoundError) {
        // Issue doesn't exist
        return {
          success: false,
          reason: "issue-not-found",
          branch,
          message: `Issue #${issueNumber} not found in ${owner}/${repoName}`,
          metadata: {
            owner,
            repo: repoName,
            checkedIssues: [issueNumber],
          },
        };
      }
      // Other errors (auth, network, etc.) should be re-thrown
      throw error;
    }
  } catch (error) {
    // Handle any errors
    return {
      success: false,
      reason: "error",
      branch: "unknown",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
