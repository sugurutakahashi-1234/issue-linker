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
      const prefix = results.length > 1 ? `[${actionMode}] ` : "";

      if (result.success) {
        // Success cases
        if (result.reason === "excluded") {
          core.info(`✅ ${prefix}Text was excluded from validation`);
        } else if (result.issues?.valid && result.issues.valid.length > 0) {
          core.info(
            `✅ ${prefix}Valid issues: #${result.issues.valid.join(", #")}`,
          );
        } else {
          core.info(`✅ ${prefix}${result.message}`);
        }
      } else {
        // Failure cases
        core.error(`❌ ${prefix}${result.message}`);

        // Show details for failed validations
        if (result.issues) {
          const details = [];

          if (result.issues.valid.length > 0) {
            details.push(`Valid: #${result.issues.valid.join(", #")}`);
          }
          if (result.issues.notFound.length > 0) {
            details.push(`Not found: #${result.issues.notFound.join(", #")}`);
          }
          if (result.issues.wrongState.length > 0) {
            const stateInfo =
              result.input.issueStatus === "all"
                ? "Wrong state"
                : `Wrong state (expected: ${result.input.issueStatus})`;
            details.push(
              `${stateInfo}: #${result.issues.wrongState.join(", #")}`,
            );
          }

          if (details.length > 0) {
            core.info(`   Details: ${details.join(", ")}`);
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
