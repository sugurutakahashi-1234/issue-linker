// Tests for env-accessor

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { getGitHubApiUrl, getGitHubToken } from "./env-accessor.js";

// Mock node:child_process
const mockExecSync = mock((command: string, _options?: any): string => {
  throw new Error(`Command not found: ${command}`);
});

mock.module("node:child_process", () => ({
  execSync: mockExecSync,
}));

// Mock environment module
const mockEnv = {
  GITHUB_TOKEN: undefined as string | undefined,
  GH_TOKEN: undefined as string | undefined,
  GH_HOST: undefined as string | undefined,
  GITHUB_SERVER_URL: undefined as string | undefined,
};

mock.module("../domain/env.js", () => ({
  env: mockEnv,
}));

describe("getGitHubToken", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockEnv.GITHUB_TOKEN = undefined;
    mockEnv.GH_TOKEN = undefined;
    mockExecSync.mockReset();
  });

  test("returns token from environment variables with correct priority", () => {
    // Test GITHUB_TOKEN priority
    mockEnv.GITHUB_TOKEN = "env-github-token";
    mockEnv.GH_TOKEN = "env-gh-token";

    const token = getGitHubToken();

    expect(token).toBe("env-github-token");
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  test("falls back through token sources when not available", () => {
    mockExecSync.mockImplementation((command: string) => {
      if (command === "gh auth token") {
        return "gho_ghcli_token\n";
      }
      throw new Error(`Command not found: ${command}`);
    });

    const token = getGitHubToken();

    expect(token).toBe("gho_ghcli_token");
  });

  test("returns undefined when all methods fail", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("Command not found");
    });

    const token = getGitHubToken();

    expect(token).toBeUndefined();
  });
});

describe("getGitHubApiUrl", () => {
  beforeEach(() => {
    // Reset all environment variables
    mockEnv.GH_HOST = undefined;
    mockEnv.GITHUB_SERVER_URL = undefined;
  });

  test("returns correct API URL for different configurations", () => {
    // Default GitHub.com
    expect(getGitHubApiUrl()).toBe("https://api.github.com");

    // GitHub Enterprise via GH_HOST
    mockEnv.GH_HOST = "github.enterprise.com";
    expect(getGitHubApiUrl()).toBe("https://github.enterprise.com/api/v3");

    // GitHub.com via GH_HOST
    mockEnv.GH_HOST = "github.com";
    expect(getGitHubApiUrl()).toBe("https://api.github.com");
  });
});
