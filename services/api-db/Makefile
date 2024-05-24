# This file exists only for development purposes
#
# Whenever you are working on sql scripts inside the docker-entrypoint-initdb.d
# directory, the watch task will initialize a SQL reload inside the running container
# to propagate changes automatically.
#
# IMPORTANT:
# The mariadb image runs always initdb scripts which were used during the build.
# Without an initial rebuild, your currently changed initdb scripts are out of sync
# with the actual used sql scripts in the docker image.
#
# Changing one sql file after initial load will sync the sql scripts.

rerun-initdb:
		docker compose exec -u root api-db bash /legacy_rerun_initdb.sh

watch:
		watchman-make -p '/legacy-migration-scripts/*.sql' 'Makefile' -t -legacy-rerun-initdb

.PHONY: reinitdb watch
