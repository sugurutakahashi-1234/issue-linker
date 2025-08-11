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

  test("returns GITHUB_TOKEN when set", () => {
    mockEnv.GITHUB_TOKEN = "env-github-token";

    const token = getGitHubToken();

    expect(token).toBe("env-github-token");
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  test("returns GH_TOKEN when GITHUB_TOKEN is not set", () => {
    mockEnv.GH_TOKEN = "env-gh-token";

    const token = getGitHubToken();

    expect(token).toBe("env-gh-token");
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  test("prefers GITHUB_TOKEN over GH_TOKEN", () => {
    mockEnv.GITHUB_TOKEN = "env-github-token";
    mockEnv.GH_TOKEN = "env-gh-token";

    const token = getGitHubToken();

    expect(token).toBe("env-github-token");
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  test("returns token from Git Credential Manager when env vars not set", () => {
    mockExecSync.mockImplementation((command: string) => {
      if (command === "git credential fill") {
        return "protocol=https\nhost=github.com\nusername=user\npassword=gho_gitcred_token\n";
      }
      throw new Error(`Command not found: ${command}`);
    });

    const token = getGitHubToken();

    expect(token).toBe("gho_gitcred_token");
    expect(mockExecSync).toHaveBeenCalledWith("git credential fill", {
      input: "url=https://github.com\n",
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
  });

  test("returns token from GitHub CLI when Git Credential Manager fails", () => {
    mockExecSync.mockImplementation((command: string) => {
      if (command === "gh auth token") {
        return "gho_ghcli_token\n";
      }
      throw new Error(`Command not found: ${command}`);
    });

    const token = getGitHubToken();

    expect(token).toBe("gho_ghcli_token");
    expect(mockExecSync).toHaveBeenCalledWith("git credential fill", {
      input: "url=https://github.com\n",
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    expect(mockExecSync).toHaveBeenCalledWith("gh auth token", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
  });

  test("returns undefined when all methods fail", () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("Command not found");
    });

    const token = getGitHubToken();

    expect(token).toBeUndefined();
    expect(mockExecSync).toHaveBeenCalledTimes(2); // git credential fill and gh auth token
  });

  test("handles Git Credential Manager returning no password field", () => {
    mockExecSync.mockImplementation((command: string) => {
      if (command === "git credential fill") {
        return "protocol=https\nhost=github.com\nusername=user\n";
      }
      if (command === "gh auth token") {
        return "ghp_backup_token\n";
      }
      throw new Error(`Command not found: ${command}`);
    });

    const token = getGitHubToken();

    expect(token).toBe("ghp_backup_token");
  });

  test("ignores invalid GitHub CLI tokens", () => {
    mockExecSync.mockImplementation((command: string) => {
      if (command === "gh auth token") {
        return "invalid-token-format\n";
      }
      throw new Error(`Command not found: ${command}`);
    });

    const token = getGitHubToken();

    expect(token).toBeUndefined();
  });

  test("handles empty GitHub CLI response", () => {
    mockExecSync.mockImplementation((command: string) => {
      if (command === "gh auth token") {
        return "";
      }
      throw new Error(`Command not found: ${command}`);
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

  test("returns GitHub.com API when GH_HOST is github.com", () => {
    mockEnv.GH_HOST = "github.com";

    const url = getGitHubApiUrl();

    expect(url).toBe("https://api.github.com");
  });

  test("returns Enterprise API URL when GH_HOST is set to enterprise host", () => {
    mockEnv.GH_HOST = "github.enterprise.com";

    const url = getGitHubApiUrl();

    expect(url).toBe("https://github.enterprise.com/api/v3");
  });

  test("strips protocol from GH_HOST if provided", () => {
    mockEnv.GH_HOST = "https://github.enterprise.com";

    const url = getGitHubApiUrl();

    expect(url).toBe("https://github.enterprise.com/api/v3");
  });

  test("returns GITHUB_SERVER_URL with /api/v3 suffix when set", () => {
    mockEnv.GITHUB_SERVER_URL = "https://github.enterprise.com/";

    const url = getGitHubApiUrl();

    expect(url).toBe("https://github.enterprise.com/api/v3");
  });

  test("prefers GH_HOST over GITHUB_SERVER_URL", () => {
    mockEnv.GH_HOST = "ghe.company.com";
    mockEnv.GITHUB_SERVER_URL = "https://github.enterprise.com";

    const url = getGitHubApiUrl();

    expect(url).toBe("https://ghe.company.com/api/v3");
  });

  test("returns default GitHub API URL when no env vars set", () => {
    const url = getGitHubApiUrl();

    expect(url).toBe("https://api.github.com");
  });

  test("removes trailing slashes from GH_HOST", () => {
    mockEnv.GH_HOST = "github.enterprise.com///";

    const url = getGitHubApiUrl();

    expect(url).toBe("https://github.enterprise.com/api/v3");
  });

  test("removes trailing slashes from GITHUB_SERVER_URL", () => {
    mockEnv.GITHUB_SERVER_URL = "https://github.enterprise.com///";

    const url = getGitHubApiUrl();

    expect(url).toBe("https://github.enterprise.com/api/v3");
  });
});
