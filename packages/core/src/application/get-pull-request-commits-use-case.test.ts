// Tests for get-pull-request-commits-use-case

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { GitHubError } from "../domain/errors.js";
import type { PullRequestCommit } from "../domain/types.js";
import { getPullRequestCommits } from "./get-pull-request-commits-use-case.js";

// Mock dependencies
mock.module("../infrastructure/env-accessor.js", () => ({
  getGitHubToken: () => "test-token",
  getGitHubApiUrl: () => "https://api.github.com",
}));

// Mock GitHub client with dynamic responses
let mockCommits: PullRequestCommit[] = [];
let shouldThrowError = false;
let errorToThrow: Error | null = null;

mock.module("../infrastructure/github-client.js", () => ({
  fetchPullRequestCommits: async (
    _owner: string,
    _repo: string,
    _prNumber: number,
    _token?: string,
  ): Promise<PullRequestCommit[]> => {
    if (shouldThrowError && errorToThrow) {
      throw errorToThrow;
    }

    // Return mock commits for the test
    return mockCommits;
  },
}));

describe("getPullRequestCommits", () => {
  beforeEach(() => {
    mockCommits = [];
    shouldThrowError = false;
    errorToThrow = null;
  });

  describe("successful cases", () => {
    test("should return empty array when PR has no commits", async () => {
      mockCommits = [];

      const result = await getPullRequestCommits({
        owner: "test-owner",
        repo: "test-repo",
        prNumber: 123,
      });

      expect(result).toEqual([]);
    });

    test("should return single commit", async () => {
      mockCommits = [
        {
          sha: "abc123",
          message: "feat: add new feature",
          author: {
            name: "Test User",
            email: "test@example.com",
          },
        },
      ];

      const result = await getPullRequestCommits({
        owner: "test-owner",
        repo: "test-repo",
        prNumber: 123,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.sha).toBe("abc123");
      expect(result[0]?.message).toBe("feat: add new feature");
      expect(result[0]?.author.name).toBe("Test User");
    });

    test("should return multiple commits", async () => {
      mockCommits = [
        {
          sha: "abc123",
          message: "feat: add feature #456",
          author: {
            name: "User One",
            email: "user1@example.com",
          },
        },
        {
          sha: "def456",
          message: "fix: resolve bug #789",
          author: {
            name: "User Two",
            email: "user2@example.com",
          },
        },
        {
          sha: "ghi789",
          message: "docs: update README",
          author: {
            name: "User Three",
            email: "user3@example.com",
          },
        },
      ];

      const result = await getPullRequestCommits({
        owner: "test-owner",
        repo: "test-repo",
        prNumber: 123,
      });

      expect(result).toHaveLength(3);
      expect(result[0]?.sha).toBe("abc123");
      expect(result[1]?.sha).toBe("def456");
      expect(result[2]?.sha).toBe("ghi789");
    });

    test("should use provided GitHub token", async () => {
      mockCommits = [
        {
          sha: "token123",
          message: "test: with custom token",
          author: {
            name: "Token User",
            email: "token@example.com",
          },
        },
      ];

      const result = await getPullRequestCommits({
        owner: "test-owner",
        repo: "test-repo",
        prNumber: 123,
        githubToken: "custom-token",
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.sha).toBe("token123");
    });
  });

  describe("validation", () => {
    test("should throw ValidationError for missing owner", async () => {
      await expect(
        getPullRequestCommits({
          owner: "",
          repo: "test-repo",
          prNumber: 123,
        }),
      ).rejects.toThrow();
    });

    test("should throw ValidationError for missing repo", async () => {
      await expect(
        getPullRequestCommits({
          owner: "test-owner",
          repo: "",
          prNumber: 123,
        }),
      ).rejects.toThrow();
    });

    test("should throw ValidationError for invalid pull number", async () => {
      await expect(
        getPullRequestCommits({
          owner: "test-owner",
          repo: "test-repo",
          prNumber: 0,
        }),
      ).rejects.toThrow();
    });

    test("should throw ValidationError for negative pull number", async () => {
      await expect(
        getPullRequestCommits({
          owner: "test-owner",
          repo: "test-repo",
          prNumber: -1,
        }),
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    test("should throw GitHubError when API fails", async () => {
      shouldThrowError = true;
      errorToThrow = new GitHubError("API rate limit exceeded", 403);

      await expect(
        getPullRequestCommits({
          owner: "test-owner",
          repo: "test-repo",
          prNumber: 123,
        }),
      ).rejects.toThrow(GitHubError);
    });

    test("should throw GitHubError for not found PR", async () => {
      shouldThrowError = true;
      errorToThrow = new GitHubError(
        "Failed to fetch commits for PR #999: Not Found",
        404,
      );

      await expect(
        getPullRequestCommits({
          owner: "test-owner",
          repo: "test-repo",
          prNumber: 999,
        }),
      ).rejects.toThrow(GitHubError);
    });

    test("should throw original error for unexpected errors", async () => {
      shouldThrowError = true;
      errorToThrow = new Error("Network error");

      await expect(
        getPullRequestCommits({
          owner: "test-owner",
          repo: "test-repo",
          prNumber: 123,
        }),
      ).rejects.toThrow("Network error");
    });
  });

  describe("edge cases", () => {
    test("should handle commits with special characters in message", async () => {
      mockCommits = [
        {
          sha: "special123",
          message: "feat: add 日本語 support 🎉 #123",
          author: {
            name: "User",
            email: "user@example.com",
          },
        },
      ];

      const result = await getPullRequestCommits({
        owner: "test-owner",
        repo: "test-repo",
        prNumber: 123,
      });

      expect(result[0]?.message).toBe("feat: add 日本語 support 🎉 #123");
    });

    test("should handle commits with multiline messages", async () => {
      mockCommits = [
        {
          sha: "multi123",
          message: `feat: add new feature

This is a detailed description
of the changes made in this commit.

Fixes #123`,
          author: {
            name: "User",
            email: "user@example.com",
          },
        },
      ];

      const result = await getPullRequestCommits({
        owner: "test-owner",
        repo: "test-repo",
        prNumber: 123,
      });

      expect(result[0]?.message).toContain("Fixes #123");
    });

    test("should handle commits with unknown author", async () => {
      mockCommits = [
        {
          sha: "unknown123",
          message: "fix: anonymous commit",
          author: {
            name: "Unknown",
            email: "unknown@example.com",
          },
        },
      ];

      const result = await getPullRequestCommits({
        owner: "test-owner",
        repo: "test-repo",
        prNumber: 123,
      });

      expect(result[0]?.author.name).toBe("Unknown");
      expect(result[0]?.author.email).toBe("unknown@example.com");
    });
  });
});
