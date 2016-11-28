# AmazeeIO Commandline

## Installation

```
npm install -g @amazeeio/amazee-io-cli
```

After installation, switch to your target project directory and eventually
initialize a `.amazeeio.yml` configuration:

```
io init
```

Open the `.amazeeio.yml` and add your configuration...

### Existing commands:

```
# List sites for the configured / given sitegroup
io list sites
io list sites -s my_sitegroup
```

## Development

```
npm install
npm run build
```

**To run the cli for development:**

```
node . 
```
