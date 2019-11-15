#Elasticsearch Images

# Known issues

On Linux based systems the start of the elasticsearch Docker containers may fail due to a too low `vm.max_map_count`value.
```
elasticsearch_1  | ERROR: [1] bootstrap checks failed
elasticsearch_1  | [1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

Solution can be found here: https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html#_set_vm_max_map_count_to_at_least_262144
