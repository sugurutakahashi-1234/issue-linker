import { describe, expect, it } from "bun:test";
import { findIssueNumbers } from "./issue-finder.js";

describe("findIssueNumbers", () => {
  describe("default mode", () => {
    it("should find issue numbers with # prefix", () => {
      expect(findIssueNumbers("Fix #123", "default")).toEqual([123]);
      expect(findIssueNumbers("Closes #456 and #789", "default")).toEqual([
        456, 789,
      ]);
    });

    it("should not find numbers without # prefix", () => {
      expect(findIssueNumbers("Issue 123", "default")).toEqual([]);
    });

    it("should handle edge cases", () => {
      expect(findIssueNumbers("", "default")).toEqual([]);
      expect(findIssueNumbers("#0", "default")).toEqual([]); // 0 is invalid
    });
  });

  describe("branch mode", () => {
    it("should find issue numbers from branch names", () => {
      // Priority patterns
      expect(findIssueNumbers("123-feature", "branch")).toEqual([123]);
      expect(findIssueNumbers("feature/123-add-login", "branch")).toEqual([
        123,
      ]);
      expect(findIssueNumbers("#123", "branch")).toEqual([123]);
      expect(findIssueNumbers("feature-123-desc", "branch")).toEqual([123]);
    });

    it("should find multiple issue numbers in branch names", () => {
      expect(findIssueNumbers("123-456-feature", "branch")).toEqual([123, 456]);
      expect(findIssueNumbers("feat/123-124-test", "branch")).toEqual([
        123, 124,
      ]);
    });

    it("should return empty array for branches without valid issue numbers", () => {
      expect(findIssueNumbers("main", "branch")).toEqual([]);
      expect(findIssueNumbers("develop", "branch")).toEqual([]);
    });
  });

  describe("custom extraction patterns", () => {
    it("should use custom pattern when provided", () => {
      // GH-123 format
      expect(findIssueNumbers("Fix GH-456", "default", "GH-(\\d+)")).toEqual([
        456,
      ]);

      // JIRA-style format
      expect(findIssueNumbers("PROJ-456", "default", "[A-Z]+-(\\d+)")).toEqual([
        456,
      ]);
    });

    it("should handle invalid regex patterns", () => {
      expect(() => findIssueNumbers("test", "default", "[invalid(")).toThrow(
        "Invalid extraction pattern",
      );
    });
  });

  describe("unique issue numbers", () => {
    it("should return unique issue numbers", () => {
      expect(findIssueNumbers("Fix #123 and #123 again", "default")).toEqual([
        123,
      ]);
    });
  });
});
