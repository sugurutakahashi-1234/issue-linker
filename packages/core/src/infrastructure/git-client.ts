// Infrastructure layer - Git operations

import { type SimpleGit, simpleGit } from "simple-git";
import { GitError } from "../domain/errors.js";

// Create a simple-git instance
const git: SimpleGit = simpleGit();

/**
 * Get the remote URL for origin
 * @returns Remote URL
 * @throws Error if no origin remote is found
 */
export async function getGitRemoteUrl(): Promise<string> {
  try {
    // Get remotes with their URLs
    const remotes = await git.getRemotes(true);

    // Find the origin remote
    const origin = remotes.find((remote) => remote.name === "origin");

    if (!origin?.refs?.fetch) {
      throw new GitError("No origin remote found");
    }

    return origin.refs.fetch;
  } catch (error) {
    // Improve error messages
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("not a git repository")) {
      throw new GitError("Not in a git repository");
    }

    if (message.includes("No origin remote")) {
      throw error; // Re-throw our custom error
    }

    throw new GitError(`Failed to get remote URL: ${message}`);
  }
}
