// Infrastructure layer - GitHub API operations

import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import type { RequestError } from "@octokit/request-error";
import { Octokit } from "octokit";
import type { Issue, IssueState } from "../types.js";
import { Config } from "./config.js";

// Create custom Octokit with retry and throttling plugins
const MyOctokit = Octokit.plugin(retry, throttling);

/**
 * GitHubClient provides access to GitHub API
 */
export class GitHubClient {
  private octokit: Octokit;

  constructor(token?: string) {
    const config = Config.getInstance();
    const auth = token ?? config.getGitHubToken();

    this.octokit = new MyOctokit({
      auth,
      userAgent: "issue-number-branch",
      baseUrl: config.getGitHubApiUrl(),
      retry: {
        doNotRetry: ["429"], // Let throttling plugin handle rate limits
      },
      throttle: {
        onRateLimit: (retryAfter, _options, _octokit, retryCount) => {
          // Retry up to 2 times for rate limit errors
          if (retryCount < 2) {
            console.warn(
              `Rate limit hit, retrying after ${retryAfter} seconds...`,
            );
            return true;
          }
          console.error("Rate limit exceeded after retries");
          return false;
        },
        onSecondaryRateLimit: (_retryAfter, _options, _octokit) => {
          // Don't retry on abuse detection
          console.error(
            `Abuse detection triggered, please wait ${_retryAfter} seconds`,
          );
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
        if (error.status === 404) {
          // Issue doesn't exist - this is normal, not an error
          return null;
        }

        if (error.status === 403) {
          // Permission denied or rate limit
          console.error(
            `GitHub API access denied for issue #${issueNumber}: ${error.message}`,
          );
          return null;
        }

        if (error.status === 401) {
          // Authentication failed
          console.error(`GitHub API authentication failed: ${error.message}`);
          return null;
        }

        // Log other API errors
        console.error(
          `GitHub API error for issue #${issueNumber}: ${error.status} ${error.message}`,
        );
        return null;
      }

      // Non-API errors (network, etc.)
      console.error(`Unexpected error fetching issue #${issueNumber}:`, error);
      return null;
    }
  }
}
