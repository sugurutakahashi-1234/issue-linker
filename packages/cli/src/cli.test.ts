import { describe, expect, it } from "bun:test";
import { spawn } from "bun";

describe("CLI", () => {
  it("should display help without errors", async () => {
    const proc = spawn(["bun", "run", "./cli.ts", "--help"], {
      cwd: import.meta.dir,
    });

    await proc.exited;

    expect(proc.exitCode).toBe(0);
  });

  it("should display version without errors", async () => {
    const proc = spawn(["bun", "run", "./cli.ts", "--version"], {
      cwd: import.meta.dir,
    });

    const text = await new Response(proc.stdout).text();
    await proc.exited;

    expect(proc.exitCode).toBe(0);
    expect(text).toMatch(/\d+\.\d+\.\d+/);
  });

  describe("text validation", () => {
    it("should fail when text has no issue number", async () => {
      const proc = spawn(
        ["bun", "run", "./cli.ts", "-t", "feat/no-issue-here"],
        {
          cwd: import.meta.dir,
          stderr: "pipe",
        },
      );

      await proc.exited;

      expect(proc.exitCode).toBe(1);
    });

    it("should succeed when branch text matches excluded pattern", async () => {
      const proc = spawn(
        ["bun", "run", "./cli.ts", "-t", "main", "--check-mode", "branch"],
        {
          cwd: import.meta.dir,
        },
      );

      const text = await new Response(proc.stdout).text();
      await proc.exited;

      expect(text).toContain("Skipped: Matched exclude pattern");
      expect(proc.exitCode).toBe(0);
    });

    it("should handle custom exclude patterns", async () => {
      const proc = spawn(
        [
          "bun",
          "run",
          "./cli.ts",
          "-t",
          "release/v1.0.0",
          "--check-mode",
          "branch",
          "--exclude",
          "release/*",
        ],
        {
          cwd: import.meta.dir,
        },
      );

      const text = await new Response(proc.stdout).text();
      await proc.exited;

      expect(text).toContain("Skipped: Matched exclude pattern");
      expect(proc.exitCode).toBe(0);
    });

    it("should fail with invalid issue status", async () => {
      const proc = spawn(
        [
          "bun",
          "run",
          "./cli.ts",
          "-t",
          "feat/123-test",
          "--repo",
          "owner/repo",
          "--issue-status",
          "invalid-status",
        ],
        {
          cwd: import.meta.dir,
          stderr: "pipe",
        },
      );

      const errorText = await new Response(proc.stderr).text();
      await proc.exited;

      expect(errorText).toContain("Invalid options");
      expect(proc.exitCode).toBe(1);
    });

    it("should show detailed output with --verbose option", async () => {
      const proc = spawn(
        [
          "bun",
          "run",
          "./cli.ts",
          "-t",
          "Fix #999999",
          "--repo",
          "test-org/test-repo",
          "--verbose",
        ],
        {
          cwd: import.meta.dir,
          stderr: "pipe",
        },
      );

      const errorText = await new Response(proc.stderr).text();
      await proc.exited;

      expect(errorText).toContain("Details:");
      expect(errorText).toContain("Repository: test-org/test-repo");
      expect(proc.exitCode).toBe(1);
    });
  });

  describe("commit mode", () => {
    it("should exclude merge commits", async () => {
      const proc = spawn(
        [
          "bun",
          "run",
          "./cli.ts",
          "-t",
          "Merge branch main",
          "--check-mode",
          "commit",
        ],
        {
          cwd: import.meta.dir,
        },
      );

      const text = await new Response(proc.stdout).text();
      await proc.exited;

      expect(text).toContain("Skipped: Matched exclude pattern");
      expect(proc.exitCode).toBe(0);
    });

    it("should fail when commit message has no issue number", async () => {
      const proc = spawn(
        [
          "bun",
          "run",
          "./cli.ts",
          "-t",
          "chore: update dependencies",
          "--check-mode",
          "commit",
        ],
        {
          cwd: import.meta.dir,
          stderr: "pipe",
        },
      );

      await proc.exited;

      expect(proc.exitCode).toBe(1);
    });
  });
});
