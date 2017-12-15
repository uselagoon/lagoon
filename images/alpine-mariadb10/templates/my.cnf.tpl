[mysqld_safe]

[mysqldump]
quick
quote-names
max_allowed_packet                      = {{ getenv "MYSQL_DUMP_MAX_ALLOWED_PACKET" "1G" }}

[mysqlhotcopy]
interactive-timeout

[client]
port                                    = {{ getenv "MYSQL_PORT" "3306" }}
socket                                  = /var/run/mysqld/mysqld.sock
default-character-set                   = {{ getenv "MYSQL_CLIENT_DEFAULT_CHARACTER_SET" "utf8" }}

[mysqld]
user                                    = mysql
bind-address                            = 0.0.0.0
basedir                                 = /usr
datadir                                 = /var/lib/mysql
socket                                  = /var/run/mysqld/mysqld.sock
log-warnings

collation-server                        = {{ getenv "MYSQL_COLLATION_SERVER" "utf8_unicode_ci" }}
init_connect                            = '{{ getenv "MYSQL_INIT_CONNECT" "SET NAMES utf8" }}'
character_set_server                    = {{ getenv "MYSQL_CHARACTER_SET_SERVER" "utf8" }}
character_set_filesystem                = {{ getenv "MYSQL_CHARACTER_SET_FILESYSTEM" "utf8" }}

symbolic-links                          = 0
default_storage_engine                  = {{ getenv "MYSQL_DEFAULT_STORAGE_ENGINE" "InnoDB" }}

skip-character-set-client-handshake
skip-name-resolve

back_log                                = {{ getenv "MYSQL_BACK_LOG" "100" }}

join_buffer_size                        = {{ getenv "MYSQL_JOIN_BUFFER_SIZE" "8M" }}
max_heap_table_size                     = {{ getenv "MYSQL_MAX_HEAP_TABLE_SIZE" "16M" }}
query_cache_limit                       = {{ getenv "MYSQL_QUERY_CACHE_LIMIT" "1M" }}
query_cache_min_res_unit                = {{ getenv "MYSQL_QUERY_CACHE_MIN_RES_UNIT" "4K" }}
query_cache_size                        = {{ getenv "MYSQL_QUERY_CACHE_SIZE" "128M" }}
query_cache_type                        = {{ getenv "MYSQL_QUERY_CACHE_TYPE" "ON" }}
sort_buffer_size                        = {{ getenv "MYSQL_SORT_BUFFER_SIZE" "2M" }}
table_definition_cache                  = {{ getenv "MYSQL_TABLE_DEFINITION_CACHE" "400" }}
table_open_cache                        = {{ getenv "MYSQL_TABLE_OPEN_CACHE" "4096" }}
thread_cache_size                       = {{ getenv "MYSQL_THREAD_CACHE_SIZE" "75" }}
tmp_table_size                          = {{ getenv "MYSQL_TMP_TABLE_SIZE" "16M" }}

max_allowed_packet                      = {{ getenv "MYSQL_MAX_ALLOWED_PACKET" "256M" }}
max_connect_errors                      = {{ getenv "MYSQL_MAX_CONNECT_ERRORS" "100000" }}
max_connections                         = {{ getenv "MYSQL_MAX_CONNECTIONS" "100" }}

innodb_buffer_pool_instances            = {{ getenv "MYSQL_INNODB_BUFFER_POOL_INSTANCES" "4" }}
innodb_buffer_pool_size                 = {{ getenv "MYSQL_INNODB_BUFFER_POOL_SIZE" "1G" }}
innodb_data_file_path                   = {{ getenv "MYSQL_INNODB_DATA_FILE_PATH" "ibdata1:10M:autoextend:max:10G" }}
innodb_file_per_table                   = {{ getenv "MYSQL_INNODB_FILE_PER_TABLE" "1" }}
innodb_flush_method                     = {{ getenv "MYSQL_INNODB_FLUSH_METHOD" "O_DIRECT" }}
innodb_flush_log_at_trx_commit          = {{ getenv "MYSQL_INNODB_FLUSH_LOG_AT_TRX_COMMIT" "2" }}
innodb_io_capacity                      = {{ getenv "MYSQL_INNODB_IO_CAPACITY" "200" }}
innodb_lock_wait_timeout                = {{ getenv "MYSQL_INNODB_LOCK_WAIT_TIMEOUT" "50" }}
innodb_log_buffer_size                  = {{ getenv "MYSQL_INNODB_LOG_BUFFER_SIZE" "8M" }}
innodb_log_file_size                    = {{ getenv "MYSQL_INNODB_LOG_FILE_SIZE" "128M" }}
innodb_log_files_in_group               = {{ getenv "MYSQL_INNODB_LOG_FILES_IN_GROUP" "2" }}
innodb_old_blocks_time                  = {{ getenv "MYSQL_INNODB_OLD_BLOCKS_TIME" "1000" }}
innodb_open_files                       = {{ getenv "MYSQL_INNODB_OPEN_FILES" "1024" }}
innodb_read_io_threads                  = {{ getenv "MYSQL_INNODB_READ_IO_THREADS" "4" }}
innodb_stats_on_metadata                = {{ getenv "MYSQL_INNODB_STATS_ON_METADATA" "OFF" }}
innodb_strict_mode                      = {{ getenv "MYSQL_INNODB_STRICT_MODE" "OFF" }}
innodb_write_io_threads                 = {{ getenv "MYSQL_INNODB_WRITE_IO_THREADS" "4" }}
innodb_force_load_corrupted             = {{ getenv "MYSQL_INNODB_FORCE_LOAD_CORRUPTED" "0" }}
innodb_fast_shutdown                    = {{ getenv "MYSQL_INNODB_FAST_SHUTDOWN" "1" }}

performance_schema                      = {{ getenv "MYSQL_PERFORMANCE_SCHEMA" "OFF" }}

long_query_time                         = {{ getenv "MYSQL_LONG_QUERY_TIME" "2" }}
slow_query_log                          = {{ getenv "MYSQL_SLOW_QUERY_LOG" "OFF" }}
general_log                             = {{ getenv "MYSQL_GENERAL_LOG" "0" }}

net_write_timeout                       = {{ getenv "MYSQL_NET_WRITE_TIMEOUT" "90" }}
net_read_timeout                        = {{ getenv "MYSQL_NET_READ_TIMEOUT" "90" }}
wait_timeout                            = {{ getenv "MYSQL_WAIT_TIMEOUT" "420" }}
interactive_timeout                     = {{ getenv "MYSQL_INTERACTIVE_TIMEOUT" "420" }}

relay_log_recovery                      = {{ getenv "MYSQL_RELAY_LOG_RECOVERY" "0" }}