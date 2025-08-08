// Use case boundary: CLI/Action should only use this API

import { execFile as _execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  type AllowedState,
  extractIssueNumbers,
  isExcluded,
} from "@sugurutakahashi-1234/issue-number-branch-core";

const execFile = promisify(_execFile);

/** @public */
export interface CheckOptions {
  excludeGlob?: string; // Default: "main|master|develop"
  allowedStates?: AllowedState[]; // Default: ["open","closed"]
  token?: string; // Default: env(GITHUB_TOKEN|GH_TOKEN)
}

/** @public */
export interface CheckResult {
  ok: boolean;
  reason: "excluded" | "no-number" | "not-found" | "error";
  branch: string;
  matched?: number;
  message: string;
}

/** @public */
export async function checkCurrentBranch(
  opts: CheckOptions = {},
): Promise<CheckResult> {
  const excludeGlob = opts.excludeGlob ?? "main|master|develop";
  const allowed = new Set<AllowedState>(
    opts.allowedStates ?? ["open", "closed"],
  );
  const token =
    opts.token ??
    // biome-ignore lint/complexity/useLiteralKeys: TODO: Fix TypeScript strict mode compatibility with noPropertyAccessFromIndexSignature
    process.env["GITHUB_TOKEN"] ??
    // biome-ignore lint/complexity/useLiteralKeys: TODO: Fix TypeScript strict mode compatibility with noPropertyAccessFromIndexSignature
    process.env["GH_TOKEN"] ??
    undefined;

  try {
    const branch = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).trim();

    // 1) Check exclusion
    if (isExcluded(branch, excludeGlob)) {
      return {
        ok: true,
        reason: "excluded",
        branch,
        message: `branch '${branch}' is excluded by '${excludeGlob}'`,
      };
    }

    // 2) Extract candidates
    const candidates = extractIssueNumbers(branch);
    if (candidates.length === 0) {
      return {
        ok: false,
        reason: "no-number",
        branch,
        message: `no numeric issue in '${branch}'`,
      };
    }

    // 3) Parse owner/repo
    const remote = (await git(["config", "--get", "remote.origin.url"])).trim();
    const { owner, repo } = parseOwnerRepo(remote);

    // 4) Check existence (return on first match)
    for (const n of candidates) {
      const ok = await issueExists(owner, repo, n, allowed, token);
      if (ok) {
        return {
          ok: true,
          reason: "excluded",
          branch,
          matched: n,
          message: `issue #${n} exists (${owner}/${repo})`,
        };
      }
    }
    return {
      ok: false,
      reason: "not-found",
      branch,
      message: `no existing issue among [${candidates.join(", ")}]`,
    };
  } catch (error) {
    // TODO: Better error handling (distinguish between git errors, network errors, etc.)
    return {
      ok: false,
      reason: "error",
      branch: "unknown",
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function parseOwnerRepo(url: string): { owner: string; repo: string } {
  const https = /https?:\/\/[^/]+\/([^/]+)\/([^/.]+)(?:\.git)?/i.exec(url);
  if (https?.[1] && https?.[2]) return { owner: https[1], repo: https[2] };
  const ssh = /git@[^:]+:([^/]+)\/([^/.]+)(?:\.git)?/i.exec(url);
  if (ssh?.[1] && ssh?.[2]) return { owner: ssh[1], repo: ssh[2] };
  // TODO: Support more git remote URL formats
  throw new Error(`Unsupported remote URL: ${url}`);
}

async function issueExists(
  owner: string,
  repo: string,
  num: number,
  allowed: Set<AllowedState>,
  token?: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${num}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "issue-number-branch",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (res.status === 404) return false;

    // TODO: Handle rate limiting (status 403 with specific headers)
    // TODO: Retry logic for network errors
    if (!res.ok) {
      console.error(`GitHub API error: ${res.status}`);
      // For now, treat API errors as "issue not found"
      return false;
    }

    const data = (await res.json()) as { state?: string };
    const state = (data.state ?? "").toLowerCase();
    return allowed.has(state as AllowedState);
  } catch (error) {
    // TODO: Better error handling
    console.error(`Failed to check issue #${num}:`, error);
    return false;
  }
}

async function git(args: string[]): Promise<string> {
  // TODO: Handle cases where git is not installed or not in a git repository
  const { stdout } = await execFile("git", args);
  return stdout;
}
