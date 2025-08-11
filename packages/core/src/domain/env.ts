// Domain layer - Environment configuration schema

import { createEnv } from "@t3-oss/env-core";
import * as v from "valibot";

/**
 * Environment variables schema definition
 * Defines what environment variables are accepted and their validation rules
 */
export const env = createEnv({
  server: {
    GITHUB_TOKEN: v.optional(v.string()),
    GH_TOKEN: v.optional(v.string()),
    GH_HOST: v.optional(v.string()),
    GITHUB_SERVER_URL: v.optional(v.pipe(v.string(), v.url())),
  },
  runtimeEnv: process.env,
});
