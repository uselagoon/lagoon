# amazee.io Command Line Interface

## Installation

Install `io` with either `npm` or `yarn`.

```sh
# Either npm...
npm install --global @amazeeio/amazee-io-cli

# ...or Yarn
yarn global add @amazeeio/amazee-io-cli
```

## Configuration

Configuration lives in a `.amazeeio.yml` file in your project directory. It can be initialized with:

```sh
# Initialize project configuration
io init
```

After the init command is successful, open the `.amazeeio.yml` file and add your configuration.

## Commands

```sh
# List sites for the configured / given sitegroup
io list sites
io list sites -s my_sitegroup
```

## Development

```sh
npm install      # Install dependencies
npm run build    # Build files to the `dist` folder
node .           # Run the CLI
```
