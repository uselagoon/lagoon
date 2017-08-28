# amazee.io Command Line Interface

## Installation

Install `io` with either `npm` or `yarn`.

```sh
# Either npm...
npm install --global @amazeeio/amazee-io-cli

# ...or Yarn
yarn global add @amazeeio/amazee-io-cli
```

## Setup

`io` needs a configuration file at `<project directory>/.amazeeio.yml`, which can be created with [the `init` command](#io-init):

```sh
# Initialize project configuration
io init
```

For more options, see the [`io init` documentation](#io-init).

## Commands

### `io init`

```text
$ io init --help
io init - Create a .amazeeio.yml config file in the current working
directory

Options:
  --help           Show help                                           [boolean]
  --overwrite      Overwrite the configuration file if it exists       [boolean]
  --sitegroup, -s  Name of sitegroup to configure                       [string]

Examples:
  io init                           Create a config file at ./.amazeeio.yml.
                                    This will confirm with the user whether to
                                    overwrite the config if it already exists
                                    and also prompt for a sitegroup name to add
                                    to the config.

  io init --overwrite               Overwrite existing config file (do not
                                    confirm with the user).

  io init --overwrite false         Prevent overwriting of existing config file
                                    (do not confirm with user).

  io init --sitegroup my_sitegroup  Set sitegroup to "my_sitegroup" (do not
                                    prompt the user).

  io init -s my_sitegroup           Short form for setting sitegroup to
                                    "my_sitegroup" (do not prompt the user).

  io init --overwrite --sitegroup   Overwrite existing config files and set
  my_sitegroup                      sitegroup to "my_sitegroup" (do not confirm
                                    with or prompt the user).
```

#### `io init` Examples

```text
$ io init
? File '/Users/Claudine/Projects/developermentify/.amazeeio.yml' already exists! Overwrite? (y/N) y
? Enter the name of the sitegroup to configure. my_sitegroup
Creating file '/Users/Claudine/Projects/developermentify/.amazeeio.yml'...
Configuration file created!
Done in 10.56s.
```

This will generate the following file:

```text
$ cat .amazeeio.yml
sitegroup: my_sitegroup
deploy_tasks:
  task1:
    before_deploy: []
    after_deploy: []
```

### `io login`

```text
$ io login --help
io login - Authenticate with amazee.io via an SSH key

Options:
  --help          Show help                                            [boolean]
  --identity, -i  Path to identity (private key)                        [string]

Done in 1.86s.
```

#### `io login` Examples

By default, the login command uses the SSH private key at `$HOME/.ssh/id_rsa`.

```text
$ io login
Login successful
Done in 1.28s.
```

If that file does not exist, the user will be prompted for the path:

```text
$ io login
? Path to private key file /path/to/id_rsa
Login successful
Done in 3.42s.
```

The path to the key can be also passed in via the `--identity` option (short form `-i`):

```text
$ io login -i /path/to/id_rsa
Login successful
Done in 1.70s.
```

If the private key has a passphrase, the user will be prompted to enter it. The passphrase will never be saved.

```text
$ io login -i /path/to/id_rsa
? Private key passphrase (never saved) [hidden]
Login successful
Done in 4.15s.
```

### `io sites`

```sh
# List sites for the configured / given sitegroup
io sites
io sites -s my_sitegroup
```

#### `io sites` Examples

TODO: Make examples

## Development - local nodejs

The `runCli.sh` script injects the necessary environment variables such as `process.env.API_URL`.

```sh
../runCli.sh -- <commands>
```

For example:

```sh
../runCli.sh -- init --overwrite false --sitegroup my_sitegroup
```

## Development - inside docker

There is already a docker container prepared that has the cli running. Run a new container with bash and then run `yarn run execute <command>`

```sh
docker-compose run --rm cli bash
```

### Old development instructions

The instructions below were how we previously built (before `runCli.sh`), but they will not inject the necessary environment variables (for example, `process.env.API_URL`).

```sh
npm install      # Install dependencies
npm run build    # Build files to the `dist` folder
node .           # Run the CLI
```
