#!/usr/bin/env bun

// CLI interface for issue-number-branch validation

// Read package.json for version info
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "@commander-js/extra-typings";
import {
  checkBranch,
  DEFAULT_CHECK_OPTIONS,
  type IssueStateFilter,
} from "@sugurutakahashi-1234/issue-number-branch-api";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

program
  .name("issue-number-branch")
  .description("Validate branch names against issue numbers")
  .version(packageJson.version)
  .option(
    "-b, --branch <branch>",
    "branch name to check (default: current branch)",
  )
  .option(
    "-r, --repo <owner/repo>",
    "repository in owner/repo format (default: current repository)",
  )
  .option(
    "--exclude-pattern <pattern>",
    `glob pattern to exclude branches (default: ${DEFAULT_CHECK_OPTIONS.excludePattern})\n` +
      "Pattern examples:\n" +
      "  '{main,master,develop}'  - exclude specific branches\n" +
      "  'release/*'              - exclude with wildcard\n" +
      "  '{release,hotfix}/*'     - exclude multiple prefixes\n" +
      "  '!(feature|bugfix)/*'    - exclude all except these",
    DEFAULT_CHECK_OPTIONS.excludePattern,
  )
  .option(
    "--issue-state <state>",
    `filter by issue state: all, open, or closed (default: ${DEFAULT_CHECK_OPTIONS.issueState})\n` +
      "Examples:\n" +
      "  'all'    - check both open and closed issues\n" +
      "  'open'   - check only open issues\n" +
      "  'closed' - check only closed issues",
    DEFAULT_CHECK_OPTIONS.issueState,
  )
  .action(async (options) => {
    try {
      // Check branch with provided options (validation is done in Core layer)
      const result = await checkBranch({
        ...(options.branch && { branch: options.branch }),
        ...(options.repo && { repo: options.repo }),
        excludePattern: options.excludePattern,
        issueState: options.issueState as IssueStateFilter,
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
