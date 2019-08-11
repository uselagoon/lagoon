# amazee.io Drush - API integration

This container is used to serve the API script which is included in the
`aliases.drushrc.php` file.

All files which are available via nginx are saved in the `./web` folder.

## How to test with lagoon

1. Check out and build the lagoon repository and its containers
2. Make sure that the lagoon -> api service is running and configured with correct hiera data
3. Run `docker-compose run --rm testing drush sa`
4. If it was successful, you will see a list of site names, otherwise you will see a generic query error
