# amazee.io Commandline

## Installation

```sh
npm install -g @amazeeio/amazee-io-cli
```

After installation, switch to your target project directory and
initialize a `.amazeeio.yml` configuration:

```sh
io init
```

Open the `.amazeeio.yml` and add your configuration...

### Existing commands:

```sh
# List sites for the configured / given sitegroup
io list sites
io list sites -s my_sitegroup
```

## Development

```sh
npm install
npm run build
```

**To run the cli for development:**

```sh
node .
```
