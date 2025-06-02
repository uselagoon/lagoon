# OpenSearch

> [_OpenSearch_](https://opensearch.org/) _is a community-driven, Apache 2.0-licensed open source search and analytics suite that makes it easy to ingest, search, visualize, and analyze data._
>
> * from [https://opensearch.org/](https://opensearch.org/)

## Supported versions

* 2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/opensearch/2.Dockerfile) - `uselagoon/opensearch-2`
* 3 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/opensearch/3.Dockerfile) - `uselagoon/opensearch-3`

## Environment Variables

Some options are configurable via [environment
variables](../concepts-advanced/environment-variables.md).

| Environment Variable | Default           | Description                                                                                                                 |
| :------------------- | :---------------- | :-------------------------------------------------------------------------------------------------------------------------  |
| OPENSEARCH_JAVA_OPTS | -Xms512m -Xmx512m | Sets the memory usage of the OpenSearch container. Both values need be the same value or OpenSearch will not start cleanly. |

## Known issues

On Linux-based systems, the start of the OpenSearch container may fail due to a low `vm.max_map_count` setting.

```bash title="Error"
opensearch_1  | ERROR: [1] bootstrap checks failed
opensearch_1  | [1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

[Solution to this issue can be found here](https://opensearch.org/docs/latest/opensearch/install/important-settings/).
