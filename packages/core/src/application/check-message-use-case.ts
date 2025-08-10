// Application layer - Use case for checking text messages

import { minimatch } from "minimatch";
import * as v from "valibot";
import { IssueNotFoundError } from "../domain/errors.js";
import {
  DEFAULT_EXCLUDE_PATTERNS,
  EXCLUDED_COMMIT_PREFIXES,
} from "../domain/schemas.js";
import type {
  CheckMessageOptions,
  CheckResult,
  ExtractionMode,
  IssueStatusFilter,
} from "../domain/types.js";
import { getGitHubToken } from "../infrastructure/env-accessor.js";
import { getGitRemoteUrl } from "../infrastructure/git-client.js";
import { parseRepositoryFromGitUrl } from "../infrastructure/git-url-parser.js";
import { getGitHubIssue } from "../infrastructure/github-client.js";
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
 * Extract issue numbers from text based on mode
 */
function extractIssueNumbers(text: string, mode: ExtractionMode): number[] {
  const numbers = new Set<number>();

  if (mode === "default" || mode === "commit") {
    // Extract #123 format only
    const matches = text.matchAll(/#(\d+)/g);
    for (const match of matches) {
      const num = match[1];
      if (num) {
        const issueNumber = Number.parseInt(num, 10);
        if (issueNumber > 0 && issueNumber <= 9999999) {
          numbers.add(issueNumber);
        }
      }
    }
  } else if (mode === "branch") {
    // Priority patterns for branch names
    const patterns = [
      /^(\d{1,7})[-_]/, // Start with number: 123-feature, 123_feature
      /\/(\d{1,7})[-_]/, // After slash: feat/123-desc, feat/123_desc
      /#(\d{1,7})(?:\b|$)/, // With hash: #123, feat/#123-desc
      /[-_](\d{1,7})[-_]/, // After hyphen/underscore: feature-123-, issue_123-
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        const issueNumber = Number.parseInt(match[1], 10);
        if (issueNumber > 0 && issueNumber <= 9999999) {
          numbers.add(issueNumber);
          break; // Use first match only for branch mode
        }
      }
    }
  }

  return Array.from(numbers);
}

/**
 * Check if text should be excluded based on mode and pattern
 */
function shouldExclude(
  text: string,
  mode: ExtractionMode,
  customExclude?: string,
): boolean {
  // Use custom exclude pattern if provided
  if (customExclude) {
    return minimatch(text, customExclude);
  }

  // Check mode-specific default exclusions
  if (mode === "branch") {
    const defaultPattern = DEFAULT_EXCLUDE_PATTERNS.branch;
    if (defaultPattern) {
      return minimatch(text, defaultPattern);
    }
  } else if (mode === "commit") {
    // Check if commit message starts with excluded prefix
    return EXCLUDED_COMMIT_PREFIXES.some((prefix) => text.startsWith(prefix));
  }

  return false;
}

/**
 * Check if issue state matches the filter
 */
function isIssueStateAllowed(
  state: string,
  filter: IssueStatusFilter,
): boolean {
  if (filter === "all") return true;
  return state === filter;
}

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
    const invalidIssues: number[] = [];

    for (const issueNumber of issueNumbers) {
      try {
        const issue = await getGitHubIssue(
          repository.owner,
          repository.repo,
          issueNumber,
          githubToken,
        );

        if (isIssueStateAllowed(issue.state, issueStatus)) {
          validIssues.push(issueNumber);
        } else {
          invalidIssues.push(issueNumber);
        }
      } catch (error) {
        if (error instanceof IssueNotFoundError) {
          invalidIssues.push(issueNumber);
        } else {
          throw error;
        }
      }
    }

    // Step 6: Return result
    const success = validIssues.length > 0 && invalidIssues.length === 0;

    let message: string;
    if (success) {
      message = `Valid issue(s) found: #${validIssues.join(", #")} in ${repoString}`;
    } else if (invalidIssues.length > 0 && validIssues.length === 0) {
      message = `Invalid or not found issue(s): #${invalidIssues.join(", #")} in ${repoString}`;
    } else {
      message = `Mixed results - Valid: #${validIssues.join(", #")}, Invalid: #${invalidIssues.join(", #")} in ${repoString}`;
    }

    return {
      success,
      message,
      issueNumbers,
      validIssues,
      invalidIssues,
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
      excluded: false,
      metadata: {
        mode,
        repo: "",
        text,
      },
    };
  }
}
