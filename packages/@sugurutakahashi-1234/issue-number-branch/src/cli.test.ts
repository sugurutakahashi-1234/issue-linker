import { describe, expect, it } from "bun:test";
import { spawn } from "bun";

describe("CLI", () => {
  it("should display help", async () => {
    const proc = spawn(["bun", "run", "./src/cli.ts", "--help"], {
      cwd: import.meta.dir,
    });

    const text = await new Response(proc.stdout).text();

    expect(text).toContain("issue-number-branch");
    expect(text).toContain("--branch");
    expect(text).toContain("--repo");
    expect(text).toContain("--exclude-pattern");
  });

  it("should display version", async () => {
    const proc = spawn(["bun", "run", "./src/cli.ts", "--version"], {
      cwd: import.meta.dir,
    });

    const text = await new Response(proc.stdout).text();

    expect(text).toContain("0.0.0");
  });
});
