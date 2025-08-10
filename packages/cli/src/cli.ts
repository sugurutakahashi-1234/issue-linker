#!/usr/bin/env bun

// Main CLI entry point for issue-linker

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "@commander-js/extra-typings";
import {
  type CheckMessageOptions,
  CheckMessageOptionsSchema,
  checkMessage,
  type IssueValidationResult,
} from "@issue-linker/core";
import * as v from "valibot";

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
      // Validate CLI options using schema from core
      let validatedOptions: CheckMessageOptions;
      try {
        validatedOptions = v.parse(CheckMessageOptionsSchema, {
          text: options.text,
          mode: options.mode,
          issueStatus: options.issueStatus,
          ...(options.exclude && { exclude: options.exclude }),
          ...(options.repo && { repo: options.repo }),
          ...(options.githubToken && { githubToken: options.githubToken }),
        });
      } catch (error) {
        if (error instanceof v.ValiError) {
          console.error(`❌ Invalid options: ${error.message}`);
          process.exit(1);
        }
        throw error;
      }

      const result: IssueValidationResult =
        await checkMessage(validatedOptions);

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
