// Infrastructure layer - Git operations

import { execFile as _execFile } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(_execFile);

/**
 * GitClient provides access to local Git repository information
 */
export class GitClient {
  /**
   * Execute a git command
   * @param args - Arguments to pass to git
   * @returns Command output
   */
  private async execute(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFile("git", args);
      return stdout;
    } catch (error: unknown) {
      // Improve error messages for common git failures
      const gitError = error as {
        code?: string;
        stderr?: string;
        message?: string;
      };

      if (gitError.code === "ENOENT") {
        throw new Error("Git is not installed or not in PATH");
      }
      if (gitError.stderr?.includes("not a git repository")) {
        throw new Error("Not in a git repository");
      }
      // Re-throw with original error for debugging
      throw new Error(
        `Git command failed: ${gitError.message ?? String(error)}`,
      );
    }
  }

  /**
   * Get the current branch name
   * @returns Current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const branch = await this.execute(["rev-parse", "--abbrev-ref", "HEAD"]);
    return branch.trim();
  }

  /**
   * Get the remote URL for origin
   * @returns Remote URL
   */
  async getRemoteUrl(): Promise<string> {
    try {
      const url = await this.execute(["config", "--get", "remote.origin.url"]);
      return url.trim();
    } catch (error: unknown) {
      // Provide helpful error message when no remote is configured
      const gitError = error as { message?: string };
      if (gitError.message?.includes("exit code 1")) {
        throw new Error("No remote 'origin' configured for this repository");
      }
      throw error;
    }
  }
}
