// Infrastructure layer - GitHub API operations

import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import { RequestError } from "@octokit/request-error";
import { Octokit } from "octokit";
import { GitHubError, IssueNotFoundError } from "../domain/errors.js";
import type { Issue, IssueStatus } from "../domain/types.js";
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
    userAgent: "issue-number-branch",
    baseUrl: getGitHubApiUrl(),
    request: {
      timeout: 3000, // 3 second timeout for better UX
    },
    retry: {
      doNotRetry: ["404", "429"], // Don't retry on not found or rate limit
      retries: 1, // Only retry once for other errors
      retryAfter: 1, // 1 second between retries
    },
    throttle: {
      onRateLimit: (_retryAfter, _options, _octokit, retryCount) => {
        // Only retry once for rate limit errors
        return retryCount < 1;
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
