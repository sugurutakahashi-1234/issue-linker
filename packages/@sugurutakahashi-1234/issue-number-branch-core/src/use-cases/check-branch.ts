// Use case layer - Main business logic

import { extractIssueNumbers } from "../domain/extractors.js";
import { parseGitRemoteUrl } from "../domain/parsers.js";
import {
  validateBranchExclusion,
  validateIssueState,
} from "../domain/validators.js";
import { Config } from "../infrastructure/config.js";
import { GitClient } from "../infrastructure/git-client.js";
import { GitHubClient } from "../infrastructure/github-client.js";
import type { CheckOptions, CheckResult } from "../types.js";

/**
 * Main use case for checking if a branch name contains a valid issue number
 * @param options - Options for the check
 * @returns Result of the check
 */
export async function checkBranch(
  options: CheckOptions = {},
): Promise<CheckResult> {
  const config = Config.getInstance();
  const defaults = config.getDefaults();

  // Merge options with defaults
  const excludePattern = options.excludePattern ?? defaults.excludePattern;
  const issueState = options.issueState ?? defaults.issueState;
  const githubToken = options.githubToken ?? config.getGitHubToken();

  // Initialize clients
  const gitClient = new GitClient();
  const githubClient = new GitHubClient(githubToken);

  try {
    // 1. Get branch name (from option or current branch)
    const branch = options.branch ?? (await gitClient.getCurrentBranch());

    // 2. Check if branch should be excluded
    if (validateBranchExclusion(branch, excludePattern)) {
      return {
        success: true,
        reason: "excluded",
        branch,
        message: `Branch '${branch}' is excluded from validation`,
      };
    }

    // 3. Extract issue numbers from branch name
    const issueNumbers = extractIssueNumbers(branch);
    if (issueNumbers.length === 0) {
      return {
        success: false,
        reason: "no-issue-number",
        branch,
        message: `No issue number found in branch '${branch}'`,
      };
    }

    // 4. Get repository information (from options or git remote)
    let owner: string;
    let repo: string;

    if (options.owner && options.repo) {
      owner = options.owner;
      repo = options.repo;
    } else {
      const remoteUrl = await gitClient.getRemoteUrl();
      const parsed = parseGitRemoteUrl(remoteUrl);
      owner = parsed.owner;
      repo = parsed.repo;
    }

    // 5. Check if any of the issue numbers exist with allowed states
    for (const num of issueNumbers) {
      const issue = await githubClient.getIssue(owner, repo, num);

      if (issue && validateIssueState(issue.state, issueState)) {
        return {
          success: true,
          reason: "issue-found",
          branch,
          issueNumber: num,
          message: `Issue #${num} found in ${owner}/${repo} (state: ${issue.state})`,
          metadata: {
            owner,
            repo,
            checkedIssues: issueNumbers,
          },
        };
      }
    }

    // No valid issue found
    return {
      success: false,
      reason: "issue-not-found",
      branch,
      message: `No valid issue found among: ${issueNumbers.join(", ")} in ${owner}/${repo}`,
      metadata: {
        owner,
        repo,
        checkedIssues: issueNumbers,
      },
    };
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
