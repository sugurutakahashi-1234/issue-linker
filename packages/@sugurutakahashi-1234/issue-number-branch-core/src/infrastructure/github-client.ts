// Infrastructure layer - GitHub API operations

import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import type { RequestError } from "@octokit/request-error";
import { Octokit } from "octokit";
import type { Issue, IssueState } from "../types.js";
import { getGitHubApiUrl, getGitHubToken } from "./config.js";

// Create custom Octokit with retry and throttling plugins
const MyOctokit = Octokit.plugin(retry, throttling);

/**
 * GitHubClient provides access to GitHub API
 */
export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    const auth = token ?? getGitHubToken();

    this.octokit = new MyOctokit({
      auth,
      userAgent: "issue-number-branch",
      baseUrl: getGitHubApiUrl(),
      retry: {
        doNotRetry: ["429"], // Let throttling plugin handle rate limits
      },
      throttle: {
        onRateLimit: (_retryAfter, _options, _octokit, retryCount) => {
          // Retry up to 2 times for rate limit errors
          return retryCount < 2;
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
   * @returns Issue if found, null otherwise
   */
  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<Issue | null> {
    try {
      const { data } = await this.octokit.rest.issues.get({
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
        state: (data.state?.toLowerCase() ?? "open") as IssueState,
        title: data.title,
      };

      // Add optional body if it exists
      if (data.body) {
        issue.body = data.body;
      }

      return issue;
    } catch (error: unknown) {
      // Type-safe error handling with proper type guard
      const isRequestError = (err: unknown): err is RequestError => {
        if (typeof err !== "object" || err === null) {
          return false;
        }

        // Use type assertion with proper check
        const error = err as { status?: unknown };
        return typeof error.status === "number";
      };

      if (isRequestError(error)) {
        // Return null for all API errors (404, 403, 401, etc.)
        // The error details are available in the error object if needed
        return null;
      }

      // Non-API errors (network, etc.) - also return null
      return null;
    }
  }
}
