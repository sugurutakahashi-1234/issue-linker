import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  checkMessage,
  type ExtractionMode,
  getPullRequestCommits,
  type IssueStatusFilter,
  type IssueValidationResult,
} from "@issue-linker/core";

async function run() {
  try {
    const context = github.context;
    const results: IssueValidationResult[] = [];

    // Get common options
    const issueStatus = (core.getInput("issue-status") ||
      "all") as IssueStatusFilter;
    const repo =
      core.getInput("repo") || `${context.repo.owner}/${context.repo.repo}`;
    const githubToken = core.getInput("github-token") || undefined;

    // Simple mode inputs
    const validateBranch = core.getInput("validate-branch") === "true";
    const validatePrTitle = core.getInput("validate-pr-title") === "true";
    const validatePrBody = core.getInput("validate-pr-body") === "true";
    const validateCommits = core.getInput("validate-commits") === "true";

    // Advanced mode inputs
    const text = core.getInput("text");
    const mode = (core.getInput("mode") || "default") as ExtractionMode;
    const exclude = core.getInput("exclude") || undefined;

    // Simple mode validations
    if (validateBranch) {
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      const branchName = context.payload.pull_request?.["head"]?.ref;
      if (branchName) {
        core.info(`Validating branch: ${branchName}`);
        const messageOptions: Parameters<typeof checkMessage>[0] = {
          text: branchName,
          mode: "branch",
          actionMode: "validate-branch",
          issueStatus,
          repo,
          ...(githubToken && { githubToken }),
        };
        core.debug(
          `Calling checkMessage with options: ${JSON.stringify(messageOptions)}`,
        );
        const result = await checkMessage(messageOptions);
        core.debug(`checkMessage result: ${JSON.stringify(result)}`);
        results.push(result);
      } else {
        core.warning("Branch name not found in context");
      }
    }

    if (validatePrTitle) {
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      const prTitle = context.payload.pull_request?.["title"];
      if (prTitle) {
        core.info(`Validating PR title: ${prTitle}`);
        const messageOptions: Parameters<typeof checkMessage>[0] = {
          text: prTitle,
          mode: "default",
          actionMode: "validate-pr-title",
          issueStatus,
          repo,
          ...(githubToken && { githubToken }),
        };
        const result = await checkMessage(messageOptions);
        results.push(result);
      } else {
        core.warning("PR title not found in context");
      }
    }

    if (validatePrBody) {
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      const prBody = context.payload.pull_request?.["body"];
      if (prBody) {
        core.info(`Validating PR body`);
        const messageOptions: Parameters<typeof checkMessage>[0] = {
          text: prBody,
          mode: "default",
          actionMode: "validate-pr-body",
          issueStatus,
          repo,
          ...(githubToken && { githubToken }),
        };
        const result = await checkMessage(messageOptions);
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
          const commits = await getPullRequestCommits({
            owner: context.repo.owner,
            repo: context.repo.repo,
            prNumber,
            ...(githubToken && { githubToken }),
          });

          core.info(`Found ${commits.length} commits in PR`);

          // Check each commit message
          for (const commit of commits) {
            const shortSha = commit.sha.substring(0, 7);

            core.debug(
              `Checking commit ${shortSha}: ${commit.message.split("\n")[0]}`,
            );

            const result = await checkMessage({
              text: commit.message,
              mode: "commit",
              actionMode: "validate-commits",
              issueStatus,
              repo,
              ...(githubToken && { githubToken }),
            });

            results.push(result);
          }
        } catch (error) {
          core.error(
            `Failed to fetch commits: ${error instanceof Error ? error.message : String(error)}`,
          );
          // Create error result for commit fetch failure
          const errorResult: IssueValidationResult = {
            success: false,
            message: `Failed to fetch commits: ${error instanceof Error ? error.message : String(error)}`,
            reason: "error",
            input: {
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              mode: "commit",
              actionMode: "validate-commits",
              issueStatus,
              repo,
            },
            error: {
              type: "CommitFetchError",
              message: error instanceof Error ? error.message : String(error),
            },
          };
          results.push(errorResult);
        }
      }
    }

    // Advanced mode validation
    if (text) {
      core.info(`Validating custom text: ${text}`);
      const messageOptions: Parameters<typeof checkMessage>[0] = {
        text,
        mode,
        actionMode: "custom",
        issueStatus,
        repo,
        ...(githubToken && { githubToken }),
      };
      if (exclude) messageOptions.exclude = exclude;
      const result = await checkMessage(messageOptions);
      results.push(result);
    }

    // Set outputs
    const allSuccess = results.every((r) => r.success);
    const allFoundIssues = [
      ...new Set(results.flatMap((r) => r.issues?.found || [])),
    ];

    // Create summary
    const summary = {
      totalValidations: results.length,
      failed: results.filter((r) => !r.success).length,
      allIssues: allFoundIssues,
    };

    core.setOutput("success", allSuccess.toString());
    core.setOutput("results", JSON.stringify(results));
    core.setOutput("summary", JSON.stringify(summary));

    // Log results
    for (const result of results) {
      const actionMode = result.input.actionMode || "custom";
      if (result.success) {
        core.info(`✅ [${actionMode}] ${result.message}`);
      } else {
        core.error(`❌ [${actionMode}] ${result.message}`);
      }
    }

    // Fail if any validation failed
    if (!allSuccess) {
      core.setFailed(`${summary.failed} validation(s) failed`);
    } else if (results.length === 0) {
      core.warning("No validations were performed. Check your inputs.");
    } else {
      core.info(`✅ All ${results.length} validation(s) passed`);
    }
  } catch (error) {
    core.setFailed(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    );
    if (error instanceof Error && error.stack) {
      core.debug(`Stack trace: ${error.stack}`);
    }
  }
}

run();
