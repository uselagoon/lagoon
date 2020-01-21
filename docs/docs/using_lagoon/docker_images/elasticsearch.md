# elasticsearch

## Elasticsearch Image

## Supported versions

* 6.8.2 [\[Dockerfile\]](https://github.com/amazeeio/lagoon/blob/master/images/elasticsearch/Dockerfile6)
* 7.1.1 [\[Dockerfile\]](https://github.com/amazeeio/lagoon/blob/master/images/elasticsearch/Dockerfile7.1)
* 7.3.0 [\[Dockerfile\]](https://github.com/amazeeio/lagoon/blob/master/images/elasticsearch/Dockerfile7)

## Known issues

On Linux based systems the start of the elasticsearch container may fail due to a low `vm.max_map_count` setting.

```text
elasticsearch_1  | ERROR: [1] bootstrap checks failed
elasticsearch_1  | [1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

Solution can be found here: [https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html\#\_set\_vm\_max\_map\_count\_to\_at\_least\_262144 ](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html#_set_vm_max_map_count_to_at_least_262144)

