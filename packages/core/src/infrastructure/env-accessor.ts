// Infrastructure layer - Environment variable accessor

import { execSync } from "node:child_process";
import { env } from "../domain/env.js";

/**
 * Get GitHub token from Git Credential Manager
 * @returns GitHub token or undefined
 */
function getTokenFromGitCredentialManager(): string | undefined {
  try {
    const result = execSync("git credential fill", {
      input: "url=https://github.com\n",
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"], // Ignore stderr
    });

    // Parse the output to extract the password (token)
    const lines = result.split("\n");
    for (const line of lines) {
      if (line.startsWith("password=")) {
        return line.substring(9); // Length of "password="
      }
    }
  } catch {
    // Git command not available or no credentials stored
    return undefined;
  }
  return undefined;
}

/**
 * Get GitHub token from GitHub CLI
 * @returns GitHub token or undefined
 */
function getTokenFromGitHubCLI(): string | undefined {
  try {
    const token = execSync("gh auth token", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"], // Ignore stderr
    }).trim();

    // Verify it looks like a valid token
    if (token && (token.startsWith("gho_") || token.startsWith("ghp_"))) {
      return token;
    }
  } catch {
    // GitHub CLI not available or not authenticated
    return undefined;
  }
  return undefined;
}

/**
 * Get GitHub token from multiple sources
 * Priority order:
 * 1. Environment variables (GITHUB_TOKEN, GH_TOKEN)
 * 2. Git Credential Manager
 * 3. GitHub CLI
 * @returns GitHub token or undefined
 */
export function getGitHubToken(): string | undefined {
  // 1. Check environment variables first (existing behavior)
  const envToken = env.GITHUB_TOKEN ?? env.GH_TOKEN;
  if (envToken) {
    return envToken;
  }

  // 2. Try Git Credential Manager
  const gitCredToken = getTokenFromGitCredentialManager();
  if (gitCredToken) {
    return gitCredToken;
  }

  // 3. Try GitHub CLI as fallback
  const ghCliToken = getTokenFromGitHubCLI();
  if (ghCliToken) {
    return ghCliToken;
  }

  return undefined;
}

/**
 * Get GitHub API URL from environment variables
 * @returns GitHub API URL
 */
export function getGitHubApiUrl(): string {
  // Priority order:
  // 1. GH_HOST (GitHub hostname - compatible with GitHub CLI)
  // 2. GITHUB_SERVER_URL (GitHub Actions environment - needs /api/v3 suffix)
  // 3. Default to GitHub.com API

  // Check GH_HOST first (GitHub CLI compatible)
  if (env.GH_HOST) {
    const hostname = env.GH_HOST.replace(/^https?:\/\//, "").replace(
      /\/+$/,
      "",
    );
    // GitHub.com uses a different API domain
    if (hostname === "github.com") {
      return "https://api.github.com";
    }
    // GitHub Enterprise Server uses /api/v3 path
    return `https://${hostname}/api/v3`;
  }

  // Check GITHUB_SERVER_URL (GitHub Actions environment)
  if (env.GITHUB_SERVER_URL) {
    // GitHub Enterprise Server API endpoint format
    const serverUrl = env.GITHUB_SERVER_URL.replace(/\/+$/, "");
    return `${serverUrl}/api/v3`;
  }

  // Default to GitHub.com
  return "https://api.github.com";
}
