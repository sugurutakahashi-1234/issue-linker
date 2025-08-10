// Infrastructure layer - GitHub API operations

import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import { RequestError } from "@octokit/request-error";
import { Octokit } from "octokit";
import { GitHubError, IssueNotFoundError } from "../domain/errors.js";
import type { Issue, IssueStatus, PullRequestCommit } from "../domain/types.js";
import { getGitHubApiUrl, getGitHubToken } from "./env-accessor.js";

// Create custom Octokit with retry and throttling plugins
const MyOctokit = Octokit.plugin(retry, throttling);

/**
 * Create an Octokit instance with proper configuration
 * @param token - Optional GitHub token
 * @returns Configured Octokit instance
 */
function createOctokit(token?: string): Octokit {
  const auth = token ?? getGitHubToken();

  return new MyOctokit({
    auth,
    userAgent: "issue-linker",
    baseUrl: getGitHubApiUrl(),
    request: {
      // Aggressive timeout for fast feedback during development
      // Adjust this value if you need more reliability vs speed
      timeout: 1000, // 1 second timeout (tunable)
    },
    retry: {
      // Disable all retries for 404 and rate limits
      doNotRetry: ["404", "429"],
      // No retries for maximum speed
      retries: 0, // 0 = no retries (tunable: increase for reliability)
    },
    throttle: {
      onRateLimit: (_retryAfter, _options, _octokit, _retryCount) => {
        // No retries on rate limit for speed
        return false; // false = don't retry (tunable: return true for retry)
      },
      onSecondaryRateLimit: (_retryAfter, _options, _octokit) => {
        // Don't retry on abuse detection
        return false;
      },
    },
  });
}

/**
 * Get an issue from GitHub
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param issueNumber - Issue number
 * @param token - Optional GitHub token
 * @returns Issue object
 * @throws IssueNotFoundError if issue doesn't exist (404)
 * @throws GitHubError for other API errors
 */
export async function getGitHubIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  token?: string,
): Promise<Issue> {
  const octokit = createOctokit(token);

  try {
    const { data } = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    // Convert GitHub issue to our Issue type
    const issue: Issue = {
      number: data.number,
      state: (data.state?.toLowerCase() ?? "open") as IssueStatus,
      title: data.title,
    };

    // Add optional body if it exists
    if (data.body) {
      issue.body = data.body;
    }

    return issue;
  } catch (error: unknown) {
    // Handle different error cases appropriately
    if (error instanceof RequestError) {
      if (error.status === 404) {
        // Issue doesn't exist - this is a normal case
        throw new IssueNotFoundError(issueNumber);
      }
      // For other API errors (401, 403, etc.)
      throw new GitHubError(error.message, error.status);
    }

    // Re-throw unexpected errors (network issues, etc.)
    throw error;
  }
}

/**
 * Fetch commits from a pull request
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @param token - Optional GitHub token
 * @returns Array of pull request commits
 * @throws GitHubError for API errors
 */
export async function fetchPullRequestCommits(
  owner: string,
  repo: string,
  prNumber: number,
  token?: string,
): Promise<PullRequestCommit[]> {
  const octokit = createOctokit(token);

  try {
    const { data } = await octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: prNumber,
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    // Transform Octokit response to domain type
    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name ?? "Unknown",
        email: commit.commit.author?.email ?? "unknown@example.com",
      },
    }));
  } catch (error: unknown) {
    // Handle API errors
    if (error instanceof RequestError) {
      throw new GitHubError(
        `Failed to fetch commits for PR #${prNumber}: ${error.message}`,
        error.status,
      );
    }

    // Re-throw unexpected errors
    throw error;
  }
}
