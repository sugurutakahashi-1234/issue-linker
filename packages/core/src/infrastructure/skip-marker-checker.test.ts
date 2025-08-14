// Tests for skip marker checker

import { describe, expect, it } from "bun:test";
import { findSkipMarker } from "./skip-marker-checker.js";

describe("findSkipMarker", () => {
  it("should detect skip markers and handle edge cases", () => {
    // Valid markers
    expect(findSkipMarker("[skip issue-linker] Some text")).toBe(
      "[skip issue-linker]",
    );
    expect(findSkipMarker("[issue-linker skip] Some text")).toBe(
      "[issue-linker skip]",
    );
    expect(findSkipMarker("[skip-issue-linker] Some text")).toBe(
      "[skip-issue-linker]",
    );
    expect(findSkipMarker("[issue-linker-skip] Some text")).toBe(
      "[issue-linker-skip]",
    );

    // Case insensitive
    expect(findSkipMarker("[SKIP ISSUE-LINKER]")).toBe("[SKIP ISSUE-LINKER]");
    expect(findSkipMarker("[Skip Issue-Linker]")).toBe("[Skip Issue-Linker]");

    // Invalid markers
    expect(findSkipMarker("skip issue-linker")).toBe(null); // Missing brackets
    expect(findSkipMarker("[skip issuelinker]")).toBe(null); // Missing hyphen
    expect(findSkipMarker("Regular text without any marker")).toBe(null);
    expect(findSkipMarker("")).toBe(null);

    // With issue numbers
    expect(findSkipMarker("[skip issue-linker] Fix #123 and #456")).toBe(
      "[skip issue-linker]",
    );
  });
});
