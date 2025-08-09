// Branch subcommand implementation

import { Command } from "@commander-js/extra-typings";
import { checkBranch, DEFAULT_CHECK_OPTIONS } from "@issue-linker/core";

export function createBranchCommand() {
  const command = new Command("branch")
    .description("Check if branch name contains an issue number")
    .option(
      "-b, --branch <branch>",
      "branch name to check (default: current branch)",
    )
    .option(
      "-r, --repo <owner/repo>",
      "repository (default: current repository)",
    )
    .option(
      "--exclude-pattern <pattern>",
      `glob pattern to exclude branches (default: ${DEFAULT_CHECK_OPTIONS.excludePattern})`,
      DEFAULT_CHECK_OPTIONS.excludePattern,
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
    .action(async (options) => {
      try {
        // Check branch with provided options
        const result = await checkBranch({
          ...(options.branch && { branch: options.branch }),
          ...(options.repo && { repo: options.repo }),
          ...(options.githubToken && { githubToken: options.githubToken }),
          excludePattern: options.excludePattern,
          issueStatus: options.issueStatus,
        });

        // Display result
        if (result.success) {
          console.log(`✅ ${result.message}`);
          if (result.metadata) {
            console.log(
              `   Repository: ${result.metadata.owner}/${result.metadata.repo}`,
            );
            if (result.issueNumber) {
              console.log(`   Issue: #${result.issueNumber}`);
            }
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
                `   Checked issues: ${result.metadata.checkedIssues.join(", ")}`,
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
