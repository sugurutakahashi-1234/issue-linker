// Infrastructure layer - Repository string parsing

/**
 * Parse repository string into owner and repo
 * @param repository - Repository in "owner/repo" format
 * @returns Parsed owner and repo
 */
export function parseRepositoryString(repository: string): {
  owner: string;
  repo: string;
} {
  const parts = repository.split("/");
  // This should already be validated by the schema, but double-check
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid repository format "${repository}". Expected "owner/repo" format.`,
    );
  }
  return {
    owner: parts[0],
    repo: parts[1],
  };
}
