#!/usr/bin/env bun
/**
 * NPM Package E2E Test (Minimal)
 *
 * Tests the essential NPM package lifecycle:
 * 1. Create package with `npm pack`
 * 2. Install globally with `npm install -g`
 * 3. Run basic CLI commands
 * 4. Test npx execution
 * 5. Clean up installation
 *
 * Detailed functional tests are covered in packages/cli/src/cli.test.ts
 */
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

console.log("🧪 Starting npm package E2E test...\n");

const projectRoot = join(import.meta.dir, "..", "..");
const cliPackageDir = join(projectRoot, "packages", "cli");
const packageJsonPath = join(cliPackageDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const packageName = packageJson.name;
let packageFile: string | null = null;
let isInstalled = false;
let tempDir: string | null = null;

// Clean up any existing npm installation
try {
  console.log("🧹 Checking for existing npm installation...");
  execSync(`npm uninstall -g ${packageName}`, { stdio: "pipe" });
  console.log("✅ Removed existing npm installation");
} catch {
  // Package not installed, which is fine
  console.log("✅ No existing npm installation found");
}

try {
  // Step 1: Check if built
  const distDir = join(cliPackageDir, "dist");
  if (!existsSync(distDir)) {
    console.error(
      "❌ CLI package not built. Please run 'bun run build' first.",
    );
    process.exit(1);
  }

  // Step 2: Build core package first (since CLI depends on it)
  console.log("\n🔨 Building core package...");
  execSync("bun run build", {
    cwd: join(projectRoot, "packages", "core"),
    stdio: "inherit",
  });
  console.log("✅ Core package built");

  // Step 3: Install workspace packages properly using npm
  console.log("\n📦 Creating npm packages with proper workspace resolution...");

  // Use npm pack with workspace protocol resolution
  // First pack from the root to handle workspace dependencies
  console.log("📦 Packing from workspace root...");
  const packOutput = execSync(
    `npm pack ./packages/cli --pack-destination ${tmpdir()}`,
    { cwd: projectRoot },
  )
    .toString()
    .trim();

  const tempPackageFile = packOutput.split("\n").pop() || "";
  const tempPackagePath = join(tmpdir(), tempPackageFile);

  // Move to CLI directory for consistency
  packageFile = `issue-linker-0.0.0.tgz`;
  const finalPackagePath = join(cliPackageDir, packageFile);

  if (existsSync(finalPackagePath)) {
    rmSync(finalPackagePath);
  }

  // Move the package to the expected location
  execSync(`mv "${tempPackagePath}" "${finalPackagePath}"`);
  console.log(`✅ Created CLI package: ${packageFile}`);

  // Check package size
  const sizeOutput = execSync(`npm pack --dry-run --json`, {
    cwd: cliPackageDir,
  });
  const packInfo = JSON.parse(sizeOutput.toString());
  const sizeMB = packInfo[0].size / (1024 * 1024);
  console.log(`📊 Package size: ${sizeMB.toFixed(2)} MB`);

  if (sizeMB > 5) {
    console.warn(`⚠️  Warning: Package size is large (${sizeMB.toFixed(2)} MB)`);
  }

  // Step 4: Install globally
  console.log("\n📥 Installing package globally...");
  execSync(`npm install -g ${join(cliPackageDir, packageFile)}`, {
    stdio: "inherit",
  });
  isInstalled = true;

  // Step 5: Test basic commands
  console.log("\n🧪 Testing basic commands...");

  // Test version
  console.log("  Testing --version...");
  const version = execSync(`${packageName} --version`).toString().trim();
  console.log(`  ✅ Version: ${version}`);
  if (version !== packageJson.version) {
    throw new Error(
      `Version mismatch: expected ${packageJson.version}, got ${version}`,
    );
  }

  // Test help
  console.log("  Testing --help...");
  const helpOutput = execSync(`${packageName} --help`).toString();
  if (
    !helpOutput.includes("-t, --text") ||
    !helpOutput.includes("--check-mode")
  ) {
    throw new Error("Help output missing expected options");
  }
  console.log("  ✅ Help command works");

  // Step 6: Test simple functionality
  console.log("\n🧪 Testing basic functionality...");

  // Test with excluded branch name (should succeed)
  console.log("  Testing excluded branch validation...");
  const excludedOutput = execSync(
    `${packageName} -t main --check-mode branch`,
  ).toString();
  if (!excludedOutput.includes("excluded from validation")) {
    throw new Error("Excluded branch test failed");
  }
  console.log("  ✅ Excluded branch validation works");

  // Step 7: Test with npx
  console.log("\n🧪 Testing npx execution...");

  // Create a temp directory for npx test
  tempDir = mkdtempSync(join(tmpdir(), "npx-test-"));

  // Uninstall global package first to test npx
  console.log("  Uninstalling global package for npx test...");
  execSync(`npm uninstall -g ${packageName}`, { stdio: "pipe" });
  isInstalled = false;

  // Test npx with the package name (will download from npm registry or use cache)
  console.log("  Testing npx with package name...");
  // First install the package locally in the temp directory
  execSync(`npm install ${join(cliPackageDir, packageFile)}`, {
    cwd: tempDir,
    stdio: "pipe",
  });

  // Then test npx with the package name
  const npxOutput = execSync(`npx ${packageName} --version`, { cwd: tempDir })
    .toString()
    .trim();

  if (npxOutput !== packageJson.version) {
    throw new Error(
      `npx version test failed: expected ${packageJson.version}, got ${npxOutput}`,
    );
  }
  console.log("  ✅ npx execution works correctly");

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

  if (isInstalled) {
    try {
      execSync(`npm uninstall -g ${packageName}`, { stdio: "pipe" });
      console.log("✅ npm package uninstalled");
    } catch {
      console.warn("⚠️  Failed to uninstall npm package");
    }
  }

  if (packageFile && existsSync(join(cliPackageDir, packageFile))) {
    rmSync(join(cliPackageDir, packageFile));
    console.log("✅ Package file removed");
  }

  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true });
    console.log("✅ Temporary directory removed");
  }
}

console.log("\n✨ E2E test completed!");
