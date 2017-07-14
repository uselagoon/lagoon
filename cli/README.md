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
  src/cli.js init                           Create a config file at
                                            ./.amazeeio.yml. This will confirm
                                            with the user whether to overwrite
                                            the config if it already exists and
                                            also prompt for a sitegroup name to
                                            add to the config.

  src/cli.js init --overwrite               Overwrite existing config file (do
                                            not confirm with the user).

  src/cli.js init --overwrite false         Prevent overwriting of existing
                                            config file (do not confirm with
                                            user).

  src/cli.js init --sitegroup my_sitegroup  Set sitegroup to "my_sitegroup" (do
                                            not prompt the user).

  src/cli.js init -s my_sitegroup           Short form for setting sitegroup to
                                            "my_sitegroup" (do not prompt the
                                            user).

  src/cli.js init --overwrite --sitegroup   Overwrite existing config files and
  my_sitegroup                              set sitegroup to "my_sitegroup" (do
                                            not confirm with or prompt the
                                            user).
```

### `io sites`

```sh
# List sites for the configured / given sitegroup
io list sites
io list sites -s my_sitegroup
```

## Development

The `runCli.sh` script injects the necessary environment variables such as `process.env.API_URL`.

```sh
../runCli.sh -- <commands>
```

For example:

```sh
../runCli.sh -- init --overwrite false --sitegroup my_sitegroup
```

### Old development instructions

The instructions below were how we previously built (before `runCli.sh`), but they will not inject the necessary environment variables (for example, `process.env.API_URL`).

```sh
npm install      # Install dependencies
npm run build    # Build files to the `dist` folder
node .           # Run the CLI
```
