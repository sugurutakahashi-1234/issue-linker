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
        node//modules///actions/core/lib/core.d.ts["@actions/core"]
        node//modules///types/micromatch/index.d.ts["@types/micromatch"]
    end
    packages///sugurutakahashi//1234/issue//number//branch//api-->packages///sugurutakahashi//1234/issue//number//branch//core
    packages///sugurutakahashi//1234/issue//number//branch/src/cli.ts-->packages///sugurutakahashi//1234/issue//number//branch//api
    packages///sugurutakahashi//1234/issue//number//branch//action-->node//modules///actions/core/lib/core.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//action-->packages///sugurutakahashi//1234/issue//number//branch//api
    packages///sugurutakahashi//1234/issue//number//branch//core-->node//modules///types/micromatch/index.d.ts
```

