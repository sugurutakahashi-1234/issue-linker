import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  type ActionMode,
  checkMessage,
  type ExtractionMode,
  getPullRequestCommits,
  type IssueStatusFilter,
} from "@issue-linker/core";

interface ValidationResult {
  name: string;
  success: boolean;
  message: string;
  issues?: number[];
  metadata?: {
    mode: ExtractionMode;
    actionMode?: ActionMode | undefined;
    repo: string;
    text: string;
  };
}

async function run() {
  try {
    const context = github.context;
    const validations: ValidationResult[] = [];

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
        validations.push({
          name: "branch",
          success: result.success,
          message: result.message,
          issues: result.validIssues,
          metadata: result.metadata,
        });
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
        validations.push({
          name: "pr-title",
          success: result.success,
          message: result.message,
          issues: result.validIssues,
          metadata: result.metadata,
        });
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
        validations.push({
          name: "pr-body",
          success: result.success,
          message: result.message,
          issues: result.validIssues,
          metadata: result.metadata,
        });
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
            pullNumber: prNumber,
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

            validations.push({
              name: `commit-${shortSha}`,
              success: result.success,
              message: `[${shortSha}] ${result.message}`,
              issues: result.validIssues,
              metadata: result.metadata,
            });
          }
        } catch (error) {
          core.error(
            `Failed to fetch commits: ${error instanceof Error ? error.message : String(error)}`,
          );
          validations.push({
            name: "commits",
            success: false,
            message: `Failed to fetch commits: ${error instanceof Error ? error.message : String(error)}`,
            metadata: {
              actionMode: "validate-commits",
              mode: "commit",
              repo,
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          });
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
      validations.push({
        name: "custom",
        success: result.success,
        message: result.message,
        issues: result.validIssues,
        metadata: result.metadata,
      });
    }

    // Set outputs
    const allSuccess = validations.every((v) => v.success);
    const failedValidations = validations.filter((v) => !v.success);
    const allFoundIssues = [
      ...new Set(validations.flatMap((v) => v.issues || [])),
    ];

    // Create executed modes details
    const executedModes = validations.map((v) => ({
      name: v.name,
      actionMode: v.metadata?.actionMode || "unknown",
      extractionMode: v.metadata?.mode || "unknown",
      success: v.success,
      issuesFound: v.issues?.length || 0,
    }));

    core.setOutput("success", allSuccess.toString());
    core.setOutput("failed-validations", JSON.stringify(failedValidations));
    core.setOutput("found-issues", JSON.stringify(allFoundIssues));
    core.setOutput("executed-modes", JSON.stringify(executedModes));
    core.setOutput("total-validations", validations.length.toString());

    // Log results
    for (const validation of validations) {
      if (validation.success) {
        core.info(`✅ [${validation.name}] ${validation.message}`);
      } else {
        core.error(`❌ [${validation.name}] ${validation.message}`);
      }
    }

    // Fail if any validation failed
    if (!allSuccess) {
      core.setFailed(`${failedValidations.length} validation(s) failed`);
    } else if (validations.length === 0) {
      core.warning("No validations were performed. Check your inputs.");
    } else {
      core.info(`✅ All ${validations.length} validation(s) passed`);
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
