import * as core from "@actions/core";
import {
  checkBranch,
  DEFAULT_CHECK_OPTIONS,
  type IssueStateFilter,
} from "@sugurutakahashi-1234/issue-number-branch-api";

async function run() {
  try {
    // Get inputs
    const branch = core.getInput("branch") || undefined;
    const repo = core.getInput("repo") || undefined;
    const excludePattern =
      core.getInput("exclude_pattern") || DEFAULT_CHECK_OPTIONS.excludePattern;
    const issueStateInput =
      core.getInput("issue_state") || DEFAULT_CHECK_OPTIONS.issueState;

    // Check branch with provided options (validation is done in Core layer)
    const result = await checkBranch({
      ...(branch && { branch }),
      ...(repo && { repo }),
      excludePattern,
      issueState: issueStateInput as IssueStateFilter,
    });

    // Set outputs
    core.setOutput("success", result.success.toString());
    core.setOutput("reason", result.reason);
    core.setOutput("branch", result.branch);

    if (result.issueNumber) {
      core.setOutput("issue_number", result.issueNumber.toString());
    }

    if (result.metadata) {
      core.setOutput("owner", result.metadata.owner || "");
      core.setOutput("repo", result.metadata.repo || "");
      core.setOutput("metadata", JSON.stringify(result.metadata));
    }

    // Log result
    if (result.success) {
      core.info(`✅ ${result.message}`);
      if (result.metadata) {
        core.info(
          `Repository: ${result.metadata.owner}/${result.metadata.repo}`,
        );
        if (result.issueNumber) {
          core.info(`Issue: #${result.issueNumber}`);
        }
      }
    } else {
      core.setFailed(`❌ ${result.message}`);
      if (result.metadata) {
        core.error(
          `Repository: ${result.metadata.owner}/${result.metadata.repo}`,
        );
        if (result.metadata.checkedIssues?.length) {
          core.error(
            `Checked issues: ${result.metadata.checkedIssues.join(", ")}`,
          );
        }
      }
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
