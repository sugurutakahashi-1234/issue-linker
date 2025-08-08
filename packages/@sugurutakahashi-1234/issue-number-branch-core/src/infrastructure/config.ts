// Infrastructure layer - Configuration management

import { createEnv } from "@t3-oss/env-core";
import * as v from "valibot";

// Define environment variables using @t3-oss/env-core with Valibot
const env = createEnv({
  server: {
    GITHUB_TOKEN: v.optional(v.string()),
    GH_TOKEN: v.optional(v.string()),
    GITHUB_API_URL: v.optional(v.pipe(v.string(), v.url())),
    GITHUB_SERVER_URL: v.optional(v.pipe(v.string(), v.url())),
  },
  runtimeEnv: process.env,
});

/**
 * Configuration singleton for the application
 */
export class Config {
  private static instance: Config | null = null;

  private constructor() {}

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  getGitHubToken(): string | undefined {
    // Check GITHUB_TOKEN first, then fall back to GH_TOKEN
    return env.GITHUB_TOKEN ?? env.GH_TOKEN;
  }

  getGitHubApiUrl(): string {
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

  // For testing purposes
  static resetInstance(): void {
    Config.instance = null;
  }
}
