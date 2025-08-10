#!/usr/bin/env bun

// Main CLI entry point for issue-linker

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "@commander-js/extra-typings";
import { checkMessage, type ExtractionMode } from "@issue-linker/core";

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

      const result = await checkMessage(messageOptions);

      // Display result
      if (result.success) {
        console.log(`✅ ${result.message}`);
        if (result.excluded) {
          console.log(`   Text was excluded from validation`);
        } else if (result.validIssues.length > 0) {
          console.log(`   Valid issues: #${result.validIssues.join(", #")}`);
        }
        console.log(`   Mode: ${result.metadata.mode}`);
        if (result.metadata.repo) {
          console.log(`   Repository: ${result.metadata.repo}`);
        }
        process.exit(0);
      } else {
        console.error(`❌ ${result.message}`);
        if (result.issueNumbers.length > 0) {
          console.error(`   Found issues: #${result.issueNumbers.join(", #")}`);
          if (result.validIssues.length > 0) {
            console.error(`   Valid: #${result.validIssues.join(", #")}`);
          }
          if (result.invalidIssues.length > 0) {
            console.error(`   Invalid: #${result.invalidIssues.join(", #")}`);
          }
        }
        console.error(`   Mode: ${result.metadata.mode}`);
        if (result.metadata.repo) {
          console.error(`   Repository: ${result.metadata.repo}`);
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
