import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  type CheckMessageOptions,
  CheckMessageOptionsSchema,
  checkMessage,
  getPullRequestCommits,
  type IssueValidationResult,
} from "@issue-linker/core";
import * as v from "valibot";

/**
 * Helper function to create CheckMessageOptions with validation
 */
function createCheckMessageOptions(
  text: string,
  mode: string,
  issueStatus: string,
  repo: string,
  actionMode: string,
  githubToken?: string,
): CheckMessageOptions {
  const options = {
    text,
    mode,
    issueStatus,
    repo,
    actionMode,
    ...(githubToken && { githubToken }),
  };

  // Validate using schema from core
  try {
    return v.parse(CheckMessageOptionsSchema, options);
  } catch (error) {
    if (error instanceof v.ValiError) {
      throw new Error(`Invalid options: ${error.message}`);
    }
    throw error;
  }
}

async function run() {
  try {
    const context = github.context;
    const results: IssueValidationResult[] = [];

    // Get common options
    const issueStatus = core.getInput("issue-status") || "all";
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
    const mode = core.getInput("mode") || "default";
    const exclude = core.getInput("exclude") || undefined;

    // Simple mode validations
    if (validateBranch) {
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      const branchName = context.payload.pull_request?.["head"]?.ref;
      if (branchName) {
        core.info(`Validating branch: ${branchName}`);
        const messageOptions = createCheckMessageOptions(
          branchName,
          "branch",
          issueStatus,
          repo,
          "validate-branch",
          githubToken,
        );
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
        const messageOptions = createCheckMessageOptions(
          prTitle,
          "default",
          issueStatus,
          repo,
          "validate-pr-title",
          githubToken,
        );
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
        const messageOptions = createCheckMessageOptions(
          prBody,
          "default",
          issueStatus,
          repo,
          "validate-pr-body",
          githubToken,
        );
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
          const commitsOptions = {
            owner: context.repo.owner,
            repo: context.repo.repo,
            prNumber,
            ...(githubToken && { githubToken }),
          };

          const commits = await getPullRequestCommits(commitsOptions);
          core.info(`Found ${commits.length} commits in PR`);

          // Check each commit message
          for (const commit of commits) {
            const shortSha = commit.sha.substring(0, 7);

            core.debug(
              `Checking commit ${shortSha}: ${commit.message.split("\n")[0]}`,
            );

            const messageOptions = createCheckMessageOptions(
              commit.message,
              "commit",
              issueStatus,
              repo,
              "validate-commits",
              githubToken,
            );

            const result = await checkMessage(messageOptions);
            results.push(result);
          }
        } catch (error) {
          // Let the error propagate - it will be caught by the outer try-catch
          throw new Error(
            `Failed to fetch commits: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    // Advanced mode validation
    if (text) {
      core.info(`Validating custom text: ${text}`);
      const messageOptions = {
        text,
        mode,
        actionMode: "custom",
        issueStatus,
        repo,
        ...(githubToken && { githubToken }),
        ...(exclude && { exclude }),
      };

      // Validate the options
      let validatedOptions: CheckMessageOptions;
      try {
        validatedOptions = v.parse(CheckMessageOptionsSchema, messageOptions);
      } catch (error) {
        if (error instanceof v.ValiError) {
          throw new Error(`Invalid advanced mode options: ${error.message}`);
        }
        throw error;
      }

      const result = await checkMessage(validatedOptions);
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
      if (result.issues) {
        if (result.issues.found.length > 0) {
          core.info(`   Found issues: #${result.issues.found.join(", #")}`);
        }
        if (result.issues.valid.length > 0) {
          core.info(`   Valid: #${result.issues.valid.join(", #")}`);
        }
        const invalidCount =
          result.issues.notFound.length + result.issues.wrongState.length;
        if (invalidCount > 0) {
          const invalid = [
            ...result.issues.notFound,
            ...result.issues.wrongState,
          ];
          core.info(`   Invalid: #${invalid.join(", #")}`);
        }
      }
    }

    // Fail if any validation failed
    if (!allSuccess) {
      core.setFailed(
        `Some validations failed. See the logs above for details.`,
      );
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
