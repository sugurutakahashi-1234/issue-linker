// Commit subcommand implementation

import { execSync } from "node:child_process";
import { Command } from "@commander-js/extra-typings";
import { checkCommit, DEFAULT_CHECK_OPTIONS } from "@issue-linker/core";

/**
 * Get the latest commit message from git log
 */
function getLatestCommitMessage(): string {
  try {
    const message = execSync("git log -1 --pretty=%B", {
      encoding: "utf-8",
    });
    return message.trim();
  } catch (_error) {
    throw new Error(
      "Failed to get latest commit message. Are you in a git repository?",
    );
  }
}

export function createCommitCommand() {
  const command = new Command("commit")
    .description("Check if commit message contains issue numbers")
    .argument("[message]", "commit message to check")
    .option("-l, --latest", "check the latest commit message")
    .option(
      "-r, --repo <owner/repo>",
      "repository (default: current repository)",
    )
    .option(
      "--issue-status <status>",
      `filter by issue status: all, open, closed (default: ${DEFAULT_CHECK_OPTIONS.issueStatus})`,
      DEFAULT_CHECK_OPTIONS.issueStatus,
    )
    .option(
      "--github-token <token>",
      "GitHub token (default: GITHUB_TOKEN env)",
    )
    .action(async (message, options) => {
      try {
        // Determine the commit message to check
        let commitMessage: string;

        if (options.latest) {
          commitMessage = getLatestCommitMessage();
          console.log(`Checking latest commit: "${commitMessage}"\n`);
        } else if (message) {
          commitMessage = message;
        } else {
          console.error(
            "❌ Please provide a commit message or use --latest flag",
          );
          process.exit(1);
        }

        // Check commit message
        const result = await checkCommit(commitMessage, {
          ...(options.repo && { repo: options.repo }),
          ...(options.githubToken && { githubToken: options.githubToken }),
          issueStatus: options.issueStatus,
        });

        // Display result
        if (result.success) {
          console.log(`✅ ${result.message}`);
          if (result.metadata) {
            console.log(
              `   Repository: ${result.metadata.owner}/${result.metadata.repo}`,
            );
          }
          process.exit(0);
        } else {
          console.error(`❌ ${result.message}`);
          if (result.metadata) {
            console.error(
              `   Repository: ${result.metadata.owner}/${result.metadata.repo}`,
            );
            if (result.metadata.checkedIssues?.length) {
              console.error(
                `   Checked issues: #${result.metadata.checkedIssues.join(", #")}`,
              );
            }
          }
          process.exit(result.reason === "error" ? 2 : 1);
        }
      } catch (error) {
        console.error(`❌ Unexpected error: ${String(error)}`);
        process.exit(2);
      }
    });

  return command;
}
