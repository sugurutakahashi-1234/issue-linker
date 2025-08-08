#!/usr/bin/env bun

// CLI interface for issue-number-branch validation

// Read package.json for version info
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "@commander-js/extra-typings";
import {
  checkBranch,
  type IssueStateFilter,
} from "@sugurutakahashi-1234/issue-number-branch-api";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

program
  .name("issue-number-branch")
  .description("Validate branch names against issue numbers")
  .version(packageJson.version)
  .option("--branch <branch>", "branch name to check (default: current branch)")
  .option("--owner <owner>", "repository owner (default: from git remote)")
  .option("--repo <repo>", "repository name (default: from git remote)")
  .option(
    "--exclude-pattern <pattern>",
    "glob pattern to exclude branches (default: {main,master,develop})\n" +
      "Pattern examples:\n" +
      "  '{main,master,develop}'  - exclude specific branches\n" +
      "  'release/*'              - exclude with wildcard\n" +
      "  '{release,hotfix}/*'     - exclude multiple prefixes\n" +
      "  '!(feature|bugfix)/*'    - exclude all except these",
    "{main,master,develop}",
  )
  .option(
    "--issue-state <state>",
    "filter by issue state: all, open, or closed (default: all)\n" +
      "Examples:\n" +
      "  'all'    - check both open and closed issues\n" +
      "  'open'   - check only open issues\n" +
      "  'closed' - check only closed issues",
    "all",
  )
  .action(async (options) => {
    try {
      // Validate issue state option
      const issueState = options.issueState as IssueStateFilter;
      if (
        issueState !== "all" &&
        issueState !== "open" &&
        issueState !== "closed"
      ) {
        console.error(
          `❌ Invalid issue state "${issueState}". Valid options are "all", "open", or "closed".`,
        );
        process.exit(2);
      }

      // Check branch with provided options
      const result = await checkBranch({
        ...(options.branch && { branch: options.branch }),
        ...(options.owner && { owner: options.owner }),
        ...(options.repo && { repo: options.repo }),
        excludePattern: options.excludePattern,
        issueState,
      });

      // Display result with improved formatting
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
      // Handle unexpected errors
      console.error(`❌ Unexpected error: ${String(error)}`);
      process.exit(2);
    }
  });

// Parse command line arguments
program.parse();
