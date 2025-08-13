// Tests for skip marker checker

import { describe, expect, it } from "bun:test";
import { hasSkipMarker } from "./skip-marker-checker.js";

describe("hasSkipMarker", () => {
  describe("standard markers", () => {
    it("should detect [skip issue-linker]", () => {
      expect(hasSkipMarker("[skip issue-linker] Some text")).toBe(true);
      expect(hasSkipMarker("Text with [skip issue-linker] in middle")).toBe(
        true,
      );
      expect(hasSkipMarker("Text at end [skip issue-linker]")).toBe(true);
    });

    it("should detect [issue-linker skip]", () => {
      expect(hasSkipMarker("[issue-linker skip] Some text")).toBe(true);
      expect(hasSkipMarker("Text with [issue-linker skip] in middle")).toBe(
        true,
      );
      expect(hasSkipMarker("Text at end [issue-linker skip]")).toBe(true);
    });
  });

  describe("case insensitivity", () => {
    it("should be case-insensitive", () => {
      const testCases = [
        "[SKIP ISSUE-LINKER]",
        "[Skip Issue-Linker]",
        "[skip ISSUE-linker]",
        "[ISSUE-LINKER SKIP]",
        "[Issue-Linker Skip]",
        "[issue-linker SKIP]",
      ];

      for (const text of testCases) {
        expect(hasSkipMarker(text)).toBe(true);
      }
    });
  });

  describe("invalid markers", () => {
    it("should not detect invalid markers", () => {
      const testCases = [
        "skip issue-linker", // Missing brackets
        "[skip-issue-linker]", // Hyphen instead of space
        "[skip issuelinker]", // Missing hyphen
        "[skip issue linker]", // Missing hyphen between issue and linker
        "[skipissue-linker]", // No space after skip
        "Regular text without any marker",
        "",
      ];

      for (const text of testCases) {
        expect(hasSkipMarker(text)).toBe(false);
      }
    });
  });

  describe("multiple markers", () => {
    it("should detect when multiple markers are present", () => {
      expect(
        hasSkipMarker("[skip issue-linker] text [issue-linker skip]"),
      ).toBe(true);
    });
  });

  describe("with issue numbers", () => {
    it("should detect marker even with issue numbers present", () => {
      expect(hasSkipMarker("[skip issue-linker] Fix #123 and #456")).toBe(true);
      expect(hasSkipMarker("Fix #123 and #456 [issue-linker skip]")).toBe(true);
    });
  });
});
