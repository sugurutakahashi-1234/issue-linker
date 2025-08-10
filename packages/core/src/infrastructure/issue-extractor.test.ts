import { describe, expect, it } from "bun:test";
import { extractIssueNumbers } from "./issue-extractor.js";

describe("extractIssueNumbers", () => {
  describe("default mode", () => {
    it("should extract issue numbers with # prefix", () => {
      expect(extractIssueNumbers("Fix #123", "default")).toEqual([123]);
      expect(extractIssueNumbers("Closes #456 and #789", "default")).toEqual([
        456, 789,
      ]);
      expect(extractIssueNumbers("#1 #2 #3", "default")).toEqual([1, 2, 3]);
    });

    it("should not extract numbers without # prefix", () => {
      expect(extractIssueNumbers("Issue 123", "default")).toEqual([]);
      expect(extractIssueNumbers("PR-456", "default")).toEqual([]);
      expect(extractIssueNumbers("version 2.0", "default")).toEqual([]);
    });

    it("should handle edge cases", () => {
      expect(extractIssueNumbers("", "default")).toEqual([]);
      expect(extractIssueNumbers("#0", "default")).toEqual([]); // 0 is invalid
      expect(extractIssueNumbers("#99999999", "default")).toEqual([]); // Too large
      expect(extractIssueNumbers("#123#456", "default")).toEqual([123, 456]);
    });
  });

  describe("commit mode", () => {
    it("should extract issue numbers with # prefix (same as default)", () => {
      expect(extractIssueNumbers("Fix #123", "commit")).toEqual([123]);
      expect(extractIssueNumbers("Closes #456 and #789", "commit")).toEqual([
        456, 789,
      ]);
    });

    it("should handle multiple issues in commit message", () => {
      expect(
        extractIssueNumbers("feat: add feature (#123, #456)", "commit"),
      ).toEqual([123, 456]);
      expect(
        extractIssueNumbers("fix: resolve #1, #2, and #3", "commit"),
      ).toEqual([1, 2, 3]);
    });
  });

  describe("branch mode", () => {
    it("should extract issue number from branch names with standard patterns", () => {
      // Priority 1: Number at the beginning
      expect(extractIssueNumbers("123-feature", "branch")).toEqual([123]);
      expect(extractIssueNumbers("456_feature", "branch")).toEqual([456]);

      // Priority 2: Number after slash
      expect(extractIssueNumbers("feature/123-add-login", "branch")).toEqual([
        123,
      ]);
      expect(extractIssueNumbers("fix/456_bug", "branch")).toEqual([456]);

      // Priority 3: Number with hash
      expect(extractIssueNumbers("#123", "branch")).toEqual([123]);
      expect(extractIssueNumbers("feat/#456-description", "branch")).toEqual([
        456,
      ]);

      // Priority 4: Number after hyphen/underscore
      expect(extractIssueNumbers("feature-123-desc", "branch")).toEqual([123]);
      expect(extractIssueNumbers("issue_789_fix", "branch")).toEqual([789]);
    });

    it("should extract only the first matching issue number", () => {
      // Should extract 123, not 456
      expect(extractIssueNumbers("123-feature-456", "branch")).toEqual([123]);
      expect(extractIssueNumbers("feat/123-test-2", "branch")).toEqual([123]);
      expect(extractIssueNumbers("fix/456-update-v2", "branch")).toEqual([456]);
    });

    it("should return empty array for branches without valid issue numbers", () => {
      expect(extractIssueNumbers("main", "branch")).toEqual([]);
      expect(extractIssueNumbers("develop", "branch")).toEqual([]);
      expect(extractIssueNumbers("feature/login", "branch")).toEqual([]);
      expect(extractIssueNumbers("release-v2.0.0", "branch")).toEqual([]);
      expect(extractIssueNumbers("hotfix/update-deps", "branch")).toEqual([]);
    });

    it("should handle edge cases", () => {
      expect(extractIssueNumbers("", "branch")).toEqual([]);
      expect(extractIssueNumbers("0-feature", "branch")).toEqual([]); // 0 is invalid
      expect(extractIssueNumbers("99999999-test", "branch")).toEqual([]); // Too large
      expect(extractIssueNumbers("version2", "branch")).toEqual([]); // No separator
      expect(extractIssueNumbers("test-2.0", "branch")).toEqual([]); // Decimal number
    });

    it("should prioritize earlier patterns", () => {
      // Start pattern wins over others
      expect(extractIssueNumbers("123-feature-456", "branch")).toEqual([123]);
      // Slash pattern wins when no start pattern
      expect(extractIssueNumbers("feat/123-issue-456", "branch")).toEqual([
        123,
      ]);
      // Hash pattern wins when no start/slash pattern
      expect(extractIssueNumbers("feature/#123-and-456", "branch")).toEqual([
        123,
      ]);
    });
  });

  describe("unique issue numbers", () => {
    it("should return unique issue numbers", () => {
      expect(extractIssueNumbers("Fix #123 and #123 again", "default")).toEqual(
        [123],
      );
      expect(extractIssueNumbers("#1 #2 #1 #3 #2", "default")).toEqual([
        1, 2, 3,
      ]);
    });
  });
});
