#!/usr/bin/env bun

// Main CLI entry point for issue-linker

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "@commander-js/extra-typings";
import {
  checkMessage,
  type ExtractionMode,
  type IssueValidationResult,
} from "@issue-linker/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

// Configure main program
program
  .name("issue-linker")
  .description("Validate text contains valid GitHub issue numbers")
  .version(packageJson.version)
  .requiredOption("-t, --text <text>", "text to validate")
  .option(
    "--mode <mode>",
    "extraction mode: default | branch | commit",
    "default",
  )
  .option("--exclude <pattern>", "exclude pattern (glob)")
  .option(
    "--issue-status <status>",
    "issue status filter: all | open | closed",
    "all",
  )
  .option("--repo <owner/repo>", "repository (default: current repository)")
  .option("--github-token <token>", "GitHub token (default: GITHUB_TOKEN env)")
  .option("--json", "output full result as JSON")
  .action(async (options) => {
    try {
      // Validate mode
      const validModes = ["default", "branch", "commit"];
      if (!validModes.includes(options.mode)) {
        console.error(`❌ Invalid mode: ${options.mode}`);
        console.error(`   Valid modes are: ${validModes.join(", ")}`);
        process.exit(1);
      }

      // Validate issue status
      const validStatuses = ["all", "open", "closed"];
      if (!validStatuses.includes(options.issueStatus)) {
        console.error(`❌ Invalid issue status: ${options.issueStatus}`);
        console.error(`   Valid statuses are: ${validStatuses.join(", ")}`);
        process.exit(1);
      }

      // Check text with provided options
      const messageOptions: Parameters<typeof checkMessage>[0] = {
        text: options.text,
        mode: options.mode as ExtractionMode,
        issueStatus: options.issueStatus as "all" | "open" | "closed",
      };
      if (options.exclude) messageOptions.exclude = options.exclude;
      if (options.repo) messageOptions.repo = options.repo;
      if (options.githubToken) messageOptions.githubToken = options.githubToken;

      const result: IssueValidationResult = await checkMessage(messageOptions);

      // Output JSON if requested
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      }

      // Display human-readable result
      if (result.success) {
        console.log(`✅ ${result.message}`);
        if (result.reason === "excluded") {
          console.log(`   Text was excluded from validation`);
        } else if (result.issues?.valid && result.issues.valid.length > 0) {
          console.log(`   Valid issues: #${result.issues.valid.join(", #")}`);
        }
        console.log(`   Mode: ${result.input.mode}`);
        if (result.input.repo) {
          console.log(`   Repository: ${result.input.repo}`);
        }
        process.exit(0);
      } else {
        console.error(`❌ ${result.message}`);
        if (result.issues) {
          if (result.issues.found.length > 0) {
            console.error(
              `   Found issues: #${result.issues.found.join(", #")}`,
            );
          }
          if (result.issues.valid.length > 0) {
            console.error(`   Valid: #${result.issues.valid.join(", #")}`);
          }
          const invalidCount =
            result.issues.notFound.length + result.issues.wrongState.length;
          if (invalidCount > 0) {
            const invalid = [
              ...result.issues.notFound,
              ...result.issues.wrongState,
            ];
            console.error(`   Invalid: #${invalid.join(", #")}`);
          }
        }
        console.error(`   Mode: ${result.input.mode}`);
        if (result.input.repo) {
          console.error(`   Repository: ${result.input.repo}`);
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Unexpected error: ${String(error)}`);
      process.exit(2);
    }
  });

// Parse command line arguments
program.parse();
