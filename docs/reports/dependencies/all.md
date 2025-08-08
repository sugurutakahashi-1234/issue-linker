# TypeScript Graph

```bash
tsg --tsconfig tsconfig.typescript-graph.json --LR --md docs/reports/dependencies/all.md
```

```mermaid
flowchart LR
    subgraph packages///sugurutakahashi//1234["packages/@sugurutakahashi-1234"]
        subgraph packages///sugurutakahashi//1234/issue//number//branch//core["/issue-number-branch-core"]
            subgraph packages///sugurutakahashi//1234/issue//number//branch//core/dist["/dist"]
                packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts["index.d.ts"]
            end
            subgraph packages///sugurutakahashi//1234/issue//number//branch//core/src["/src"]
                packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts["index.ts"]
            end
        end
        subgraph packages///sugurutakahashi//1234/issue//number//branch//api["/issue-number-branch-api"]
            subgraph packages///sugurutakahashi//1234/issue//number//branch//api/dist["/dist"]
                packages///sugurutakahashi//1234/issue//number//branch//api/dist/index.d.ts["index.d.ts"]
            end
            subgraph packages///sugurutakahashi//1234/issue//number//branch//api/src["/src"]
                packages///sugurutakahashi//1234/issue//number//branch//api/src/index.ts["index.ts"]
            end
        end
        subgraph packages///sugurutakahashi//1234/issue//number//branch/src["/issue-number-branch/src"]
            packages///sugurutakahashi//1234/issue//number//branch/src/cli.ts["cli.ts"]
        end
        subgraph packages///sugurutakahashi//1234/issue//number//branch//action/src["/issue-number-branch-action/src"]
            packages///sugurutakahashi//1234/issue//number//branch//action/src/index.ts["index.ts"]
        end
    end
    subgraph node//modules["node_modules"]
        node//modules///actions/core/lib/core.d.ts["@actions/core"]
        node//modules///types/micromatch/index.d.ts["@types/micromatch"]
    end
    packages///sugurutakahashi//1234/issue//number//branch//api/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch/src/cli.ts-->packages///sugurutakahashi//1234/issue//number//branch//api/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//action/src/index.ts-->node//modules///actions/core/lib/core.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//action/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//api/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//api/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts-->node//modules///types/micromatch/index.d.ts
```

