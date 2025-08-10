// Application layer - Get pull request commits use case

import * as v from "valibot";
import {
  type GetPullRequestCommitsOptions,
  GetPullRequestCommitsOptionsSchema,
  type PullRequestCommit,
} from "../domain/validation-schemas.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { fetchPullRequestCommits } from "../infrastructure/github-client.js";

/**
 * Get commits from a pull request
 * @param opts Options for getting pull request commits
 * @returns Array of pull request commits
 */
export async function getPullRequestCommits(
  opts: GetPullRequestCommitsOptions,
): Promise<PullRequestCommit[]> {
  // Validate options
  const options = v.parse(GetPullRequestCommitsOptionsSchema, opts);

  // Get GitHub token
  const githubToken = options.githubToken ?? getGitHubToken();

  // Fetch commits from GitHub API (already transformed to PullRequestCommit[])
  return await fetchPullRequestCommits(
    options.owner,
    options.repo,
    options.prNumber,
    githubToken,
  );
}
