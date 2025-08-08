import * as core from "@actions/core";
import { checkCurrentBranch } from "@sugurutakahashi-1234/issue-number-branch-api";

async function run() {
  try {
    // TODO: Add input validation
    // TODO: Better error messages for GitHub Actions context

    const excludeGlob = core.getInput("exclude_glob") || "main|master|develop";
    const allowedStates = (core.getInput("allowed_states") || "open,closed")
      .split(",")
      .map((s) => s.trim()) as ("open" | "closed")[];

    const res = await checkCurrentBranch({ excludeGlob, allowedStates });

    if (res.ok) {
      core.info(`OK: ${res.message}`);
      core.setOutput("status", "ok");
      if (res.matched) {
        core.setOutput("issue_number", res.matched.toString());
      }
    } else {
      // TODO: Consider different failure modes (warning vs error)
      core.setFailed(
        `${res.reason === "error" ? "ERR" : "NG"}: ${res.message}`,
      );
    }
  } catch (error) {
    // TODO: Better error reporting with stack traces in debug mode
    core.setFailed(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

run();
