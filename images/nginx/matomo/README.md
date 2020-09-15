# Matomo

Allows automatic injection of Matomo tracking snippets via environment varibales using ngx_http_sub_module.
Snippets are only included when one following configurations have been enabled:

## Single site

`MATOMO_URL` (required) - URL to the Matomo instance.
`MATOMO_SITE_ID` (required) - Matomo Site ID.

Both environment variable are required to be set.
Matomo tracking code is injected before the end of the HEAD section of all html reponses.

## Tag manager

`MATOMO_TAG_MANAGER_URL` (required) - URL of the container JS file eg. https://[matomo-url]/js/container_xxxxxxxx.js

Matomo tracking code is injected at the start of the HEAD section of all html reponses.
