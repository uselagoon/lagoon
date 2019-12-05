# Storybook

Storybook has been added to `services/ui`. Storybook is a set of web pages that can be browsed to see an example of all the components in the Lagoon UI.

To build a static set of webpages in `services/ui/storybook-static`, run:
```
cd services/ui
yarn install
yarn build-storybook
```
The static HTML files can be served through any method or with the provided `yarn serve-storybook`.

To run the Storybook development server (with hot-loading on file change), run:
```
cd services/ui
yarn install
yarn storybook
```

# Known issues

Currently, there are 5 components that are misbehaving inside Storybook. They will be fixed in follow-ups.

1. **Pages / Deployments**: GraphQL subscriptions don't currently work in our mocked Storybook environment. The browser freezes when `subscribeToMore()` is run, so the components can't be shown until that is fixed.
2. **Pages / Tasks**: same as above.
3. **Pages / Environment / Default**: When navigating to this page, it shows a "Internal Server Error". However, when the page is reloaded, the component is displayed without error. I've added a note in Storybook to explain this under **Pages / Environment / `@TODO`**.
4. **Components / DeployLatest**: A few of the stories under this heading are marked `@TODO` because their state is dependent on a GraphQL Mutation that I don't know yet how to mock properly in Storybook.
5. **Components / ProjectDetailsSidebar**: The component depends on CSS in the `Project` component to display properly. Both of these components need some refactoring to fix this.

Additionally, several components use React's `UseState` to track internal state. If you interact with those components in Storybook, you can get them to display those states, but you can't have Storybook show you those states on initial page load since Storybook can't mock the internal state.