// Application layer - Use case for checking text messages

import * as v from "valibot";
import type { CheckMessageOptions, CheckResult } from "../domain/types.js";
import {
  isIssueStateAllowed,
  shouldExclude,
} from "../infrastructure/branch-matcher.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { getGitRemoteUrl } from "../infrastructure/git-client.js";
import { parseRepositoryFromGitUrl } from "../infrastructure/git-url-parser.js";
import { getGitHubIssue } from "../infrastructure/github-client.js";
import { extractIssueNumbers } from "../infrastructure/issue-extractor.js";
import { parseRepositoryString } from "../infrastructure/repository-parser.js";

// Validation schema for options (internal use only)
const CheckMessageOptionsSchema = v.object({
  text: v.string(),
  mode: v.optional(v.picklist(["default", "branch", "commit"]), "default"),
  actionMode: v.optional(
    v.picklist([
      "validate-branch",
      "validate-pr-title",
      "validate-pr-body",
      "validate-commits",
      "custom",
    ]),
  ),
  exclude: v.optional(v.string()),
  issueStatus: v.optional(v.picklist(["all", "open", "closed"]), "all"),
  repo: v.optional(v.string()),
  githubToken: v.optional(v.string()),
});

/**
 * Main use case for checking if text contains valid issue numbers
 * @param options - Options for the check
 * @returns Result of the check
 */
export async function checkMessage(
  options: CheckMessageOptions,
): Promise<CheckResult> {
  // Step 1: Validate options
  const validationResult = v.safeParse(CheckMessageOptionsSchema, options);
  if (!validationResult.success) {
    return {
      success: false,
      message:
        validationResult.issues[0]?.message ?? "Invalid options provided",
      issueNumbers: [],
      validIssues: [],
      invalidIssues: [],
      notFoundIssues: [],
      wrongStateIssues: [],
      excluded: false,
      metadata: {
        mode: "default",
        actionMode: options.actionMode,
        repo: "",
        text: options.text ?? "",
      },
    };
  }

  const opts = validationResult.output;
  const mode = opts.mode ?? "default";
  const text = opts.text;

  try {
    // Step 2: Check exclusion
    if (shouldExclude(text, mode, opts.exclude)) {
      return {
        success: true,
        message: `Text is excluded from validation`,
        issueNumbers: [],
        validIssues: [],
        invalidIssues: [],
        notFoundIssues: [],
        wrongStateIssues: [],
        excluded: true,
        metadata: {
          mode,
          actionMode: opts.actionMode,
          repo: "",
          text,
        },
      };
    }

    // Step 3: Extract issue numbers
    const issueNumbers = extractIssueNumbers(text, mode);

    if (issueNumbers.length === 0) {
      return {
        success: false,
        message: `No issue number found in text`,
        issueNumbers: [],
        validIssues: [],
        invalidIssues: [],
        notFoundIssues: [],
        wrongStateIssues: [],
        excluded: false,
        metadata: {
          mode,
          actionMode: opts.actionMode,
          repo: "",
          text,
        },
      };
    }

    // Step 4: Get repository information
    const repository = opts.repo
      ? parseRepositoryString(opts.repo)
      : parseRepositoryFromGitUrl(await getGitRemoteUrl());

    const repoString = `${repository.owner}/${repository.repo}`;

    // Step 5: Validate each issue number
    const githubToken = opts.githubToken ?? getGitHubToken();
    const issueStatus = opts.issueStatus ?? "all";
    const validIssues: number[] = [];
    const notFoundIssues: number[] = [];
    const wrongStateIssues: number[] = [];

    for (const issueNumber of issueNumbers) {
      const result = await getGitHubIssue(
        repository.owner,
        repository.repo,
        issueNumber,
        githubToken,
      );

      if (!result.found) {
        // Issue doesn't exist in the repository
        notFoundIssues.push(issueNumber);
      } else {
        // Issue was found, check its state
        const issue = result.issue;
        if (issue && !isIssueStateAllowed(issue.state, issueStatus)) {
          // Issue exists but has wrong state
          wrongStateIssues.push(issueNumber);
        } else if (issue) {
          // Issue exists and has correct state
          validIssues.push(issueNumber);
        }
      }
    }

    // Combine notFound and wrongState for backward compatibility
    const invalidIssues = [...notFoundIssues, ...wrongStateIssues];

    // Step 6: Return result
    const success = validIssues.length > 0 && invalidIssues.length === 0;

    let message: string;
    if (success) {
      message = `Valid issue(s) found: #${validIssues.join(", #")} in ${repoString}`;
    } else if (notFoundIssues.length > 0 && wrongStateIssues.length > 0) {
      message = `Issues not found: #${notFoundIssues.join(", #")}; Wrong state: #${wrongStateIssues.join(", #")} in ${repoString}`;
    } else if (notFoundIssues.length > 0) {
      message = `Issue(s) not found: #${notFoundIssues.join(", #")} in ${repoString}`;
    } else if (wrongStateIssues.length > 0) {
      message = `Issue(s) with wrong state: #${wrongStateIssues.join(", #")} in ${repoString}`;
    } else {
      // This should never happen - indicates a logic error
      // All issue numbers should be categorized as valid, notFound, or wrongState
      throw new Error(
        `Unexpected state in checkMessage: issueNumbers=${issueNumbers.length}, ` +
          `valid=${validIssues.length}, notFound=${notFoundIssues.length}, ` +
          `wrongState=${wrongStateIssues.length}`,
      );
    }

    return {
      success,
      message,
      issueNumbers,
      validIssues,
      invalidIssues,
      notFoundIssues,
      wrongStateIssues,
      excluded: false,
      metadata: {
        mode,
        actionMode: opts.actionMode,
        repo: repoString,
        text,
      },
    };
  } catch (error) {
    // Error handling
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      issueNumbers: [],
      validIssues: [],
      invalidIssues: [],
      notFoundIssues: [],
      wrongStateIssues: [],
      excluded: false,
      metadata: {
        mode,
        repo: "",
        text,
      },
    };
  }
}
