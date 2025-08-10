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

      expect(text).toContain("excluded from validation");
      expect(proc.exitCode).toBe(0);
    });

    it("should work with short form -c option", async () => {
      const proc = spawn(
        ["bun", "run", "./cli.ts", "-t", "main", "-c", "branch"],
        {
          cwd: import.meta.dir,
        },
      );

      const text = await new Response(proc.stdout).text();
      await proc.exited;

      expect(text).toContain("excluded from validation");
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

      expect(text).toContain("excluded from validation");
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

    // API tests using real GitHub API
    // Note: These tests may fail due to rate limits.
    // If they consistently fail, change 'it' to 'it.skip' to skip them.
    // Performance tuning: API timeout=1s, no retries for max speed
    it(
      "should succeed when issue exists in this repository",
      async () => {
        // Using issue #3 which exists in this repository
        const proc = spawn(
          [
            "bun",
            "run",
            "./cli.ts",
            "-t",
            "feat/issue-3-test",
            "--check-mode",
            "branch",
            "--repo",
            "sugurutakahashi-1234/issue-linker",
          ],
          {
            cwd: import.meta.dir,
          },
        );

        const text = await new Response(proc.stdout).text();
        await proc.exited;

        expect(text).toContain("✅ Valid issues: #3");
        expect(proc.exitCode).toBe(0);
      },
      { timeout: 2000 }, // 2s timeout (API timeout 1s + buffer)
    );

    it(
      "should work with short form -c for API calls",
      async () => {
        // Test short form with real GitHub API
        const proc = spawn(
          [
            "bun",
            "run",
            "./cli.ts",
            "-t",
            "feat/issue-3-test",
            "-c",
            "branch",
            "--repo",
            "sugurutakahashi-1234/issue-linker",
          ],
          {
            cwd: import.meta.dir,
          },
        );

        const text = await new Response(proc.stdout).text();
        await proc.exited;

        expect(text).toContain("✅ Valid issues: #3");
        expect(proc.exitCode).toBe(0);
      },
      { timeout: 2000 }, // 2s timeout (API timeout 1s + buffer)
    );

    it(
      "should fail when issue does not exist in this repository",
      async () => {
        // Using a non-existent issue number
        const proc = spawn(
          [
            "bun",
            "run",
            "./cli.ts",
            "-t",
            "feat/issue-99999-test",
            "--check-mode",
            "branch",
            "--repo",
            "sugurutakahashi-1234/issue-linker",
          ],
          {
            cwd: import.meta.dir,
            stderr: "pipe",
          },
        );

        await proc.exited;

        expect(proc.exitCode).toBe(1);
      },
      { timeout: 2000 }, // 2s timeout (API timeout 1s + buffer)
    );
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

      expect(text).toContain("excluded");
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

    it(
      "should succeed when commit message contains valid issue number",
      async () => {
        const proc = spawn(
          [
            "bun",
            "run",
            "./cli.ts",
            "-t",
            "fix: resolve issue #3",
            "--repo",
            "sugurutakahashi-1234/issue-linker",
          ],
          {
            cwd: import.meta.dir,
          },
        );

        const text = await new Response(proc.stdout).text();
        await proc.exited;

        expect(text).toContain("✅ Valid issues:");
        expect(proc.exitCode).toBe(0);
      },
      { timeout: 2000 },
    );

    it(
      "should fail when commit message contains non-existent issue",
      async () => {
        const proc = spawn(
          [
            "bun",
            "run",
            "./cli.ts",
            "-t",
            "fix: resolve issue #99999",
            "--repo",
            "sugurutakahashi-1234/issue-linker",
          ],
          {
            cwd: import.meta.dir,
            stderr: "pipe",
          },
        );

        await proc.exited;

        expect(proc.exitCode).toBe(1);
      },
      { timeout: 2000 },
    );
  });
});
