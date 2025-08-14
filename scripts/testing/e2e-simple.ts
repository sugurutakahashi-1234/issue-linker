#!/usr/bin/env bun
/**
 * Simple E2E Test for CLI
 *
 * Directly tests the built CLI distribution file without npm package simulation.
 * Tests basic functionality: --version, --help, and basic text checking.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

console.log("🧪 Starting simple E2E test...\n");

const projectRoot = join(import.meta.dir, "..", "..");
const cliPackageDir = join(projectRoot, "packages", "cli");
const cliDistPath = join(cliPackageDir, "dist", "cli.js");
const packageJson = JSON.parse(
  readFileSync(join(cliPackageDir, "package.json"), "utf-8"),
);

try {
  // Step 1: Check if CLI is built
  if (!existsSync(cliDistPath)) {
    console.error("❌ CLI not built. Please run 'bun run build' first.");
    process.exit(1);
  }
  console.log("✅ CLI dist file exists");

  // Step 2: Test --version
  console.log("\n📋 Testing --version...");
  const versionResult = spawnSync("bun", [cliDistPath, "--version"], {
    encoding: "utf-8",
  });

  if (versionResult.status !== 0) {
    throw new Error(`--version command failed: ${versionResult.stderr}`);
  }

  const version = versionResult.stdout.trim();
  if (version !== packageJson.version) {
    throw new Error(
      `Version mismatch: expected ${packageJson.version}, got ${version}`,
    );
  }
  console.log(`  ✅ Version: ${version}`);

  // Step 3: Test --help
  console.log("\n📋 Testing --help...");
  const helpResult = spawnSync("bun", [cliDistPath, "--help"], {
    encoding: "utf-8",
  });

  if (helpResult.status !== 0) {
    throw new Error(`--help command failed: ${helpResult.stderr}`);
  }

  const helpOutput = helpResult.stdout;
  const expectedOptions = [
    "-t, --text",
    "-c, --check-mode",
    "--issue-status",
    "--extract",
    "--exclude",
    "--repo",
    "--github-token",
    "--hostname",
    "--json",
    "--verbose",
    "-v, --version",
    "-h, --help",
  ];

  for (const option of expectedOptions) {
    if (!helpOutput.includes(option)) {
      throw new Error(`Help output missing expected option: ${option}`);
    }
  }
  console.log("  ✅ Help command shows all expected options");

  // Step 4: Test basic text checking (skip actual validation to avoid API calls)
  console.log("\n📋 Testing basic text checking...");
  const checkResult = spawnSync(
    "bun",
    [cliDistPath, "-t", "Fix issue [skip issue-linker]"],
    {
      encoding: "utf-8",
    },
  );

  // Should succeed with skip marker
  if (checkResult.status !== 0) {
    throw new Error(`Text check failed: ${checkResult.stderr}`);
  }

  // Should output skip message
  if (!checkResult.stdout.includes("Skipped")) {
    throw new Error("Expected skip message in output");
  }
  console.log("  ✅ Basic text checking works with skip marker");

  // Step 5: Test invalid option handling
  console.log("\n📋 Testing invalid option handling...");
  const invalidResult = spawnSync(
    "bun",
    [cliDistPath, "-t", "test", "--invalid-option"],
    {
      encoding: "utf-8",
    },
  );

  if (invalidResult.status === 0) {
    throw new Error("CLI should fail with invalid option");
  }

  if (!invalidResult.stderr.includes("unknown option")) {
    throw new Error("Expected error message for unknown option");
  }
  console.log("  ✅ Invalid options are properly rejected");

  // Step 6: Test exclude patterns
  console.log("\n📋 Testing exclude patterns...");
  const excludeResult = spawnSync(
    "bun",
    [cliDistPath, "-t", "[WIP] Fix #123", "--exclude", "*[WIP]*"],
    {
      encoding: "utf-8",
    },
  );

  if (excludeResult.status !== 0) {
    throw new Error(`Exclude pattern test failed: ${excludeResult.stderr}`);
  }

  if (
    !excludeResult.stdout.includes("Skipped") ||
    !excludeResult.stdout.includes("exclude pattern")
  ) {
    throw new Error("Expected skip message with exclude pattern in output");
  }
  console.log("  ✅ Exclude patterns work correctly");

  // Step 7: Test branch mode
  console.log("\n📋 Testing branch mode...");
  const branchResult = spawnSync(
    "bun",
    [
      cliDistPath,
      "-t",
      "feature/123-auth-fix [skip issue-linker]",
      "-c",
      "branch",
    ],
    {
      encoding: "utf-8",
    },
  );

  if (branchResult.status !== 0) {
    throw new Error(`Branch mode test failed: ${branchResult.stderr}`);
  }
  console.log("  ✅ Branch mode extraction works");

  console.log("\n✅ All E2E tests passed!");
  process.exit(0);
} catch (error) {
  console.error(
    "\n❌ E2E test failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
