// Infrastructure layer - Environment variable accessor

import { env } from "../domain/env.js";

/**
 * Get GitHub token from environment variables
 * @returns GitHub token or undefined
 */
export function getGitHubToken(): string | undefined {
  // Check GITHUB_TOKEN first, then fall back to GH_TOKEN
  return env.GITHUB_TOKEN ?? env.GH_TOKEN;
}

/**
 * Get GitHub API URL from environment variables
 * @returns GitHub API URL
 */
export function getGitHubApiUrl(): string {
  // Priority order:
  // 1. GITHUB_API_URL (direct API URL)
  // 2. GITHUB_SERVER_URL (GitHub Enterprise Server URL - needs /api/v3 suffix)
  // 3. Default to GitHub.com API
  if (env.GITHUB_API_URL) {
    // Remove trailing slashes
    return env.GITHUB_API_URL.replace(/\/+$/, "");
  }

  if (env.GITHUB_SERVER_URL) {
    // GitHub Enterprise Server API endpoint format
    const serverUrl = env.GITHUB_SERVER_URL.replace(/\/+$/, "");
    return `${serverUrl}/api/v3`;
  }

  // Default to GitHub.com
  return "https://api.github.com";
}
