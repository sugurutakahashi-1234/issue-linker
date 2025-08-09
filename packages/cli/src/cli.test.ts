import { describe, expect, it } from "bun:test";
import { spawn } from "bun";

describe("CLI", () => {
  it("should display help", async () => {
    const proc = spawn(["bun", "run", "./cli.ts", "--help"], {
      cwd: import.meta.dir,
    });

    const text = await new Response(proc.stdout).text();

    expect(text).toContain("issue-linker");
    expect(text).toContain("branch");
    expect(text).toContain("commit");
  });

  it("should display version", async () => {
    const proc = spawn(["bun", "run", "./cli.ts", "--version"], {
      cwd: import.meta.dir,
    });

    const text = await new Response(proc.stdout).text();

    expect(text).toContain("0.0.0");
  });

  describe("branch subcommand", () => {
    it("should display branch help", async () => {
      const proc = spawn(["bun", "run", "./cli.ts", "branch", "--help"], {
        cwd: import.meta.dir,
      });

      const text = await new Response(proc.stdout).text();

      expect(text).toContain("branch");
      expect(text).toContain("--branch");
      expect(text).toContain("--repo");
      expect(text).toContain("--exclude-pattern");
      expect(text).toContain("--issue-status");
      expect(text).toContain("--github-token");
    });

    it("should fail when branch has no issue number", async () => {
      const proc = spawn(
        ["bun", "run", "./cli.ts", "branch", "--branch", "feat/no-issue-here"],
        {
          cwd: import.meta.dir,
          stderr: "pipe",
        },
      );

      await proc.exited;

      expect(proc.exitCode).toBe(1);
    });

    it("should succeed when branch matches excluded pattern", async () => {
      const proc = spawn(
        [
          "bun",
          "run",
          "./cli.ts",
          "branch",
          "--branch",
          "main",
          "--exclude-pattern",
          "{main,master,develop}",
        ],
        {
          cwd: import.meta.dir,
        },
      );

      const text = await new Response(proc.stdout).text();
      await proc.exited;

      expect(text).toContain("Branch 'main' is excluded from validation");
      expect(proc.exitCode).toBe(0);
    });

    it("should handle custom exclude patterns", async () => {
      const proc = spawn(
        [
          "bun",
          "run",
          "./cli.ts",
          "branch",
          "--branch",
          "release/v1.0.0",
          "--exclude-pattern",
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
          "branch",
          "--branch",
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

      expect(errorText).toContain("Invalid");
      expect(proc.exitCode).toBe(2); // Error exit code
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
            "branch",
            "--branch",
            "feat/issue-3-test",
            "--repo",
            "sugurutakahashi-1234/issue-linker",
          ],
          {
            cwd: import.meta.dir,
          },
        );

        const text = await new Response(proc.stdout).text();
        await proc.exited;

        expect(text).toContain("Issue #3 found");
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
            "branch",
            "--branch",
            "feat/issue-99999-test",
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

  describe("commit subcommand", () => {
    it("should display commit help", async () => {
      const proc = spawn(["bun", "run", "./cli.ts", "commit", "--help"], {
        cwd: import.meta.dir,
      });

      const text = await new Response(proc.stdout).text();

      expect(text).toContain("commit");
      expect(text).toContain("--latest");
      expect(text).toContain("--repo");
      expect(text).toContain("--issue-status");
      expect(text).toContain("--github-token");
    });

    it("should fail when commit message has no issue number", async () => {
      const proc = spawn(
        ["bun", "run", "./cli.ts", "commit", "chore: update dependencies"],
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
            "commit",
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

        expect(text).toContain("Valid issue(s) found");
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
            "commit",
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
