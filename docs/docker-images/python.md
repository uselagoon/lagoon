# Python

The [Lagoon `python` Docker image](https://github.com/uselagoon/lagoon-images/tree/main/images/python). Based on [the official Python Alpine images](https://hub.docker.com/_/python/).

## Supported Versions

* 2.7 \(available for compatibility only, no longer officially supported\) - `uselagoon/python-2.7`
* 3.7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.7.Dockerfile) (Security Support until July 2023) - `uselagoon/python-3.7`
* 3.8 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.8.Dockerfile) (Security Support until October 2024) - `uselagoon/python-3.8`
* 3.9 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.9.Dockerfile) (Security Support until October 2025) - `uselagoon/python-3.9`
* 3.10 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.10.Dockerfile) (Security Support until October 2026) - `uselagoon/python-3.10`
* 3.11 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.11.Dockerfile) (Security Support until October 2027) - `uselagoon/python-3.11`

!!! Note "Note:"
    We stop updating and publishing EOL Python images usually with the Lagoon release that comes after the officially communicated EOL date: [https://devguide.python.org/versions/#versions](https://devguide.python.org/versions/#versions). Previous published versions will remain available.

## Lagoon adaptions

The default exposed port of python containers is port `8800`.

Persistent storage is configurable in Lagoon, using the `lagoon.type: python-persistent`. See [the docs](../using-lagoon-the-basics/docker-compose-yml.md#persistent-storage) for more info

Use the following labels in your docker-compose.yml file to configure it:
`lagoon.persistent` = use this to define the path in the container to use as persistent storage - e.g. /app/files
`lagoon.persistent.size` = this to tell Lagoon how much storage to assign this path

If you have multiple services that share the same storage, use this
`lagoon.persistent.name` = (optional) use this to tell Lagoon to use the storage defined in another named service

## docker-compose.yml snippet

    ```yaml title="docker-compose.yml snippet"
		python:
            build:
                # this configures a build from a Dockerfile in the root folder
                context: .
                dockerfile: Dockerfile
            labels:
				# tells Lagoon this is a python service, configured with 500MB of persistent storage at /app/files
                lagoon.type: python-persistent
                lagoon.persistent: /app/files
                lagoon.persistent.size: 500Mi
            ports:
				# local development only
                # this exposes the port 8800 with a random local port - find it with docker-compose port python 8800
				- "8800"
			volumes:
				# local development only
				# mounts a named volume (files) at the defined path for this service to replicate production
				- files:/app/files
    ```

## Environment Variables

Environment variables are meant to contain common information for the PHP container.

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `LAGOON_LOCALDEV_HTTP_PORT` | 3000 | tells the local development environment on which port we are running |
