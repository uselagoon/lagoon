# lagu

> lagoon Command Line Interface

## Installation

Install the CLI with either `npm` or `yarn`.

```sh
# Either npm...
npm install --global @lagoon/lagu

# ...or Yarn
yarn global add @lagoon/lagu
```

## Setup

The CLI needs a configuration file at `<project directory>/.lagoon.yml`, which can be created with [the `init` command](#lagu-init):

```sh
# Initialize project configuration
$ lagu init
```

For more options, see the [`lagu init` documentation](#lagu-init).

## Commands

### `lagu init`

```text
$ lagu init --help
lagu init - Create a .lagoon.yml config file in the current working directory

Options:
  --version      Show version number                                   [boolean]
  --help         Show help                                             [boolean]
  --overwrite    Overwrite the configuration file if it exists         [boolean]
  --project      Name of project to configure                           [string]

Examples:
  lagu init                                 Create a config file at
                                            ./.lagoon.yml. This will confirm
                                            with the user whether to overwrite
                                            the config if it already exists and
                                            also prompt for a project name to
                                            add to the config.

  lagu init --overwrite                     Overwrite existing config file (do
                                            not confirm with the user).

  lagu init --overwrite false               Prevent overwriting of existing
                                            config file (do not confirm with
                                            user).

  lagu init --project my_project            Set project to "my_project" (do not
                                            prompt the user).

  lagu init --overwrite --project           Overwrite existing config files and
  my_project                                set project to "my_project" (do not
                                            confirm with or prompt the user).
```

#### `lagu init` Examples

```text
$ lagu init
? Enter the name of the project to configure. example
Creating file '/Users/you/git/.lagoon.yml'...
Configuration file created!
```

This will generate the following file:

```text
$ cat .lagoon.yml
project: example
```

### `lagu login`

```text
$ lagu login --help
lagu login - Authenticate with lagoon via an SSH key

Options:
  --version   Show version number                                  [boolean]
  --help      Show help                                            [boolean]
  --identity  Path to identity (private key)                        [string]
```

#### `lagu login` Examples

By default, the login command uses the SSH private key at `$HOME/.ssh/id_rsa`.

```text
$ lagu login
Login successful
```

If that file does not exist, the user will be prompted for the path:

```text
$ lagu login
? Path to private key file /path/to/id_rsa
Login successful
```

The path to the key can be also passed in via the `--identity` option:

```text
$ lagu login --identity ./local-dev/id_ed25519
Login successful
```

If the private key has a passphrase, the user will be prompted to enter it. The passphrase will never be saved.

```text
$ lagu login --identity ./local-dev/id_ed25519
? Private key passphrase (never saved) [hidden]
Login successful
```

## Development - docker

- First build the cli image: `make build/cli` (dependencies are automatically build)
- Run the cli docker container via `docker-compose up -d cli` (dependencies are automatically started)
- Run a bash inside the container: `docker-compose exec cli bash`
- Use `yarn execute login` to login
- Now you can run commands via `yarn execute <cli command>`

## Development - local nodejs

The `execute <cli command>` yarn script can be used to run CLI commands during development.

Additionally the following parameters should be set in the `.lagoon.yml` file. They can also be configured with the `init` command.

```yaml
api: http://localhost:3000
ssh: localhost:2020
```
