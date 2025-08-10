// Application layer - Get pull request commits use case

import * as v from "valibot";
import type {
  GetPullRequestCommitsOptions,
  PullRequestCommit,
} from "../domain/types.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { fetchPullRequestCommits } from "../infrastructure/github-client.js";

// Validation schema for options (internal use only)
const GetPullRequestCommitsOptionsSchema = v.object({
  owner: v.pipe(v.string(), v.minLength(1, "Owner is required")),
  repo: v.pipe(v.string(), v.minLength(1, "Repository is required")),
  prNumber: v.pipe(
    v.number(),
    v.minValue(1, "Pull request number must be positive"),
  ),
  githubToken: v.optional(v.string()),
});

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
