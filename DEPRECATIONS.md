# Lagoon Project Deprecation Announcements

## Overview

This file is a constantly updated central tracker for deprecations across the suite of Lagoon products. As Lagoon continues to evolve, we occasionally need to replace, rename or retire existing processes, tools or configuration. Where this may impact a user's processes or procedures, we intend to outline a timeframe to allow any necessary changes to be made.

Deprecations will be tracked by the release they are announced in, and then updated when the actual deprecation occurs. All deprecations should provide a rough timeline (in months or releases). Releases will normally only be listed here if they include planned deprecations.

## Deprecation History

All deprecations are listed below, with the most recent announcements at the top.

### Lagoon v2.18.0
release link: https://github.com/uselagoon/lagoon/releases/tag/v2.18.0
* The standard drupal based tasks that Lagoon ships with (drush ....) have been flagged as deprecated and should not be used anymore. These will need to be replaced with [custom tasks](https://docs.lagoon.sh/using-lagoon-advanced/custom-tasks/). Example replacement tasks will be provided prior to their removal.

### Lagoon v2.17.0

release link: https://github.com/uselagoon/lagoon/releases/tag/v2.17.0
* This release introduces a new active/standby task image that does not require the use of the [dioscuri controller](https://github.com/amazeeio/dioscuri). Dioscuri is deprecated and will eventually be removed from the `lagoon-remote` helm chart. If you use active/standby functionality in your clusters, you should upgrade to lagoon v2.17.0 and update your remote clusters to the version of the `lagoon-remote` helm chart the v2.17.0 release says to use (see release notes for v2.17.0)
* Support for Harbor in the API will be removed in a future release. If you currently have your core installation with Harbor support, you should move to using the integration within lagoon-remote instead. See the documentation [here](https://docs.lagoon.sh/installing-lagoon/install-lagoon-remote) and read the section about Harbor.
* Support for Harbor 2.1.x (chart version 1.5.x) and older in `lagoon-remote` will be removed in a future release. You should consider upgrading Harbor to a newer version (currently Lagoon supports up to v2.9.x (chart version 1.13.x)), following any recommended upgrade paths from Harbor.

### Lagoon v2.16.0

release link: https://github.com/uselagoon/lagoon/releases/tag/v2.16.0

There were no planned deprecations announced in this release.
