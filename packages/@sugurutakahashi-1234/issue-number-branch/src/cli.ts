#!/usr/bin/env bun

// CLI interface for issue-number-branch validation

// Read package.json for version info
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "@commander-js/extra-typings";
import { checkCurrentBranch } from "@sugurutakahashi-1234/issue-number-branch-api";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

program
  .name("issue-number-branch")
  .description("Validate branch names against issue numbers")
  .version(packageJson.version)
  .option(
    "--exclude-glob <pattern>",
    "glob pattern to exclude from validation",
    "main|master|develop",
  )
  .option(
    "--allowed-states <states>",
    "comma-separated list of allowed issue states",
    "open,closed",
  )
  .action(async (options) => {
    try {
      // Parse allowed states
      const allowedStates = options.allowedStates
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as ("open" | "closed")[];

      // Validate allowed states
      for (const state of allowedStates) {
        if (state !== "open" && state !== "closed") {
          console.error(
            `ERR: Invalid state "${state}". Allowed states are "open" or "closed".`,
          );
          process.exit(2);
        }
      }

      // Check current branch
      const res = await checkCurrentBranch({
        excludeGlob: options.excludeGlob,
        allowedStates,
      });

      if (res.ok) {
        console.log(`OK: ${res.message}`);
        process.exit(0);
      } else {
        const prefix = res.reason === "error" ? "ERR" : "NG";
        console.error(`${prefix}: ${res.message}`);
        process.exit(res.reason === "error" ? 2 : 1);
      }
    } catch (error) {
      // Handle unexpected errors
      console.error(`ERR: Unexpected error: ${String(error)}`);
      process.exit(2);
    }
  });

// Parse command line arguments
program.parse();
