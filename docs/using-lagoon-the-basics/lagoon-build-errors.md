# Lagoon Build Errors

Newer releases of Lagoon have the capability to identify build errors, and highlight them without failing the build. They should be resolved wherever possible, as future releases of Lagoon may not be able to handle the errors.

## Docker Compose Errors

``` shell title="Lagoon Build output indicating env_file error"
> an env_file is defined in your docker-compose file, but no matching file found
```
Docker Compose expects a referenced env file to be present at build time, but that env file is only present in local development, or has been excluded from the Dockerfile. The Lagoon team is working to hopefully allow Docker Compose to ignore this error, so this warning will remain until we have a resolution.

``` shell title="Lagoon Build output indicating string key error"
> an invalid string key was detected in your docker-compose file
```
There is an error in your Docker Compose file, most likely relating to a malformed alias or anchor. The error message should help you understand where.

``` shell title="Lagoon Build output indicating yaml validation error"
> There are yaml validation errors in your docker-compose file that should be corrected
```
There is an error in your Docker Compose file, most likely relating to a malformed alias or anchor. The error message should help you understand where.
