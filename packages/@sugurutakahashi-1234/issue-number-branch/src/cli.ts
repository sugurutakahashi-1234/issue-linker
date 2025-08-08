#!/usr/bin/env bun
// CLI interface with --exclude-glob and --allowed-states options

import { checkCurrentBranch } from "@sugurutakahashi-1234/issue-number-branch-api";

function getArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length
    ? process.argv[i + 1]
    : undefined;
}

async function main() {
  // TODO: Add --help option
  // TODO: Add better error messages and user feedback

  const excludeGlob = getArg("--exclude-glob") ?? "main|master|develop";
  const allowedStates = (getArg("--allowed-states") ?? "open,closed")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as ("open" | "closed")[];

  const res = await checkCurrentBranch({ excludeGlob, allowedStates });

  if (res.ok) {
    console.log(`OK: ${res.message}`);
    process.exit(0);
  } else {
    const prefix = res.reason === "error" ? "ERR" : "NG";
    console.error(`${prefix}: ${res.message}`);
    process.exit(res.reason === "error" ? 2 : 1);
  }
}

// TODO: Handle uncaught exceptions more gracefully
main().catch((e) => {
  console.error(`ERR: ${String(e)}`);
  process.exit(2);
});
