import type { CheckMessageArgs } from "@issue-linker/core";
import { CheckMessageArgsSchema } from "@issue-linker/core";
import * as v from "valibot";

/**
 * Helper function to create CheckMessageArgs with validation
 */
export function createCheckMessageArgs(
  text: string,
  checkMode: string | undefined,
  issueStatus: string | undefined,
  repo: string,
  actionMode: string,
  githubToken?: string,
  hostname?: string,
  extract?: string,
  exclude?: string,
): CheckMessageArgs {
  const options = {
    text,
    repo,
    actionMode,
    ...(checkMode && { checkMode }),
    ...(issueStatus && { issueStatus }),
    ...(githubToken && { githubToken }),
    ...(hostname && { hostname }),
    ...(extract && { extract }),
    ...(exclude && { exclude }),
  };

  // Validate using schema from core
  try {
    return v.parse(CheckMessageArgsSchema, options);
  } catch (error) {
    if (error instanceof v.ValiError) {
      throw new Error(`Invalid arguments: ${error.message}`);
    }
    throw error;
  }
}
