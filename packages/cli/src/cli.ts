#!/usr/bin/env bun

// Main CLI entry point for issue-linker

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "@commander-js/extra-typings";
import {
  type CheckMessageOptions,
  CheckMessageOptionsSchema,
  type CheckMessageResult,
  checkMessage,
  DEFAULT_OPTIONS,
} from "@issue-linker/core";
import * as v from "valibot";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

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
    "-c, --check-mode <mode>",
    "validation mode: 'default' (literal #123), 'branch' (extract from branch-123-name), 'commit' (same as default but excludes merge/rebase commits)",
    DEFAULT_OPTIONS.mode,
  )
  .option(
    "--extract <pattern>",
    "extraction pattern (regex) for finding issue numbers - overrides mode defaults",
  )
  .option(
    "--exclude <pattern>",
    'exclude pattern (glob) - overrides mode defaults. Use "" to disable defaults',
  )
  .option(
    "--issue-status <status>",
    "filter by issue status: 'all' (any state), 'open' (only open issues), 'closed' (only closed issues)",
    DEFAULT_OPTIONS.issueStatus,
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
      // Validate CLI options using schema from core
      let validatedOptions: CheckMessageOptions;
      try {
        validatedOptions = v.parse(CheckMessageOptionsSchema, {
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

      const result: CheckMessageResult = await checkMessage(validatedOptions);

      // Output JSON if requested
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      }

      // Display human-readable result
      if (result.success) {
        // Success output
        if (result.reason === "excluded") {
          console.log(`✅ Text was excluded from validation`);
        } else if (result.issues?.valid && result.issues.valid.length > 0) {
          console.log(`✅ Valid issues: #${result.issues.valid.join(", #")}`);
        } else {
          console.log(`✅ ${result.message}`);
        }

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
        // Error output
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
            const stateInfo =
              result.input.issueStatus === "all"
                ? "Wrong state"
                : `Wrong state (expected: ${result.input.issueStatus})`;
            details.push(
              `${stateInfo}: #${result.issues.wrongState.join(", #")}`,
            );
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
  $ issue-linker -t "Fix: resolve authentication error #123"
  $ issue-linker -t "feat/issue-123-auth-fix" -c branch
  $ issue-linker -t "Fix #123" --issue-status open

For more information:
  https://github.com/sugurutakahashi-1234/issue-linker
`,
  );

// Parse command line arguments
program.parse();
