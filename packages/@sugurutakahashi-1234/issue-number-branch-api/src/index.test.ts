import { describe, expect, it } from "bun:test";
import * as api from "./index.js";

describe("API exports", () => {
  it("should export checkBranch function", () => {
    expect(typeof api.checkBranch).toBe("function");
  });

  it("should export DEFAULT_CHECK_OPTIONS", () => {
    expect(api.DEFAULT_CHECK_OPTIONS).toBeDefined();
    expect(api.DEFAULT_CHECK_OPTIONS.excludePattern).toBe(
      "{main,master,develop}",
    );
    expect(api.DEFAULT_CHECK_OPTIONS.issueState).toBe("all");
  });

  it("should export types", () => {
    // Type exports are compile-time only, so we just check that imports work
    const options: api.CheckOptions = {};
    expect(options).toBeDefined();
  });
});
