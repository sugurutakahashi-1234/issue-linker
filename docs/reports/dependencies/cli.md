# TypeScript Graph

```bash
tsg --tsconfig ../../../tsconfig.typescript-graph.json --LR --abstraction packages/@sugurutakahashi-1234/issue-number-branch-action --abstraction packages/@sugurutakahashi-1234/issue-number-branch-api --abstraction packages/@sugurutakahashi-1234/issue-number-branch-core --md ../../../docs/reports/dependencies/cli.md
```

```mermaid
flowchart LR
    classDef dir fill:#0000,stroke:#999
    subgraph packages///sugurutakahashi//1234["packages/@sugurutakahashi-1234"]
        packages///sugurutakahashi//1234/issue//number//branch//core["/issue-number-branch-core"]:::dir
        packages///sugurutakahashi//1234/issue//number//branch//api["/issue-number-branch-api"]:::dir
        packages///sugurutakahashi//1234/issue//number//branch//action["/issue-number-branch-action"]:::dir
        subgraph packages///sugurutakahashi//1234/issue//number//branch/src["/issue-number-branch/src"]
            packages///sugurutakahashi//1234/issue//number//branch/src/cli.ts["cli.ts"]
        end
    end
    subgraph node//modules["node_modules"]
        node//modules///commander//js/extra//typings/index.d.ts["@commander-js/extra-typings"]
        node//modules///actions/core/lib/core.d.ts["@actions/core"]
        node//modules/valibot/dist/index.d.cts["valibot"]
        node//modules///types/micromatch/index.d.ts["@types/micromatch"]
        node//modules///t3//oss/env//core/dist/index.d.ts["@t3-oss/env-core"]
        node//modules///octokit/plugin//retry/dist//types/index.d.ts["@octokit/plugin-retry"]
        node//modules///octokit/plugin//throttling/dist//types/index.d.ts["@octokit/plugin-throttling"]
        node//modules///octokit/request//error/dist//types/index.d.ts["@octokit/request-error"]
        node//modules/octokit/dist//types/index.d.ts["octokit"]
    end
    packages///sugurutakahashi//1234/issue//number//branch//api-->packages///sugurutakahashi//1234/issue//number//branch//core
    packages///sugurutakahashi//1234/issue//number//branch/src/cli.ts-->node//modules///commander//js/extra//typings/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch/src/cli.ts-->packages///sugurutakahashi//1234/issue//number//branch//api
    packages///sugurutakahashi//1234/issue//number//branch//action-->node//modules///actions/core/lib/core.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//action-->packages///sugurutakahashi//1234/issue//number//branch//api
    packages///sugurutakahashi//1234/issue//number//branch//core-->node//modules/valibot/dist/index.d.cts
    packages///sugurutakahashi//1234/issue//number//branch//core-->node//modules///types/micromatch/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core-->node//modules///t3//oss/env//core/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core-->node//modules///octokit/plugin//retry/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core-->node//modules///octokit/plugin//throttling/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core-->node//modules///octokit/request//error/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core-->node//modules/octokit/dist//types/index.d.ts
```

