import { describe, expect, it } from "bun:test";
import { findIssueNumbers } from "./issue-finder.js";

describe("findIssueNumbers", () => {
  describe("default mode", () => {
    it("should find issue numbers with # prefix", () => {
      expect(findIssueNumbers("Fix #123", "default")).toEqual([123]);
      expect(findIssueNumbers("Closes #456 and #789", "default")).toEqual([
        456, 789,
      ]);
      expect(findIssueNumbers("#1 #2 #3", "default")).toEqual([1, 2, 3]);
    });

    it("should not find numbers without # prefix", () => {
      expect(findIssueNumbers("Issue 123", "default")).toEqual([]);
      expect(findIssueNumbers("PR-456", "default")).toEqual([]);
      expect(findIssueNumbers("version 2.0", "default")).toEqual([]);
    });

    it("should handle edge cases", () => {
      expect(findIssueNumbers("", "default")).toEqual([]);
      expect(findIssueNumbers("#0", "default")).toEqual([]); // 0 is invalid
      expect(findIssueNumbers("#99999999", "default")).toEqual([]); // Too large
      expect(findIssueNumbers("#123#456", "default")).toEqual([123, 456]);
    });
  });

  describe("commit mode", () => {
    it("should find issue numbers with # prefix (same as default)", () => {
      expect(findIssueNumbers("Fix #123", "commit")).toEqual([123]);
      expect(findIssueNumbers("Closes #456 and #789", "commit")).toEqual([
        456, 789,
      ]);
    });

    it("should handle multiple issues in commit message", () => {
      expect(
        findIssueNumbers("feat: add feature (#123, #456)", "commit"),
      ).toEqual([123, 456]);
      expect(findIssueNumbers("fix: resolve #1, #2, and #3", "commit")).toEqual(
        [1, 2, 3],
      );
    });
  });

  describe("branch mode", () => {
    it("should find issue number from branch names with standard patterns", () => {
      // Priority 1: Number at the beginning
      expect(findIssueNumbers("123-feature", "branch")).toEqual([123]);
      expect(findIssueNumbers("456_feature", "branch")).toEqual([456]);

      // Priority 2: Number after slash
      expect(findIssueNumbers("feature/123-add-login", "branch")).toEqual([
        123,
      ]);
      expect(findIssueNumbers("fix/456_bug", "branch")).toEqual([456]);

      // Priority 3: Number with hash
      expect(findIssueNumbers("#123", "branch")).toEqual([123]);
      expect(findIssueNumbers("feat/#456-description", "branch")).toEqual([
        456,
      ]);

      // Priority 4: Number after hyphen/underscore
      expect(findIssueNumbers("feature-123-desc", "branch")).toEqual([123]);
      expect(findIssueNumbers("issue_789_fix", "branch")).toEqual([789]);
    });

    it("should find only the first matching issue number", () => {
      // Should extract 123, not 456
      expect(findIssueNumbers("123-feature-456", "branch")).toEqual([123]);
      expect(findIssueNumbers("feat/123-test-2", "branch")).toEqual([123]);
      expect(findIssueNumbers("fix/456-update-v2", "branch")).toEqual([456]);
    });

    it("should return empty array for branches without valid issue numbers", () => {
      expect(findIssueNumbers("main", "branch")).toEqual([]);
      expect(findIssueNumbers("develop", "branch")).toEqual([]);
      expect(findIssueNumbers("feature/login", "branch")).toEqual([]);
      expect(findIssueNumbers("release-v2.0.0", "branch")).toEqual([]);
      expect(findIssueNumbers("hotfix/update-deps", "branch")).toEqual([]);
    });

    it("should handle edge cases", () => {
      expect(findIssueNumbers("", "branch")).toEqual([]);
      expect(findIssueNumbers("0-feature", "branch")).toEqual([]); // 0 is invalid
      expect(findIssueNumbers("99999999-test", "branch")).toEqual([]); // Too large
      expect(findIssueNumbers("version2", "branch")).toEqual([]); // No separator
      expect(findIssueNumbers("test-2.0", "branch")).toEqual([]); // Decimal number
    });

    it("should prioritize earlier patterns", () => {
      // Start pattern wins over others
      expect(findIssueNumbers("123-feature-456", "branch")).toEqual([123]);
      // Slash pattern wins when no start pattern
      expect(findIssueNumbers("feat/123-issue-456", "branch")).toEqual([123]);
      // Hash pattern wins when no start/slash pattern
      expect(findIssueNumbers("feature/#123-and-456", "branch")).toEqual([123]);
    });
  });

  describe("unique issue numbers", () => {
    it("should return unique issue numbers", () => {
      expect(findIssueNumbers("Fix #123 and #123 again", "default")).toEqual([
        123,
      ]);
      expect(findIssueNumbers("#1 #2 #1 #3 #2", "default")).toEqual([1, 2, 3]);
    });
  });
});
