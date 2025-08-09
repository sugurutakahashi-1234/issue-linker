// Application layer - Use case for checking branch

import * as v from "valibot";
import { DEFAULT_CHECK_OPTIONS } from "../domain/constants.js";
import { IssueNotFoundError } from "../domain/errors.js";
import type { CheckOptions, CheckResult } from "../domain/types.js";
import { CheckOptionsSchema } from "../domain/validation-schemas.js";
import {
  isBranchExcluded,
  isIssueStateAllowed,
} from "../infrastructure/branch-matcher.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import {
  getCurrentGitBranch,
  getGitRemoteUrl,
} from "../infrastructure/git-client.js";
import { parseRepositoryFromGitUrl } from "../infrastructure/git-url-parser.js";
import { getGitHubIssue } from "../infrastructure/github-client.js";
import { extractIssueNumberFromBranch } from "../infrastructure/issue-extractor.js";
import { parseRepositoryString } from "../infrastructure/repository-parser.js";

/**
 * Main use case for checking if a branch name contains a valid issue number
 * @param options - Options for the check
 * @returns Result of the check
 */
export async function checkBranch(
  options: CheckOptions = {},
): Promise<CheckResult> {
  // Step 1: Validate options
  const validationResult = v.safeParse(CheckOptionsSchema, options);
  if (!validationResult.success) {
    return {
      success: false,
      reason: "error",
      branch: options.branch ?? "unknown",
      message:
        validationResult.issues[0]?.message ?? "Invalid options provided",
    };
  }

  const opts = validationResult.output;

  try {
    // Step 2: Get branch name
    const branch = opts.branch ?? (await getCurrentGitBranch());

    // Step 3: Check exclusion patterns
    const excludePattern =
      opts.excludePattern ?? DEFAULT_CHECK_OPTIONS.excludePattern;
    if (isBranchExcluded(branch, excludePattern)) {
      return {
        success: true,
        reason: "excluded",
        branch,
        message: `Branch '${branch}' is excluded from validation`,
      };
    }

    // Step 4: Extract issue number
    const issueNumber = extractIssueNumberFromBranch(branch);
    if (!issueNumber) {
      return {
        success: false,
        reason: "no-issue-number",
        branch,
        message: `No issue number found in branch '${branch}'`,
      };
    }

    // Step 5: Get repository information
    const repository = opts.repo
      ? parseRepositoryString(opts.repo)
      : parseRepositoryFromGitUrl(await getGitRemoteUrl());

    // Step 6: Check GitHub issue
    const githubToken = opts.githubToken ?? getGitHubToken();
    const issue = await getGitHubIssue(
      repository.owner,
      repository.repo,
      issueNumber,
      githubToken,
    );

    // Step 7: Verify issue status
    const allowedStatus = opts.issueStatus ?? DEFAULT_CHECK_OPTIONS.issueStatus;
    if (!isIssueStateAllowed(issue.state, allowedStatus)) {
      return {
        success: false,
        reason: "issue-not-found",
        branch,
        message: `Issue #${issueNumber} exists but state '${issue.state}' is not allowed`,
        metadata: {
          owner: repository.owner,
          repo: repository.repo,
          checkedIssues: [issueNumber],
        },
      };
    }

    // Step 8: Return success result
    return {
      success: true,
      reason: "issue-found",
      branch,
      issueNumber,
      message: `Issue #${issueNumber} found in ${repository.owner}/${repository.repo} (state: ${issue.state})`,
      metadata: {
        owner: repository.owner,
        repo: repository.repo,
        checkedIssues: [issueNumber],
      },
    };
  } catch (error) {
    // Error handling
    if (error instanceof IssueNotFoundError) {
      const issueNumber = error.issueNumber;
      // Re-fetch repository information (for error case)
      const repository = opts.repo
        ? parseRepositoryString(opts.repo)
        : parseRepositoryFromGitUrl(await getGitRemoteUrl());

      return {
        success: false,
        reason: "issue-not-found",
        branch: opts.branch ?? "unknown",
        message: `Issue #${issueNumber} not found in ${repository.owner}/${repository.repo}`,
        metadata: {
          owner: repository.owner,
          repo: repository.repo,
          checkedIssues: [issueNumber],
        },
      };
    }

    // Other errors
    return {
      success: false,
      reason: "error",
      branch: opts.branch ?? "unknown",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
