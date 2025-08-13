import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  type CheckMessageArgs,
  CheckMessageArgsSchema,
  type CheckMessageResult,
  checkMessage,
  commentOnBranchIssues,
  DEFAULT_OPTIONS,
  getPullRequestCommits,
} from "@issue-linker/core";
import * as v from "valibot";
import {
  extractBranchNameFromContext,
  isCreateBranchEvent,
} from "./github-actions-helpers.js";
import { createCheckMessageArgs } from "./validation-helpers.js";

async function run() {
  const results: CheckMessageResult[] = [];

  try {
    const context = github.context;

    // Get common options
    const issueStatus =
      core.getInput("issue-status") || DEFAULT_OPTIONS.issueStatus;
    const repo =
      core.getInput("repo") || `${context.repo.owner}/${context.repo.repo}`;
    const githubToken = core.getInput("github-token") || undefined;
    const hostname = core.getInput("hostname") || undefined;

    // Simple mode inputs
    const validateBranch = core.getInput("validate-branch") === "true";
    const validatePrTitle = core.getInput("validate-pr-title") === "true";
    const validatePrBody = core.getInput("validate-pr-body") === "true";
    const validateCommits = core.getInput("validate-commits") === "true";
    const commentOnIssuesWhenBranchPushed =
      core.getInput("comment-on-issues-when-branch-pushed") === "true";

    // Advanced mode inputs
    const text = core.getInput("text");
    const checkMode = core.getInput("check-mode") || DEFAULT_OPTIONS.mode;
    const extract = core.getInput("extract") || undefined;
    const exclude = core.getInput("exclude") || undefined;

    // Simple mode validations
    if (validateBranch) {
      // Get branch name using helper function
      const branchName = extractBranchNameFromContext(context);

      if (branchName) {
        const messageArgs = createCheckMessageArgs(
          branchName,
          "branch",
          issueStatus,
          repo,
          "validate-branch",
          githubToken,
          hostname,
          extract,
          exclude,
        );
        const result = await checkMessage(messageArgs);
        results.push(result);

        // Comment on issues when branch is pushed (create event)
        if (
          commentOnIssuesWhenBranchPushed &&
          isCreateBranchEvent(context) &&
          result.success &&
          result.issues?.valid &&
          result.issues.valid.length > 0
        ) {
          // Use new use case for batch commenting
          const commentResult = await commentOnBranchIssues({
            repo,
            issueNumbers: result.issues.valid,
            branchName,
            ...(githubToken && { githubToken }),
            ...(hostname && { hostname }),
          });

          // Log results in compact format
          const commented = commentResult.results.filter(
            (r) => r.success && !r.skipped,
          );
          const skipped = commentResult.results.filter(
            (r) => r.success && r.skipped,
          );
          const failed = commentResult.results.filter((r) => !r.success);

          if (commented.length > 0) {
            core.info(
              `Commented on: #${commented.map((r) => r.issueNumber).join(", #")}`,
            );
          }
          if (skipped.length > 0) {
            core.debug(
              `Already commented on: #${skipped.map((r) => r.issueNumber).join(", #")}`,
            );
          }
          if (failed.length > 0) {
            core.warning(
              `Failed to comment on: #${failed.map((r) => r.issueNumber).join(", #")}`,
            );
          }
        }
      } else {
        core.warning("Branch name not found in context");
      }
    }

    if (validatePrTitle) {
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      const prTitle = context.payload.pull_request?.["title"];
      if (prTitle) {
        const messageArgs = createCheckMessageArgs(
          prTitle,
          "default",
          issueStatus,
          repo,
          "validate-pr-title",
          githubToken,
          hostname,
          extract,
          exclude,
        );
        const result = await checkMessage(messageArgs);
        results.push(result);
      } else {
        core.warning("PR title not found in context");
      }
    }

    if (validatePrBody) {
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      const prBody = context.payload.pull_request?.["body"];
      if (prBody) {
        const messageArgs = createCheckMessageArgs(
          prBody,
          "default",
          issueStatus,
          repo,
          "validate-pr-body",
          githubToken,
          hostname,
          extract,
          exclude,
        );
        const result = await checkMessage(messageArgs);
        results.push(result);
      } else {
        core.warning("PR body not found in context");
      }
    }

    if (validateCommits) {
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      const prNumber = context.payload.pull_request?.["number"];

      if (!prNumber) {
        core.warning("Cannot validate commits: PR context not found");
      } else {
        try {
          // Get commits using core function
          const commitsOptions = {
            repo: `${context.repo.owner}/${context.repo.repo}`,
            prNumber,
            ...(githubToken && { githubToken }),
            ...(hostname && { hostname }),
          };

          const commits = await getPullRequestCommits(commitsOptions);
          // Check each commit message
          for (const commit of commits) {
            const messageArgs = createCheckMessageArgs(
              commit.message,
              "commit",
              issueStatus,
              repo,
              "validate-commits",
              githubToken,
              hostname,
              extract,
              exclude,
            );

            const result = await checkMessage(messageArgs);
            results.push(result);
          }
        } catch (error) {
          // Log error but continue processing
          core.error(
            `Failed to fetch commits: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    // Advanced mode validation
    if (text) {
      const messageOptions = {
        text,
        checkMode,
        actionMode: "custom",
        issueStatus,
        repo,
        ...(githubToken && { githubToken }),
        ...(hostname && { hostname }),
        ...(extract && { extract }),
        ...(exclude && { exclude }),
      };

      // Validate the args
      let validatedArgs: CheckMessageArgs;
      try {
        validatedArgs = v.parse(CheckMessageArgsSchema, messageOptions);
      } catch (error) {
        if (error instanceof v.ValiError) {
          throw new Error(`Invalid advanced mode arguments: ${error.message}`);
        }
        throw error;
      }

      const result = await checkMessage(validatedArgs);
      results.push(result);
    }

    // Set outputs
    const allSuccess = results.every((r) => r.success);
    core.setOutput("success", allSuccess.toString());
    core.setOutput("results", JSON.stringify(results));

    // Log results
    for (const result of results) {
      const actionMode = result.input.actionMode || "custom";
      const prefix = results.length > 1 ? `[${actionMode}] ` : "";

      if (result.success) {
        // Success cases
        switch (result.reason) {
          case "excluded":
            core.info(`${prefix}Text was excluded from validation`);
            break;
          case "skipped":
            core.info(`${prefix}Validation skipped due to skip marker`);
            break;
          case "valid":
            if (result.issues?.valid && result.issues.valid.length > 0) {
              core.info(
                `${prefix}Valid issues: #${result.issues.valid.join(", #")}`,
              );
            } else {
              core.info(`${prefix}${result.message}`);
            }
            break;
          case "no-issues":
          case "invalid-issues":
          case "error":
            core.info(`${prefix}${result.message}`);
            break;
          default: {
            // Exhaustive check: TypeScript will error if a new reason is added
            const _exhaustive: never = result.reason;
            throw new Error(`Unexpected reason: ${_exhaustive}`);
          }
        }
      } else {
        // Failure cases
        core.error(`${prefix}${result.message}`);

        // Show details for failed validations
        if (result.issues) {
          const details = [];

          if (result.issues.notFound.length > 0) {
            details.push(`Not found: #${result.issues.notFound.join(", #")}`);
          }
          if (result.issues.wrongState.length > 0) {
            details.push(
              `Wrong state: #${result.issues.wrongState.join(", #")}`,
            );
          }

          if (details.length > 0) {
            core.info(`Details: ${details.join(", ")}`);
          }
        }
      }
    }

    // Fail if any validation failed
    if (!allSuccess) {
      const failureCount = results.filter((r) => !r.success).length;
      const totalCount = results.length;
      core.setFailed(
        `${failureCount} of ${totalCount} validation${totalCount > 1 ? "s" : ""} failed`,
      );
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
