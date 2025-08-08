// Domain layer - Validation schemas using Valibot

import * as v from "valibot";

/**
 * Schema for IssueStateFilter validation
 */
const IssueStateFilterSchema = v.union([
  v.literal("all"),
  v.literal("open"),
  v.literal("closed"),
]);

/**
 * Schema for repository format validation
 * Validates "owner/repo" format
 */
const RepositoryFormatSchema = v.pipe(
  v.string(),
  v.regex(/^[^/]+\/[^/]+$/, 'Repository must be in "owner/repo" format'),
);

/**
 * Schema for CheckOptions validation
 * Internal use only - not exported to maintain abstraction
 */
const CheckOptionsSchema = v.object({
  branch: v.optional(v.string()),
  repo: v.optional(RepositoryFormatSchema),
  excludePattern: v.optional(v.string()),
  issueState: v.optional(IssueStateFilterSchema),
  githubToken: v.optional(v.string()),
});

/**
 * Validate CheckOptions using Valibot
 * @param options - Options to validate
 * @returns Validation result
 */
export function validateCheckOptions(
  options: unknown,
): v.SafeParseResult<typeof CheckOptionsSchema> {
  return v.safeParse(CheckOptionsSchema, options);
}

/**
 * Parse repository string into owner and repo
 * @param repository - Repository in "owner/repo" format
 * @returns Parsed owner and repo
 */
export function parseRepository(repository: string): {
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
