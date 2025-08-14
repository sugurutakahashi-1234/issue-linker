#!/usr/bin/env bun
/**
 * NPM Package E2E Test
 *
 * Tests the package lifecycle before publishing:
 * 1. Build and pack both packages with bun
 * 2. Install locally with npm
 * 3. Test CLI execution
 */
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

console.log("🧪 Starting npm package E2E test...\n");

const projectRoot = join(import.meta.dir, "..", "..");
const cliPackageDir = join(projectRoot, "packages", "cli");
const corePackageDir = join(projectRoot, "packages", "core");
const packageJson = JSON.parse(
  readFileSync(join(cliPackageDir, "package.json"), "utf-8"),
);
const packageName = packageJson.name;

let tempDir: string | null = null;
let cliPackageFile: string | null = null;
let corePackageFile: string | null = null;

try {
  // Step 1: Check if packages are built
  if (!existsSync(join(cliPackageDir, "dist"))) {
    console.error(
      "❌ CLI package not built. Please run 'bun run build' first.",
    );
    process.exit(1);
  }

  // Step 2: Build core package
  console.log("🔨 Building core package...");
  execSync("bun run build", {
    cwd: corePackageDir,
    stdio: "inherit",
  });
  console.log("✅ Core package built");

  // Step 3: Create npm packages using bun pm pack
  console.log("\n📦 Creating npm packages...");

  // Pack core package
  console.log("  Packing @issue-linker/core...");
  const corePackOutput = execSync("bun pm pack", {
    cwd: corePackageDir,
  }).toString();
  const coreMatch = corePackOutput.match(/(issue-linker-core-[\d.]+\.tgz)/);
  corePackageFile = coreMatch ? coreMatch[1] : "issue-linker-core-1.0.0.tgz";
  const corePackagePath = join(corePackageDir, corePackageFile);
  console.log(`  ✅ Core package: ${corePackageFile}`);

  // Pack CLI package
  console.log("  Packing issue-linker CLI...");
  const cliPackOutput = execSync("bun pm pack", {
    cwd: cliPackageDir,
  }).toString();
  const cliMatch = cliPackOutput.match(/(issue-linker-[\d.]+\.tgz)/);
  cliPackageFile = cliMatch ? cliMatch[1] : "issue-linker-1.0.0.tgz";
  const cliPackagePath = join(cliPackageDir, cliPackageFile);
  console.log(`  ✅ CLI package: ${cliPackageFile}`);

  // Step 4: Install packages in temp directory
  console.log("\n📥 Installing packages...");
  tempDir = mkdtempSync(join(tmpdir(), "e2e-test-"));
  console.log(`  Test directory: ${tempDir}`);

  execSync(`npm install "${corePackagePath}" "${cliPackagePath}"`, {
    cwd: tempDir,
    stdio: "inherit",
  });

  // Step 5: Test CLI execution
  console.log("\n🧪 Testing CLI commands...");
  const cliCommand = join(tempDir, "node_modules", ".bin", packageName);

  // Test --version
  console.log("  Testing --version...");
  const version = execSync(`"${cliCommand}" --version`).toString().trim();
  if (version !== packageJson.version) {
    throw new Error(
      `Version mismatch: expected ${packageJson.version}, got ${version}`,
    );
  }
  console.log(`  ✅ Version: ${version}`);

  // Test --help
  console.log("  Testing --help...");
  const helpOutput = execSync(`"${cliCommand}" --help`).toString();
  if (
    !helpOutput.includes("-t, --text") ||
    !helpOutput.includes("--check-mode")
  ) {
    throw new Error("Help output missing expected options");
  }
  console.log("  ✅ Help command works");

  // Step 6: Test npx execution
  console.log("\n🧪 Testing npx...");
  const npxVersion = execSync(`npx ${packageName} --version`, { cwd: tempDir })
    .toString()
    .trim();
  if (npxVersion !== packageJson.version) {
    throw new Error(
      `npx test failed: expected ${packageJson.version}, got ${npxVersion}`,
    );
  }
  console.log("  ✅ npx works correctly");

  console.log("\n✅ All tests passed!");
} catch (error) {
  console.error(
    "\n❌ Test failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
} finally {
  // Cleanup
  console.log("\n🧹 Cleaning up...");

  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true });
    console.log("✅ Temp directory removed");
  }

  if (cliPackageFile && existsSync(join(cliPackageDir, cliPackageFile))) {
    rmSync(join(cliPackageDir, cliPackageFile));
    console.log("✅ CLI package file removed");
  }

  if (corePackageFile && existsSync(join(corePackageDir, corePackageFile))) {
    rmSync(join(corePackageDir, corePackageFile));
    console.log("✅ Core package file removed");
  }
}

console.log("\n✨ E2E test completed!");
