#!/usr/bin/env bun
/**
 * NPM Package E2E Test (Minimal)
 *
 * Tests the essential NPM package lifecycle:
 * 1. Create package with `bun pm pack` (converts workspace:* to actual versions)
 * 2. Install locally with dependencies
 * 3. Run basic CLI commands
 * 4. Test npx execution
 * 5. Clean up installation
 *
 * IMPORTANT: Monorepo E2E Test Limitations
 * ==========================================
 * This E2E test has inherent limitations for monorepo packages with workspace dependencies:
 *
 * - The test will ONLY work properly AFTER the dependent packages (@issue-linker/core)
 *   are published to npm registry
 * - Before first release, the test cannot fully simulate real user installation
 * - This is a common challenge for monorepo E2E testing
 *
 * Why this happens:
 * 1. `bun pm pack` converts `workspace:*` → `0.0.0`
 * 2. `npm install` tries to fetch `@issue-linker/core@0.0.0` from registry
 * 3. Package doesn't exist in registry yet = installation fails
 *
 * Current workaround:
 * - Install both packages locally in a temp directory
 * - This tests basic functionality but not the actual npm install flow
 *
 * For projects using this as a template:
 * - Run E2E tests AFTER your first npm publish
 * - Or use integration tests (*.test.ts) for pre-release testing
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
const corePackagePath: string | null = null;
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

  // Step 3: Create npm packages using bun (automatically handles workspace:*)
  console.log("\n📦 Creating npm packages using bun...");

  // First, pack the core package
  console.log("  Packing @issue-linker/core with bun...");
  const corePackageDir = join(projectRoot, "packages", "core");
  const corePackOutput = execSync("bun pm pack", {
    cwd: corePackageDir,
  }).toString();
  const coreFilenameMatch = corePackOutput.match(
    /(issue-linker-core-[\d.]+\.tgz)/m,
  );
  const corePackageFile = coreFilenameMatch
    ? coreFilenameMatch[1]
    : "issue-linker-core-0.0.0.tgz";
  const corePackagePath = join(corePackageDir, corePackageFile);
  console.log(`  ✅ Core package created: ${corePackageFile}`);

  // Then pack the CLI package
  console.log("  Packing issue-linker CLI with bun...");
  const packOutput = execSync("bun pm pack", { cwd: cliPackageDir }).toString();

  // Extract the filename from bun's output
  const filenameMatch = packOutput.match(/(issue-linker-[\d.]+\.tgz)/m);
  packageFile = filenameMatch ? filenameMatch[1] : "issue-linker-0.0.0.tgz";
  console.log(`  ✅ CLI package created: ${packageFile}`);

  // Check package size from bun's output
  const sizeMatch = packOutput.match(/Packed size: ([\d.]+[KMG]B)/m);
  if (sizeMatch) {
    console.log(`📊 Package size: ${sizeMatch[1]}`);
    // Convert to MB for warning check
    const sizeStr = sizeMatch[1];
    let sizeMB = 0;
    if (sizeStr.endsWith("KB")) {
      sizeMB = parseFloat(sizeStr) / 1024;
    } else if (sizeStr.endsWith("MB")) {
      sizeMB = parseFloat(sizeStr);
    } else if (sizeStr.endsWith("GB")) {
      sizeMB = parseFloat(sizeStr) * 1024;
    }
    if (sizeMB > 5) {
      console.warn(
        `⚠️  Warning: Package size is large (${sizeMB.toFixed(2)} MB)`,
      );
    }
  }

  // Step 4: Create test directory and install packages locally
  console.log("\n📥 Creating test environment...");

  // Create a temp directory for testing
  tempDir = mkdtempSync(join(tmpdir(), "e2e-test-"));
  console.log(`  Created test directory: ${tempDir}`);

  // Install both packages in the temp directory
  console.log("  Installing packages locally...");
  execSync(
    `npm install ${corePackagePath} ${join(cliPackageDir, packageFile)}`,
    {
      cwd: tempDir,
      stdio: "inherit",
    },
  );

  // Link the CLI globally from the local installation
  console.log("  Linking CLI globally...");
  execSync(`npm link ${packageName}`, {
    cwd: tempDir,
    stdio: "pipe",
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

  // Test npx with the already installed package
  console.log("  Testing npx with installed package...");
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
      execSync(`npm uninstall -g ${packageName} @issue-linker/core`, {
        stdio: "pipe",
      });
      console.log("✅ npm packages uninstalled");
    } catch {
      console.warn("⚠️  Failed to uninstall npm packages");
    }
  }

  if (packageFile && existsSync(join(cliPackageDir, packageFile))) {
    rmSync(join(cliPackageDir, packageFile));
    console.log("✅ CLI package file removed");
  }

  if (corePackagePath && existsSync(corePackagePath)) {
    rmSync(corePackagePath);
    console.log("✅ Core package file removed");
  }

  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true });
    console.log("✅ Temporary directory removed");
  }
}

console.log("\n✨ E2E test completed!");
