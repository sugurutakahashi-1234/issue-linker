import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  checkMessage,
  type ExtractionMode,
  type IssueStatusFilter,
} from "@issue-linker/core";

interface ValidationResult {
  name: string;
  success: boolean;
  message: string;
  issues?: number[];
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
    const githubToken =
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      core.getInput("github-token") || process.env["GITHUB_TOKEN"];

    // Simple mode inputs
    const validateBranch = core.getInput("validate-branch") === "true";
    const validatePrTitle = core.getInput("validate-pr-title") === "true";
    const validatePrBody = core.getInput("validate-pr-body") === "true";

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
          issueStatus,
          repo,
        };
        if (githubToken) messageOptions.githubToken = githubToken;
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
          issueStatus,
          repo,
        };
        if (githubToken) messageOptions.githubToken = githubToken;
        const result = await checkMessage(messageOptions);
        validations.push({
          name: "pr-title",
          success: result.success,
          message: result.message,
          issues: result.validIssues,
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
          issueStatus,
          repo,
        };
        if (githubToken) messageOptions.githubToken = githubToken;
        const result = await checkMessage(messageOptions);
        validations.push({
          name: "pr-body",
          success: result.success,
          message: result.message,
          issues: result.validIssues,
        });
      } else {
        core.warning("PR body not found in context");
      }
    }

    // Advanced mode validation
    if (text) {
      core.info(`Validating custom text: ${text}`);
      const messageOptions: Parameters<typeof checkMessage>[0] = {
        text,
        mode,
        issueStatus,
        repo,
      };
      if (exclude) messageOptions.exclude = exclude;
      if (githubToken) messageOptions.githubToken = githubToken;
      const result = await checkMessage(messageOptions);
      validations.push({
        name: "custom",
        success: result.success,
        message: result.message,
        issues: result.validIssues,
      });
    }

    // Set outputs
    const allSuccess = validations.every((v) => v.success);
    const failedValidations = validations.filter((v) => !v.success);
    const allFoundIssues = [
      ...new Set(validations.flatMap((v) => v.issues || [])),
    ];

    core.setOutput("success", allSuccess.toString());
    core.setOutput("failed-validations", JSON.stringify(failedValidations));
    core.setOutput("found-issues", JSON.stringify(allFoundIssues));

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
