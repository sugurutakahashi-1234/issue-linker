// GitHub Actions specific helper functions

import type { Context } from "@actions/github/lib/context.js";

/**
 * Extract branch name from GitHub Actions context
 * @param context - GitHub Actions context
 * @returns Branch name if found, undefined otherwise
 */
export function extractBranchNameFromContext(
  context: Context,
): string | undefined {
  const { eventName, payload, ref } = context;

  // For create event (branch creation)
  // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
  if (eventName === "create" && payload["ref_type"] === "branch") {
    // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
    return payload["ref"];
  }

  // For pull request events
  if (payload.pull_request) {
    // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
    return payload.pull_request["head"]?.ref;
  }

  // For push events
  if (eventName === "push" && ref) {
    return ref.replace("refs/heads/", "");
  }

  return undefined;
}

/**
 * Check if the event is a branch creation event
 * @param context - GitHub Actions context
 * @returns true if this is a branch creation event
 */
export function isCreateBranchEvent(context: Context): boolean {
  return (
    context.eventName === "create" &&
    // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
    context.payload["ref_type"] === "branch"
  );
}
