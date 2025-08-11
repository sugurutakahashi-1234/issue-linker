// Infrastructure layer - Git URL parsing

import type { GitHubRepository } from "../domain/validation-schemas.js";

/**
 * Parses owner and repository from a Git remote URL
 * @param url - The Git remote URL to parse
 * @returns Object containing owner and repo
 * @throws Error if URL format is not supported
 */
export function parseRepositoryFromGitUrl(url: string): GitHubRepository {
  // Handle HTTPS URLs (GitHub, GitHub Enterprise)
  // Examples:
  // - https://github.com/owner/repo.git
  // - https://github.com/owner/repo
  // - https://github.enterprise.com/owner/repo.git
  const httpsMatch = /https?:\/\/[^/]+\/([^/]+)\/([^/.]+)(?:\.git)?$/i.exec(
    url,
  );
  if (httpsMatch?.[1] && httpsMatch?.[2]) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // Handle SSH URLs
  // Examples:
  // - git@github.com:owner/repo.git
  // - git@github.com:owner/repo
  // - git@github.enterprise.com:owner/repo.git
  const sshMatch = /git@[^:]+:([^/]+)\/([^/.]+)(?:\.git)?$/i.exec(url);
  if (sshMatch?.[1] && sshMatch?.[2]) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // Handle SSH protocol URLs
  // Example: ssh://git@github.com/owner/repo.git
  const sshProtocolMatch =
    /ssh:\/\/git@[^/]+\/([^/]+)\/([^/.]+)(?:\.git)?$/i.exec(url);
  if (sshProtocolMatch?.[1] && sshProtocolMatch?.[2]) {
    return { owner: sshProtocolMatch[1], repo: sshProtocolMatch[2] };
  }

  // If no pattern matches, throw an informative error
  throw new Error(
    `Unable to parse owner and repository from remote URL: ${url}\n` +
      "Supported formats:\n" +
      "  - https://github.com/owner/repo[.git]\n" +
      "  - git@github.com:owner/repo[.git]\n" +
      "  - ssh://git@github.com/owner/repo[.git]",
  );
}
