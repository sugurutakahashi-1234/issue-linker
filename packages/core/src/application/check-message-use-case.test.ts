// Tests for check-message-use-case

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { checkMessage } from "./check-message-use-case.js";

// Mock dependencies
mock.module("../infrastructure/env-accessor.js", () => ({
  getGitHubToken: () => "test-token",
  getGitHubApiUrl: () => "https://api.github.com",
}));

mock.module("../infrastructure/git-client.js", () => ({
  getGitRemoteUrl: () => Promise.resolve("https://github.com/owner/repo.git"),
}));

// Mock GitHub client with dynamic responses
const mockIssues = new Map<number, { state: string }>();

mock.module("../infrastructure/github-client.js", () => ({
  getGitHubIssue: async (
    _owner: string,
    _repo: string,
    issueNumber: number,
  ) => {
    const issue = mockIssues.get(issueNumber);
    if (!issue) {
      return {
        found: false,
        error: {
          type: "not-found" as const,
          message: `Issue #${issueNumber} not found`,
        },
      };
    }
    return {
      found: true,
      issue: {
        number: issueNumber,
        state: issue.state,
        title: `Issue ${issueNumber}`,
      },
    };
  },
}));

describe("checkMessage", () => {
  beforeEach(() => {
    mockIssues.clear();
  });

  describe("default mode", () => {
    test("should extract #123 format", async () => {
      mockIssues.set(123, { state: "open" });

      const result = await checkMessage({
        text: "Fix bug #123",
        mode: "default",
      });

      expect(result.success).toBe(true);
      expect(result.issueNumbers).toEqual([123]);
      expect(result.validIssues).toEqual([123]);
      expect(result.invalidIssues).toEqual([]);
      expect(result.excluded).toBe(false);
    });

    test("should extract multiple issues", async () => {
      mockIssues.set(123, { state: "open" });
      mockIssues.set(456, { state: "closed" });

      const result = await checkMessage({
        text: "Fix #123 and #456",
        mode: "default",
      });

      expect(result.success).toBe(true);
      expect(result.issueNumbers).toEqual([123, 456]);
      expect(result.validIssues).toEqual([123, 456]);
    });

    test("should not extract other formats", async () => {
      const result = await checkMessage({
        text: "Fix 123-bug",
        mode: "default",
      });

      expect(result.success).toBe(false);
      expect(result.issueNumbers).toEqual([]);
      expect(result.message).toContain("No issue number found");
    });

    test("should handle no exclusion pattern", async () => {
      mockIssues.set(123, { state: "open" });

      const result = await checkMessage({
        text: "main #123",
        mode: "default",
      });

      expect(result.success).toBe(true);
      expect(result.excluded).toBe(false);
    });
  });

  describe("branch mode", () => {
    test("should extract number at start", async () => {
      mockIssues.set(123, { state: "open" });

      const result = await checkMessage({
        text: "123-feature",
        mode: "branch",
      });

      expect(result.success).toBe(true);
      expect(result.issueNumbers).toEqual([123]);
    });

    test("should extract number after slash", async () => {
      mockIssues.set(456, { state: "open" });

      const result = await checkMessage({
        text: "feat/456-description",
        mode: "branch",
      });

      expect(result.success).toBe(true);
      expect(result.issueNumbers).toEqual([456]);
    });

    test("should extract # format", async () => {
      mockIssues.set(789, { state: "open" });

      const result = await checkMessage({
        text: "feat/#789",
        mode: "branch",
      });

      expect(result.success).toBe(true);
      expect(result.issueNumbers).toEqual([789]);
    });

    test("should exclude default branches", async () => {
      const result = await checkMessage({
        text: "main",
        mode: "branch",
      });

      expect(result.success).toBe(true);
      expect(result.excluded).toBe(true);
      expect(result.message).toContain("excluded");
    });

    test("should exclude develop branch", async () => {
      const result = await checkMessage({
        text: "develop",
        mode: "branch",
      });

      expect(result.success).toBe(true);
      expect(result.excluded).toBe(true);
    });

    test("should exclude release branches", async () => {
      const result = await checkMessage({
        text: "release/v1.0.0",
        mode: "branch",
      });

      expect(result.success).toBe(true);
      expect(result.excluded).toBe(true);
    });

    test("should override default exclusion with custom pattern", async () => {
      mockIssues.set(123, { state: "open" });

      const result = await checkMessage({
        text: "main",
        mode: "branch",
        exclude: "feature/*",
      });

      // main is not excluded by custom pattern
      expect(result.success).toBe(false);
      expect(result.excluded).toBe(false);
      expect(result.message).toContain("No issue number found");
    });
  });

  describe("commit mode", () => {
    test("should extract #123 format only", async () => {
      mockIssues.set(123, { state: "open" });

      const result = await checkMessage({
        text: "Fix bug #123",
        mode: "commit",
      });

      expect(result.success).toBe(true);
      expect(result.issueNumbers).toEqual([123]);
    });

    test("should exclude Rebase commits", async () => {
      const result = await checkMessage({
        text: "Rebase main onto feature",
        mode: "commit",
      });

      expect(result.success).toBe(true);
      expect(result.excluded).toBe(true);
    });

    test("should exclude Merge commits", async () => {
      const result = await checkMessage({
        text: "Merge pull request #123",
        mode: "commit",
      });

      expect(result.success).toBe(true);
      expect(result.excluded).toBe(true);
    });

    test("should exclude Revert commits", async () => {
      const result = await checkMessage({
        text: "Revert 'Add feature'",
        mode: "commit",
      });

      expect(result.success).toBe(true);
      expect(result.excluded).toBe(true);
    });

    test("should exclude fixup commits", async () => {
      const result = await checkMessage({
        text: "fixup! Add feature",
        mode: "commit",
      });

      expect(result.success).toBe(true);
      expect(result.excluded).toBe(true);
    });

    test("should exclude squash commits", async () => {
      const result = await checkMessage({
        text: "squash! Previous commit",
        mode: "commit",
      });

      expect(result.success).toBe(true);
      expect(result.excluded).toBe(true);
    });
  });

  describe("issue status filtering", () => {
    test("should accept all issues when status is 'all'", async () => {
      mockIssues.set(123, { state: "open" });
      mockIssues.set(456, { state: "closed" });

      const result = await checkMessage({
        text: "#123 #456",
        issueStatus: "all",
      });

      expect(result.success).toBe(true);
      expect(result.validIssues).toEqual([123, 456]);
      expect(result.invalidIssues).toEqual([]);
    });

    test("should filter by open status", async () => {
      mockIssues.set(123, { state: "open" });
      mockIssues.set(456, { state: "closed" });

      const result = await checkMessage({
        text: "#123 #456",
        issueStatus: "open",
      });

      expect(result.success).toBe(false);
      expect(result.validIssues).toEqual([123]);
      expect(result.invalidIssues).toEqual([456]);
    });

    test("should filter by closed status", async () => {
      mockIssues.set(123, { state: "open" });
      mockIssues.set(456, { state: "closed" });

      const result = await checkMessage({
        text: "#123 #456",
        issueStatus: "closed",
      });

      expect(result.success).toBe(false);
      expect(result.validIssues).toEqual([456]);
      expect(result.invalidIssues).toEqual([123]);
    });
  });

  describe("repository handling", () => {
    test("should use custom repository", async () => {
      mockIssues.set(123, { state: "open" });

      const result = await checkMessage({
        text: "#123",
        repo: "custom/repo",
      });

      expect(result.success).toBe(true);
      expect(result.metadata.repo).toBe("custom/repo");
    });

    test("should auto-detect repository from git", async () => {
      mockIssues.set(123, { state: "open" });

      const result = await checkMessage({
        text: "#123",
      });

      expect(result.success).toBe(true);
      expect(result.metadata.repo).toBe("owner/repo");
    });
  });

  describe("error handling", () => {
    test("should handle issue not found", async () => {
      const result = await checkMessage({
        text: "#999",
      });

      expect(result.success).toBe(false);
      expect(result.invalidIssues).toEqual([999]);
      expect(result.notFoundIssues).toEqual([999]);
      expect(result.message).toContain("not found");
    });

    test("should handle mixed valid and invalid issues", async () => {
      mockIssues.set(123, { state: "open" });

      const result = await checkMessage({
        text: "#123 #999",
      });

      expect(result.success).toBe(false);
      expect(result.validIssues).toEqual([123]);
      expect(result.invalidIssues).toEqual([999]);
      expect(result.notFoundIssues).toEqual([999]);
      expect(result.message).toContain("not found");
    });

    test("should handle issue with wrong state", async () => {
      mockIssues.set(456, { state: "closed" });

      const result = await checkMessage({
        text: "#456",
        issueStatus: "open",
      });

      expect(result.success).toBe(false);
      expect(result.invalidIssues).toEqual([456]);
      expect(result.wrongStateIssues).toEqual([456]);
      expect(result.message).toContain("wrong state");
    });

    test("should handle mixed not found and wrong state", async () => {
      mockIssues.set(123, { state: "closed" });

      const result = await checkMessage({
        text: "#123 #999",
        issueStatus: "open",
      });

      expect(result.success).toBe(false);
      expect(result.invalidIssues).toEqual([999, 123]);
      expect(result.notFoundIssues).toEqual([999]);
      expect(result.wrongStateIssues).toEqual([123]);
      expect(result.message).toContain("not found");
      expect(result.message).toContain("Wrong state");
    });

    test("should handle invalid options", async () => {
      const result = await checkMessage({
        text: "",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("No issue number found");
    });
  });
});
