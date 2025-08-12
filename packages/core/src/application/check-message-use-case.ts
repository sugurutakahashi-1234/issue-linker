// Application layer - Use case for checking text messages

import * as v from "valibot";
import type { CheckMessageResult, InputConfig } from "../domain/result.js";
import {
  createErrorResult,
  createExcludedResult,
  createInvalidResult,
  createNoIssuesResult,
  createValidResult,
} from "../domain/result-factory.js";
import {
  type CheckMessageOptions,
  CheckMessageOptionsSchema,
} from "../domain/validation-schemas.js";
import {
  isIssueStateAllowed,
  shouldExclude,
} from "../infrastructure/branch-matcher.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { getGitRemoteUrl } from "../infrastructure/git-client.js";
import { parseRepositoryFromGitUrl } from "../infrastructure/git-url-parser.js";
import { getGitHubIssue } from "../infrastructure/github-client.js";
import { findIssueNumbers } from "../infrastructure/issue-finder.js";
import { parseRepositoryString } from "../infrastructure/repository-parser.js";

/**
 * Main use case for checking if text contains valid issue numbers
 * @param options - Options for the check
 * @returns Result of the check
 */
export async function checkMessage(
  options: CheckMessageOptions,
): Promise<CheckMessageResult> {
  // Step 1: Validate options
  const validationResult = v.safeParse(CheckMessageOptionsSchema, options);
  if (!validationResult.success) {
    const input: InputConfig = {
      text: options.text ?? "",
      checkMode: "default",
      issueStatus: "all",
      repo: "",
      ...(options.actionMode && { actionMode: options.actionMode }),
    };
    const error = new Error(
      validationResult.issues[0]?.message ?? "Invalid options provided",
    );
    return createErrorResult(error, input);
  }

  const opts = validationResult.output;
  const checkMode = opts.checkMode ?? "default";
  const issueStatus = opts.issueStatus ?? "all";

  try {
    // Get repository information early for input config
    const repository = opts.repo
      ? parseRepositoryString(opts.repo)
      : parseRepositoryFromGitUrl(await getGitRemoteUrl());
    const repo = `${repository.owner}/${repository.repo}`;

    // Build input config
    const input: InputConfig = {
      text: opts.text,
      checkMode,
      ...(opts.extract && { extract: opts.extract }),
      ...(opts.exclude && { exclude: opts.exclude }),
      issueStatus,
      repo: repo,
      ...(opts.actionMode && { actionMode: opts.actionMode }),
    };

    // Step 2: Check exclusion
    if (shouldExclude(opts.text, checkMode, opts.exclude)) {
      return createExcludedResult(input);
    }

    // Step 3: Find issue numbers
    const issueNumbers = findIssueNumbers(opts.text, checkMode, opts.extract);
    if (issueNumbers.length === 0) {
      return createNoIssuesResult(input);
    }

    // Step 4: Validate each issue number
    const githubToken = opts.githubToken ?? getGitHubToken();
    const validIssues: number[] = [];
    const notFoundIssues: number[] = [];
    const wrongStateIssues: number[] = [];

    for (const issueNumber of issueNumbers) {
      const result = await getGitHubIssue(
        repository.owner,
        repository.repo,
        issueNumber,
        githubToken,
        opts.hostname,
      );

      if (!result.found) {
        notFoundIssues.push(issueNumber);
      } else if (
        result.issue &&
        !isIssueStateAllowed(result.issue.state, issueStatus)
      ) {
        wrongStateIssues.push(issueNumber);
      } else if (result.issue) {
        validIssues.push(issueNumber);
      }
    }

    // Step 5: Create result based on findings
    const issues = {
      found: issueNumbers,
      valid: validIssues,
      notFound: notFoundIssues,
      wrongState: wrongStateIssues,
    };

    if (
      validIssues.length > 0 &&
      notFoundIssues.length === 0 &&
      wrongStateIssues.length === 0
    ) {
      return createValidResult(issues, input);
    } else {
      return createInvalidResult(issues, input);
    }
  } catch (error) {
    // Error handling - create minimal input config if we don't have repo info yet
    const input: InputConfig = {
      text: opts.text,
      checkMode,
      ...(opts.exclude && { exclude: opts.exclude }),
      issueStatus,
      repo: opts.repo ?? "",
      ...(opts.actionMode && { actionMode: opts.actionMode }),
    };
    return createErrorResult(error, input);
  }
}
