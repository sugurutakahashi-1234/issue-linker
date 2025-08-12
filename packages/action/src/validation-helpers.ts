import type { CheckMessageOptions } from "@issue-linker/core";
import { CheckMessageOptionsSchema } from "@issue-linker/core";
import * as v from "valibot";

/**
 * Helper function to create CheckMessageOptions with validation
 */
export function createCheckMessageOptions(
  text: string,
  checkMode: string,
  issueStatus: string,
  repo: string,
  actionMode: string,
  githubToken?: string,
  hostname?: string,
  extract?: string,
  exclude?: string,
): CheckMessageOptions {
  const options = {
    text,
    checkMode,
    issueStatus,
    repo,
    actionMode,
    ...(githubToken && { githubToken }),
    ...(hostname && { hostname }),
    ...(extract && { extract }),
    ...(exclude && { exclude }),
  };

  // Validate using schema from core
  try {
    return v.parse(CheckMessageOptionsSchema, options);
  } catch (error) {
    if (error instanceof v.ValiError) {
      throw new Error(`Invalid options: ${error.message}`);
    }
    throw error;
  }
}
