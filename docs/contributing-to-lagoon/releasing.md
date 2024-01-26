# Releasing Lagoon

Lagoon has a number of moving parts, making releases quite complicated!

## Lagoon-core - tags and testing

1. Ensure all the identified pull requests have been merged into main branch for:
  - [uselagoon/lagoon](https://github.com/uselagoon/lagoon)
  - [uselagoon/build-deploy-tool](https://github.com/uselagoon/build-deploy-tool)
  - [uselagoon/lagoon-ui](https://github.com/uselagoon/lagoon-ui)
2. Once you are confident, push the next tag in sequence (minor or patch) to the main branch in the format v2.MINOR.PATCH as per [semver](https://semver.org/). This will trigger a Jenkins build, visible at https://ci.lagoon.sh/blue/organizations/jenkins/lagoon/branches
3. Whilst this is building, push lightweight tags to the correct commits on `lagoon-ui` and `build-deploy-tool` in the format core-v2.MINOR.PATCH. Note that there are no other tags or releases on build-deploy-tool, but lagoon-ui also has it's own semver releases that are based on it's features.
4. Once the build has completed successfully in Jenkins, head to https://github.com/uselagoon/lagoon-charts to prepare the charts release
5. In the chart.yaml for the `lagoon-core` and `lagoon-test` charts, update the following fields:
  - **version:** This is the next "minor" release of the chart - we usually use minor for a corresponding lagoon-core release
  - **appVersion:** This is the actual tag of the released lagoon-core
  - **artifacthub.io/changes:** All that's needed are the two lines in the below snippet, modified for the actual appVersion being released.

  ```yaml title="sample chart.yml snippets"
  # This is the chart version. This version number should be incremented each
  # time you make changes to the chart and its templates, including the app
  # version.
  # Versions are expected to follow Semantic Versioning (https://semver.org/)
  version: 1.28.0

  # This is the version number of the application being deployed. This version
  # number should be incremented each time you make changes to the application.
  # Versions are not expected to follow Semantic Versioning. They should reflect
  # the version the application is using.
  appVersion: v2.14.2

  # This section is used to collect a changelog for artifacthub.io
  # It should be started afresh for each release
  # Valid supported kinds are added, changed, deprecated, removed, fixed and security
  annotations:
    artifacthub.io/changes: |
      - kind: changed
        description: update Lagoon appVersion to v2.14.2
  ```
  Only lagoon-core and lagoon-test charts are updated as a result of a lagoon-core release. Follow the lagoon-remote process if there are any other changes.

6. Create a PR for this chart release, and the Github Actions suite will undertake a full suite of tests:
  - **Lint and test charts - matrix:** performs a lint and chart install against the current tested version of Kubernetes
  - **Lint and test charts - current:** performs a lint and chart install against previous/future versions of Kubernetes
  - **Lagoon tests:** runs the full series of ansible tests against the release.

  Usually, failures in the lint and test charts are well explained (missing/misconfigured chart settings). If a single Lagoon test failes, it may just need re-running. If multiple failures occur, they will need investigating.

Once those tests have all passed successfully, you can proceed with creating the releases:

## Lagoon-core - releases and release notes

1. In [uselagoon/lagoon](https://github.com/uselagoon/lagoon) create a release from the tag pushed earlier. Use the "Generate release notes" button to create the changelog. Look at previous releases for what we include in the release - and the lagoon-images link will always be the most recent released version. Note that the links to the charts, lagoon-ui and build-deploy-tool can all be filled in now, but the links won't work until the future steps. Mark this as the latest release and Publish the release.
2. In [uselagoon/build-deploy-tool](https://github.com/uselagoon/build-deploy-tool) create a release from the tag pushed earlier. Use the "Generate release notes" button to create the changelog - ensuring that the last core-v2.X tag is used, not any other tag. Look at previous releases for what we include in the release - Mark this as the latest release and Publish the release.
3. In [uselagoon/lagoon-ui](https://github.com/uselagoon/lagoon-ui) create a release from the tag pushed earlier. Use the "Generate release notes" button to create the changelog - ensuring that the last core-v2.X tag is used, not any other tag. Look at previous releases for what we include in the release - Mark this as the latest release and Publish the release.
4. In [uselagoon/lagoon-charts](https://github.com/uselagoon/lagoon-charts) merge the successful PR, this will create the lagoon-core and lagoon-test releases for you. Edit the resulting lagoon-core chart release to note the corresponding lagoon release in the title and text box, as per previous releases.

## Lagoon-remote - releases and release notes

Lagoon remote has a release cycle separate to Lagoon Core, and as such, can be released anytime that a dependency sub-chart or service is updated.
