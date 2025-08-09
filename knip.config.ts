import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // Let knip auto-detect entry points from package.json
  ignoreDependencies: ["tslib", "@commitlint/cli"], // tslib is a runtime dependency, @commitlint/cli is used in CI only
  ignoreBinaries: ["node-size"], // node-size: used in npm scripts
  ignoreExportsUsedInFile: false,
  ignore: [".elsikora/git-branch-lint.config.ts"], // git-branch-lint configuration file

  // IMPORTANT: Keep this as true to detect real unused exports
  // DO NOT set to false - it would hide real issues
  includeEntryExports: true,

  typescript: {
    config: ["tsconfig.base.json"],
  },

  // ============================================================================
  // When to use @public JSDoc tags:
  // ============================================================================
  // IMPORTANT: Only use @public tags in src/index.ts files
  //
  // Use @public tags on exports in the following scenarios:
  // 1. Monorepo packages that expose public APIs to other packages
  // 2. Library entry points that are consumed by external users
  // 3. Type definitions and interfaces intended for external use
  // 4. Core functionality that other packages depend on
  //
  // WHERE TO ADD @public TAGS:
  // ✅ packages/*/src/index.ts - ONLY in these entry point files
  // ❌ packages/*/src/[subfolders]/*.ts - Never in internal implementation files
  //
  // This keeps a clear boundary between public API (index.ts) and internal
  // implementation details, making refactoring easier and safer.
  //
  // Example: Add /** @public */ above each export in packages/*/src/index.ts
  // ============================================================================

  // ============================================================================
  // Approaches that were tested but proved ineffective:
  // ============================================================================
  // ❌ workspaces configuration - Too complex and didn't resolve false positives
  // ❌ includeEntryExports: false - This only hides real issues
  // ❌ ignore: ["packages/*/src/index.ts"] - Poor maintainability
  // ❌ tags: ["+public"] in config - Requires @public tags anyway
  // ✅ Solution: Use @public JSDoc tags on exported members
  // ============================================================================
};

export default config;
