# amazeeio oc-build-deploy

## Development

1. adapt docker-compose.yml
2. Start container and connect to bash

        docker-compose run oc-build-deploy bash

3. Run deployment with

        build-deploy

4. Edit scripts from outside of container, they are mounted into so you can just run the commands again