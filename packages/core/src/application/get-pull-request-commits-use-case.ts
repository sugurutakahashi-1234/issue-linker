// Application layer - Get pull request commits use case

import * as v from "valibot";
import {
  type GetPullRequestCommitsArgs,
  GetPullRequestCommitsArgsSchema,
  type PullRequestCommit,
  type ValidatedGetPullRequestCommitsArgs,
} from "../domain/validation-schemas.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { fetchPullRequestCommits } from "../infrastructure/github-client.js";
import { parseRepositoryString } from "../infrastructure/repository-parser.js";

/**
 * Get commits from a pull request
 * @param args Arguments for getting pull request commits
 * @returns Array of pull request commits
 */
export async function getPullRequestCommits(
  args: GetPullRequestCommitsArgs,
): Promise<PullRequestCommit[]> {
  // Validate args
  const validatedArgs: ValidatedGetPullRequestCommitsArgs = v.parse(
    GetPullRequestCommitsArgsSchema,
    args,
  );

  // Parse repository string
  const { owner, repo } = parseRepositoryString(validatedArgs.repo);

  // Get GitHub token
  const githubToken = validatedArgs.githubToken ?? getGitHubToken();

  // Fetch commits from GitHub API (already transformed to PullRequestCommit[])
  return await fetchPullRequestCommits(
    owner,
    repo,
    validatedArgs.prNumber,
    githubToken,
    validatedArgs.hostname,
  );
}
