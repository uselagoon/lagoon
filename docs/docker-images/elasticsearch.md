# Elasticsearch

> [_Elasticsearch_](https://www.elastic.co/) _is a distributed, open source search and analytics engine for all types of data, including textual, numerical, geospatial, structured, and unstructured._
>
> * from [https://www.elastic.co/](https://www.elastic.co/)

## Supported versions

* 6 \(available for compatibility only, no longer officially supported\) - `uselagoon/elasticsearch-6`
* 7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/elasticsearch/7.Dockerfile) - `uselagoon/elasticsearch-7`

## Environment Variables

| Environment Variable |      Default      |                                                           Description                                                            |
| :------------------- | :---------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `ES_JAVA_OPTS`       | -Xms400m -Xmx400m | Sets the memory usage of the Elasticsearch container. Both values need be the same value or Elasticsearch will not start cleanly |

## Known issues

On Linux-based systems, the start of the Elasticsearch container may fail due to a low `vm.max_map_count` setting.

```bash
elasticsearch_1  | ERROR: [1] bootstrap checks failed
elasticsearch_1  | [1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

[Solution to this issue can be found here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html#_set_vm_max_map_count_to_at_least_262144).
