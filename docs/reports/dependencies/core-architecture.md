# TypeScript Graph

```bash
tsg --tsconfig ../../../tsconfig.typescript-graph.json --LR --abstraction packages/@sugurutakahashi-1234/issue-number-branch --abstraction packages/@sugurutakahashi-1234/issue-number-branch-action --abstraction packages/@sugurutakahashi-1234/issue-number-branch-api --abstraction src/domain --abstraction src/application --abstraction src/infrastructure --md ../../../docs/reports/dependencies/core-architecture.md
```

```mermaid
flowchart LR
    classDef dir fill:#0000,stroke:#999
    subgraph packages///sugurutakahashi//1234["packages/@sugurutakahashi-1234"]
        packages///sugurutakahashi//1234/issue//number//branch//api["/issue-number-branch-api"]:::dir
        packages///sugurutakahashi//1234/issue//number//branch["/issue-number-branch"]:::dir
        packages///sugurutakahashi//1234/issue//number//branch//action["/issue-number-branch-action"]:::dir
        subgraph packages///sugurutakahashi//1234/issue//number//branch//core["/issue-number-branch-core"]
            subgraph packages///sugurutakahashi//1234/issue//number//branch//core/dist["/dist"]
                packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts["index.d.ts"]
                subgraph packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain["/domain"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/types.d.ts["types.d.ts"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/constants.d.ts["constants.d.ts"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/errors.d.ts["errors.d.ts"]
                end
                subgraph packages///sugurutakahashi//1234/issue//number//branch//core/dist/application["/application"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/dist/application/check//branch//use//case.d.ts["check-branch-use-case.d.ts"]
                end
            end
            subgraph packages///sugurutakahashi//1234/issue//number//branch//core/src["/src"]
                packages///sugurutakahashi//1234/issue//number//branch//core/src/domain["/domain"]:::dir
                packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure["/infrastructure"]:::dir
                packages///sugurutakahashi//1234/issue//number//branch//core/src/application["/application"]:::dir
                packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts["index.ts"]
            end
        end
    end
    subgraph node//modules["node_modules"]
        node//modules///commander//js/extra//typings/index.d.ts["@commander-js/extra-typings"]
        node//modules///actions/core/lib/core.d.ts["@actions/core"]
        node//modules/valibot/dist/index.d.cts["valibot"]
        node//modules///types/micromatch/index.d.ts["@types/micromatch"]
        node//modules///t3//oss/env//core/dist/index.d.ts["@t3-oss/env-core"]
        node//modules/simple//git/dist/typings/index.d.ts["simple-git"]
        node//modules///octokit/plugin//retry/dist//types/index.d.ts["@octokit/plugin-retry"]
        node//modules///octokit/plugin//throttling/dist//types/index.d.ts["@octokit/plugin-throttling"]
        node//modules///octokit/request//error/dist//types/index.d.ts["@octokit/request-error"]
        node//modules/octokit/dist//types/index.d.ts["octokit"]
    end
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/constants.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/types.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/application/check//branch//use//case.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/types.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/constants.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/errors.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/types.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/application/check//branch//use//case.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//api-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch-->node//modules///commander//js/extra//typings/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch-->packages///sugurutakahashi//1234/issue//number//branch//api
    packages///sugurutakahashi//1234/issue//number//branch//action-->node//modules///actions/core/lib/core.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//action-->packages///sugurutakahashi//1234/issue//number//branch//api
    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain-->node//modules/valibot/dist/index.d.cts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure-->node//modules///types/micromatch/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain
    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain-->node//modules///t3//oss/env//core/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure-->node//modules/simple//git/dist/typings/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure-->node//modules///octokit/plugin//retry/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure-->node//modules///octokit/plugin//throttling/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure-->node//modules///octokit/request//error/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure-->node//modules/octokit/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/application-->node//modules/valibot/dist/index.d.cts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/application-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain
    packages///sugurutakahashi//1234/issue//number//branch//core/src/application-->packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure
    packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain
    packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/application
```

