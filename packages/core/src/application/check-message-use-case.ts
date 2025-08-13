// Application layer - Use case for checking text messages

import * as v from "valibot";
import type { CheckMessageResult, InputConfig } from "../domain/result.js";
import {
  createErrorResult,
  createExcludedResult,
  createInvalidResult,
  createNoIssuesResult,
  createSkippedResult,
  createValidResult,
} from "../domain/result-factory.js";
import {
  type CheckMessageArgs,
  CheckMessageArgsSchema,
  type ValidatedCheckMessageArgs,
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
import { hasSkipMarker } from "../infrastructure/skip-marker-checker.js";

/**
 * Main use case for checking if text contains valid issue numbers
 * @param args - Arguments for the check
 * @returns Result of the check
 */
export async function checkMessage(
  args: CheckMessageArgs,
): Promise<CheckMessageResult> {
  // Step 1: Validate args
  const validationResult = v.safeParse(CheckMessageArgsSchema, args);
  if (!validationResult.success) {
    const input: InputConfig = {
      text: args.text ?? "",
      checkMode: "default",
      issueStatus: "all",
      repo: "",
      ...(args.actionMode && { actionMode: args.actionMode }),
    };
    const error = new Error(
      validationResult.issues[0]?.message ?? "Invalid arguments provided",
    );
    return createErrorResult(error, input);
  }

  const validatedArgs: ValidatedCheckMessageArgs = validationResult.output;
  const checkMode = validatedArgs.checkMode;
  const issueStatus = validatedArgs.issueStatus;

  try {
    // Get repository information early for input config
    const repository = validatedArgs.repo
      ? parseRepositoryString(validatedArgs.repo)
      : parseRepositoryFromGitUrl(await getGitRemoteUrl());
    const repo = `${repository.owner}/${repository.repo}`;

    // Build input config
    const input: InputConfig = {
      text: validatedArgs.text,
      checkMode,
      ...(validatedArgs.extract && { extract: validatedArgs.extract }),
      ...(validatedArgs.exclude && { exclude: validatedArgs.exclude }),
      issueStatus,
      repo: repo,
      ...(validatedArgs.actionMode && { actionMode: validatedArgs.actionMode }),
    };

    // Step 2: Check for skip markers
    if (hasSkipMarker(validatedArgs.text)) {
      return createSkippedResult(input);
    }

    // Step 3: Check exclusion
    if (shouldExclude(validatedArgs.text, checkMode, validatedArgs.exclude)) {
      return createExcludedResult(input);
    }

    // Step 4: Find issue numbers
    const issueNumbers = findIssueNumbers(
      validatedArgs.text,
      checkMode,
      validatedArgs.extract,
    );
    if (issueNumbers.length === 0) {
      return createNoIssuesResult(input);
    }

    // Step 5: Validate each issue number
    const githubToken = validatedArgs.githubToken ?? getGitHubToken();
    const validIssues: number[] = [];
    const notFoundIssues: number[] = [];
    const wrongStateIssues: number[] = [];

    for (const issueNumber of issueNumbers) {
      const result = await getGitHubIssue(
        repository.owner,
        repository.repo,
        issueNumber,
        githubToken,
        validatedArgs.hostname,
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

    // Step 6: Create result based on findings
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
      text: validatedArgs.text,
      checkMode,
      ...(validatedArgs.exclude && { exclude: validatedArgs.exclude }),
      issueStatus,
      repo: validatedArgs.repo ?? "",
      ...(validatedArgs.actionMode && { actionMode: validatedArgs.actionMode }),
    };
    return createErrorResult(error, input);
  }
}
