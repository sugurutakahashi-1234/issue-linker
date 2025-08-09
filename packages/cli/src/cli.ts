#!/usr/bin/env bun

// Main CLI entry point for issue-linker

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "@commander-js/extra-typings";
import { createBranchCommand } from "./commands/branch.js";
import { createCommitCommand } from "./commands/commit.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

// Configure main program
program
  .name("issue-linker")
  .description(
    "Validate branch names and commit messages against GitHub issue numbers",
  )
  .version(packageJson.version);

// Add subcommands
program.addCommand(createBranchCommand());
program.addCommand(createCommitCommand());

// Parse command line arguments
program.parse();
