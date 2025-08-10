# TypeScript Graph

```bash
tsg --tsconfig ../../tsconfig.typescript-graph.json --LR --abstraction packages/cli --abstraction packages/action --abstraction src/domain --abstraction src/application --abstraction src/infrastructure --md ../../docs/reports/dependencies/core-architecture.md
```

```mermaid
flowchart LR
    classDef dir fill:#0000,stroke:#999
    subgraph packages["packages"]
        packages/action["/action"]:::dir
        packages/cli["/cli"]:::dir
        subgraph packages/core["/core"]
            subgraph packages/core/dist["/dist"]
                packages/core/dist/index.d.ts["index.d.ts"]
                subgraph packages/core/dist/domain["/domain"]
                    packages/core/dist/domain/result.d.ts["result.d.ts"]
                    packages/core/dist/domain/types.d.ts["types.d.ts"]
                    packages/core/dist/domain/constants.d.ts["constants.d.ts"]
                    packages/core/dist/domain/errors.d.ts["errors.d.ts"]
                end
                subgraph packages/core/dist/application["/application"]
                    packages/core/dist/application/check//message//use//case.d.ts["check-message-use-case.d.ts"]
                    packages/core/dist/application/get//pull//request//commits//use//case.d.ts["get-pull-request-commits-use-case.d.ts"]
                end
            end
            subgraph packages/core/src["/src"]
                packages/core/src/domain["/domain"]:::dir
                packages/core/src/infrastructure["/infrastructure"]:::dir
                packages/core/src/application["/application"]:::dir
                packages/core/src/index.ts["index.ts"]
            end
        end
    end
    subgraph node//modules["node_modules"]
        node//modules///actions/core/lib/core.d.ts["@actions/core"]
        node//modules///actions/github/lib/github.d.ts["@actions/github"]
        node//modules///commander//js/extra//typings/index.d.ts["@commander-js/extra-typings"]
        node//modules///types/micromatch/index.d.ts["@types/micromatch"]
        node//modules/minimatch/dist/commonjs/index.d.ts["minimatch"]
        node//modules///t3//oss/env//core/dist/index.d.ts["@t3-oss/env-core"]
        node//modules/valibot/dist/index.d.cts["valibot"]
        node//modules/simple//git/dist/typings/index.d.ts["simple-git"]
        node//modules///octokit/plugin//retry/dist//types/index.d.ts["@octokit/plugin-retry"]
        node//modules///octokit/plugin//throttling/dist//types/index.d.ts["@octokit/plugin-throttling"]
        node//modules///octokit/request//error/dist//types/index.d.ts["@octokit/request-error"]
        node//modules/octokit/dist//types/index.d.ts["octokit"]
    end
    packages/core/dist/domain/result.d.ts-->packages/core/dist/domain/types.d.ts
    packages/core/dist/domain/types.d.ts-->packages/core/dist/domain/result.d.ts
    packages/core/dist/domain/constants.d.ts-->packages/core/dist/domain/types.d.ts
    packages/core/dist/application/check//message//use//case.d.ts-->packages/core/dist/domain/result.d.ts
    packages/core/dist/application/check//message//use//case.d.ts-->packages/core/dist/domain/types.d.ts
    packages/core/dist/application/get//pull//request//commits//use//case.d.ts-->packages/core/dist/domain/types.d.ts
    packages/core/dist/index.d.ts-->packages/core/dist/domain/constants.d.ts
    packages/core/dist/index.d.ts-->packages/core/dist/domain/errors.d.ts
    packages/core/dist/index.d.ts-->packages/core/dist/domain/result.d.ts
    packages/core/dist/index.d.ts-->packages/core/dist/domain/types.d.ts
    packages/core/dist/index.d.ts-->packages/core/dist/application/check//message//use//case.d.ts
    packages/core/dist/index.d.ts-->packages/core/dist/application/get//pull//request//commits//use//case.d.ts
    packages/action-->node//modules///actions/core/lib/core.d.ts
    packages/action-->node//modules///actions/github/lib/github.d.ts
    packages/action-->packages/core/dist/index.d.ts
    packages/cli-->node//modules///commander//js/extra//typings/index.d.ts
    packages/cli-->packages/core/dist/index.d.ts
    packages/core/src/infrastructure-->node//modules///types/micromatch/index.d.ts
    packages/core/src/infrastructure-->node//modules/minimatch/dist/commonjs/index.d.ts
    packages/core/src/infrastructure-->packages/core/src/domain
    packages/core/src/domain-->node//modules///t3//oss/env//core/dist/index.d.ts
    packages/core/src/domain-->node//modules/valibot/dist/index.d.cts
    packages/core/src/infrastructure-->node//modules/simple//git/dist/typings/index.d.ts
    packages/core/src/infrastructure-->node//modules///octokit/plugin//retry/dist//types/index.d.ts
    packages/core/src/infrastructure-->node//modules///octokit/plugin//throttling/dist//types/index.d.ts
    packages/core/src/infrastructure-->node//modules///octokit/request//error/dist//types/index.d.ts
    packages/core/src/infrastructure-->node//modules/octokit/dist//types/index.d.ts
    packages/core/src/application-->node//modules/valibot/dist/index.d.cts
    packages/core/src/application-->packages/core/src/domain
    packages/core/src/application-->packages/core/src/infrastructure
    packages/core/src/index.ts-->packages/core/src/domain
    packages/core/src/index.ts-->packages/core/src/application
```

