# TypeScript Graph

```bash
tsg --tsconfig tsconfig.typescript-graph.json --LR --md docs/reports/dependencies/all.md
```

```mermaid
flowchart LR
    subgraph packages///sugurutakahashi//1234["packages/@sugurutakahashi-1234"]
        subgraph packages///sugurutakahashi//1234/issue//number//branch//core["/issue-number-branch-core"]
            subgraph packages///sugurutakahashi//1234/issue//number//branch//core/dist["/dist"]
                packages///sugurutakahashi//1234/issue//number//branch//core/dist/types.d.ts["types.d.ts"]
                packages///sugurutakahashi//1234/issue//number//branch//core/dist/constants.d.ts["constants.d.ts"]
                packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts["index.d.ts"]
                subgraph packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain["/domain"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/errors.d.ts["errors.d.ts"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/extractors.d.ts["extractors.d.ts"]
                end
                subgraph packages///sugurutakahashi//1234/issue//number//branch//core/dist/use//cases["/use-cases"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/dist/use//cases/check//branch.d.ts["check-branch.d.ts"]
                end
            end
            subgraph packages///sugurutakahashi//1234/issue//number//branch//core/src["/src"]
                packages///sugurutakahashi//1234/issue//number//branch//core/src/types.ts["types.ts"]
                packages///sugurutakahashi//1234/issue//number//branch//core/src/constants.ts["constants.ts"]
                packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts["index.ts"]
                subgraph packages///sugurutakahashi//1234/issue//number//branch//core/src/domain["/domain"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/errors.ts["errors.ts"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/extractors.ts["extractors.ts"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/parsers.ts["parsers.ts"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/schemas.ts["schemas.ts"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/validators.ts["validators.ts"]
                end
                subgraph packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure["/infrastructure"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/config.ts["config.ts"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/git//client.ts["git-client.ts"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/github//client.ts["github-client.ts"]
                end
                subgraph packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases["/use-cases"]
                    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts["check-branch.ts"]
                end
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
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/constants.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/types.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/use//cases/check//branch.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/types.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/constants.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/errors.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/domain/extractors.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/types.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/use//cases/check//branch.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//api/dist/index.d.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch/src/cli.ts-->node//modules///commander//js/extra//typings/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch/src/cli.ts-->packages///sugurutakahashi//1234/issue//number//branch//api/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//action/src/index.ts-->node//modules///actions/core/lib/core.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//action/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//api/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//api/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/constants.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/types.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/parsers.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/types.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/schemas.ts-->node//modules/valibot/dist/index.d.cts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/validators.ts-->node//modules///types/micromatch/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/validators.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/types.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/config.ts-->node//modules///t3//oss/env//core/dist/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/config.ts-->node//modules/valibot/dist/index.d.cts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/git//client.ts-->node//modules/simple//git/dist/typings/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/git//client.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/errors.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/github//client.ts-->node//modules///octokit/plugin//retry/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/github//client.ts-->node//modules///octokit/plugin//throttling/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/github//client.ts-->node//modules///octokit/request//error/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/github//client.ts-->node//modules/octokit/dist//types/index.d.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/github//client.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/errors.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/github//client.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/types.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/github//client.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/config.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/constants.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/errors.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/extractors.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/parsers.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/schemas.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/validators.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/config.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/git//client.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/infrastructure/github//client.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/types.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/constants.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/errors.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/domain/extractors.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/types.ts
    packages///sugurutakahashi//1234/issue//number//branch//core/src/index.ts-->packages///sugurutakahashi//1234/issue//number//branch//core/src/use//cases/check//branch.ts
```

