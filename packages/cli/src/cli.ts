#!/usr/bin/env node

// Main CLI entry point for issue-linker

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "@commander-js/extra-typings";
import {
  type CheckMessageArgs,
  CheckMessageArgsSchema,
  type CheckMessageResult,
  checkMessage,
} from "@issue-linker/core";
import * as v from "valibot";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

// Get default values from schema
const defaultValues = v.getDefaults(CheckMessageArgsSchema);

// Configure main program
program
  .name("issue-linker")
  .description("Validate text contains valid GitHub issue numbers")
  .version(packageJson.version, "-v, --version", "display version number")
  .requiredOption(
    "-t, --text <text>",
    "text to validate (commit message, PR title, or branch name)",
  )
  .option(
    "-c, --check-mode <check-mode>",
    "validation mode: 'default' (literal #123), 'branch' (extract from branch-123-name), 'commit' (same as default but excludes merge/rebase commits)",
    defaultValues.checkMode,
  )
  .option(
    "--extract <pattern>",
    "custom extraction pattern (regex) that overrides check-mode defaults",
  )
  .option(
    "--exclude <pattern>",
    "custom exclude pattern (glob) that overrides check-mode defaults",
  )
  .option(
    "--issue-status <status>",
    "filter by issue status: 'all' (any state), 'open' (only open issues), 'closed' (only closed issues)",
    defaultValues.issueStatus,
  )
  .option(
    "--repo <owner/repo>",
    "target GitHub repository in owner/repo format (default: auto-detect from git remote)",
  )
  .option(
    "--github-token <token>",
    "GitHub personal access token for API authentication (default: $GITHUB_TOKEN or $GH_TOKEN)",
  )
  .option(
    "--hostname <hostname>",
    "GitHub Enterprise Server hostname (default: github.com or $GH_HOST)",
  )
  .option("--json", "output result in JSON format for CI/CD integration")
  .option("--verbose", "show detailed validation information and debug output")
  .helpOption("-h, --help", "display help for command")
  .action(async (options) => {
    try {
      // Validate CLI args using schema from core
      let validatedArgs: CheckMessageArgs;
      try {
        validatedArgs = v.parse(CheckMessageArgsSchema, {
          text: options.text,
          checkMode: options.checkMode,
          issueStatus: options.issueStatus,
          ...(options.extract && { extract: options.extract }),
          ...(options.exclude && { exclude: options.exclude }),
          ...(options.repo && { repo: options.repo }),
          ...(options.githubToken && { githubToken: options.githubToken }),
          ...(options.hostname && { hostname: options.hostname }),
        });
      } catch (error) {
        if (error instanceof v.ValiError) {
          console.error(`❌ Invalid options: ${error.message}`);
          process.exit(1);
        }
        throw error;
      }

      const result: CheckMessageResult = await checkMessage(validatedArgs);

      // Output JSON if requested
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      }

      // Display human-readable result
      if (result.success) {
        // Success output - use appropriate emoji based on reason
        const emoji =
          result.reason === "excluded" || result.reason === "skipped"
            ? "⏭️ "
            : "✅";
        console.log(`${emoji} ${result.message}`);

        // Show extra details in verbose mode
        if (options.verbose) {
          if (result.input.checkMode !== "default") {
            console.log(`   Check mode: ${result.input.checkMode}`);
          }
          if (result.input.repo) {
            console.log(`   Repository: ${result.input.repo}`);
          }
        }
        process.exit(0);
      } else {
        // Error output - simply use the message from result-factory
        console.error(`❌ ${result.message}`);

        // Show details
        if (result.issues && options.verbose) {
          const details = [];

          if (result.issues.valid.length > 0) {
            details.push(`Valid: #${result.issues.valid.join(", #")}`);
          }
          if (result.issues.notFound.length > 0) {
            details.push(`Not found: #${result.issues.notFound.join(", #")}`);
          }
          if (result.issues.wrongState.length > 0) {
            const wrongStateMessages = result.issues.wrongState.map((issue) => {
              const expected =
                result.input.issueStatus === "all"
                  ? ""
                  : ` (expected: ${result.input.issueStatus})`;
              return `#${issue.number} is ${issue.actualState}${expected}`;
            });
            details.push(`Wrong state: ${wrongStateMessages.join(", ")}`);
          }

          if (details.length > 0) {
            console.error(`   Details: ${details.join(", ")}`);
          }

          if (result.input.checkMode !== "default") {
            console.error(`   Check mode: ${result.input.checkMode}`);
          }
          if (result.input.repo) {
            console.error(`   Repository: ${result.input.repo}`);
          }
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Unexpected error: ${String(error)}`);
      process.exit(2);
    }
  })
  .addHelpText(
    "after",
    `
Examples:

  Basic validation:
    $ issue-linker -t "Fix: resolve authentication error #123"
    ✅ Valid issues: #123 in owner/repo

    $ issue-linker -t "feat/123-auth-fix" -c branch
    ✅ Valid issues: #123 in owner/repo

    $ issue-linker -t "Fix typo in README"
    ❌ No issue number found in text

  Git integration:
    $ issue-linker -t "$(git branch --show-current)" -c branch
    $ issue-linker -t "$(git log -1 --pretty=%s)" -c commit

  Skip validation:
    $ issue-linker -t "Release v2.0.0 [skip issue-linker]"
    ⏭️  Skipped: Contains [skip issue-linker] marker

    $ issue-linker -t "[WIP] Fix #789" --exclude "*[WIP]*"
    ⏭️  Excluded: Matched exclude pattern "*[WIP]*"

  Custom options:
    $ issue-linker -t "Fix #123" --issue-status open
    $ issue-linker -t "Fix #456" --repo owner/repo
    $ issue-linker -t "Fix #321" --hostname github.enterprise.com
    $ issue-linker -t "Fix #789" --json

Skip Markers:
  Use any of these markers to bypass validation (case-insensitive):
    [skip issue-linker], [skip-issue-linker]
    [issue-linker skip], [issue-linker-skip]

For more information:
  https://github.com/sugurutakahashi-1234/issue-linker
`,
  );

// Parse command line arguments
program.parse();
