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

    it("should find multiple issue numbers in branch names", () => {
      // Should extract all issue numbers
      expect(findIssueNumbers("123-456-feature", "branch")).toEqual([123, 456]);
      expect(findIssueNumbers("feat/123-124-test", "branch")).toEqual([
        123, 124,
      ]);
      expect(findIssueNumbers("issue-123-456-789-fix", "branch")).toEqual([
        123, 456, 789,
      ]);
      expect(findIssueNumbers("feature/100-200-300", "branch")).toEqual([
        100, 200, 300,
      ]);
    });

    it("should handle single issue numbers correctly", () => {
      expect(findIssueNumbers("123-feature", "branch")).toEqual([123]);
      expect(findIssueNumbers("feat/456-test", "branch")).toEqual([456]);
      expect(findIssueNumbers("fix/789", "branch")).toEqual([789]);
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
      expect(findIssueNumbers("version2", "branch")).toEqual([2]); // Now extracts the "2"
      expect(findIssueNumbers("test-2.0", "branch")).toEqual([]); // Decimal number not extracted
    });

    it("should extract all numbers regardless of position", () => {
      // Extract all numbers from different positions
      expect(findIssueNumbers("123-feature-456", "branch")).toEqual([123, 456]);
      expect(findIssueNumbers("feat/123-issue-456", "branch")).toEqual([
        123, 456,
      ]);
      expect(findIssueNumbers("feature/#123-and-456", "branch")).toEqual([
        123, 456,
      ]);
      expect(findIssueNumbers("100-200-300-feature", "branch")).toEqual([
        100, 200, 300,
      ]);
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

  describe("custom extraction patterns", () => {
    it("should use custom pattern when provided", () => {
      // GH-123 format
      expect(findIssueNumbers("Fix GH-456", "default", "GH-(\\d+)")).toEqual([
        456,
      ]);
      expect(
        findIssueNumbers("GH-123 and GH-789", "default", "GH-(\\d+)"),
      ).toEqual([123, 789]);

      // JIRA-style format
      expect(findIssueNumbers("PROJ-456", "default", "[A-Z]+-(\\d+)")).toEqual([
        456,
      ]);
      expect(
        findIssueNumbers("ABC-123 and DEF-789", "default", "[A-Z]+-(\\d+)"),
      ).toEqual([123, 789]);

      // Custom patterns override mode defaults
      expect(findIssueNumbers("Fix #123", "default", "GH-(\\d+)")).toEqual([]); // #123 not matched by GH-(\d+)
    });

    it("should handle invalid regex patterns", () => {
      expect(() => findIssueNumbers("test", "default", "[invalid(")).toThrow(
        "Invalid extraction pattern",
      );
    });

    it("should extract from first capture group", () => {
      // Pattern with multiple groups - only first group is used
      expect(
        findIssueNumbers("issue-123-fix", "default", "issue-(\\d+)-(\\w+)"),
      ).toEqual([123]);
    });

    it("should return unique numbers with custom pattern", () => {
      expect(
        findIssueNumbers("GH-123 GH-456 GH-123", "default", "GH-(\\d+)"),
      ).toEqual([123, 456]);
    });
  });
});
