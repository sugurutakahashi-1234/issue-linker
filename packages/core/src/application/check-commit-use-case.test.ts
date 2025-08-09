// Tests for check-commit-use-case

import { describe, expect, it, mock } from "bun:test";
import { IssueNotFoundError } from "../domain/errors.js";
import { checkCommit } from "./check-commit-use-case.js";

// Mock infrastructure dependencies
mock.module("../infrastructure/git-client.js", () => ({
  getGitRemoteUrl: () => Promise.resolve("https://github.com/owner/repo.git"),
}));

mock.module("../infrastructure/env-accessor.js", () => ({
  getGitHubToken: () => undefined,
}));

mock.module("../infrastructure/github-client.js", () => ({
  getGitHubIssue: async (owner: string, repo: string, issueNumber: number) => {
    // Mock valid issues: 123, 456
    if (issueNumber === 123 || issueNumber === 456) {
      return {
        number: issueNumber,
        title: `Issue ${issueNumber}`,
        state: "open",
        url: `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
      };
    }
    // Mock closed issue: 789
    if (issueNumber === 789) {
      return {
        number: issueNumber,
        title: `Issue ${issueNumber}`,
        state: "closed",
        url: `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
      };
    }
    throw new IssueNotFoundError(issueNumber);
  },
}));

describe("checkCommit", () => {
  it("should find issue number in commit message with # format", async () => {
    const result = await checkCommit("fix: resolve issue #123");
    expect(result.success).toBe(true);
    expect(result.reason).toBe("issue-found");
    expect(result.issueNumber).toBe(123);
  });

  it("should find multiple issue numbers", async () => {
    const result = await checkCommit("fix: resolve issues #123 and #456");
    expect(result.success).toBe(true);
    expect(result.reason).toBe("issue-found");
    expect(result.metadata?.checkedIssues).toEqual([123, 456]);
  });

  it("should find issue numbers with keywords", async () => {
    const result = await checkCommit("feat: add feature\n\nCloses #123");
    expect(result.success).toBe(true);
    expect(result.issueNumber).toBe(123);
  });

  it("should find issue numbers with GH- prefix", async () => {
    const result = await checkCommit("fix: resolve GH-123");
    expect(result.success).toBe(true);
    expect(result.issueNumber).toBe(123);
  });

  it("should return error for non-existent issue", async () => {
    const result = await checkCommit("fix: resolve issue #999");
    expect(result.success).toBe(false);
    expect(result.reason).toBe("issue-not-found");
  });

  it("should return error when no issue number found", async () => {
    const result = await checkCommit("chore: update dependencies");
    expect(result.success).toBe(false);
    expect(result.reason).toBe("no-issue-number");
  });

  it("should handle mixed valid and invalid issues", async () => {
    const result = await checkCommit("fix: resolve #123 and #999");
    expect(result.success).toBe(false);
    expect(result.reason).toBe("issue-not-found");
    expect(result.message).toContain("#999");
  });

  it("should filter by issue status", async () => {
    const result = await checkCommit("fix: resolve #789", {
      issueStatus: "open",
    });
    expect(result.success).toBe(false);
    expect(result.reason).toBe("issue-not-found");
  });

  it("should accept closed issues when status is 'all'", async () => {
    const result = await checkCommit("fix: resolve #789", {
      issueStatus: "all",
    });
    expect(result.success).toBe(true);
    expect(result.issueNumber).toBe(789);
  });

  it("should use custom repository", async () => {
    const result = await checkCommit("fix: resolve #123", {
      repo: "custom/repo",
    });
    expect(result.success).toBe(true);
    expect(result.metadata?.owner).toBe("custom");
    expect(result.metadata?.repo).toBe("repo");
  });
});
