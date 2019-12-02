import requireContext from 'require-context.macro';
import { addDecorator, addParameters, configure } from '@storybook/react';
import { withA11y } from '@storybook/addon-a11y';
import { withKnobs } from '@storybook/addon-knobs';
import lagoonTheme from './lagoonTheme';

addParameters({
  options: {
    theme: lagoonTheme,
    showRoots: true,
    storySort: (a, b) => {
      // Debug.
      // console.log({a, b});

      // Sort by root names, using the ordering specified in rootOrder array.
      const rootOrder = ['Home', 'Components'];

      // If the two stories have the same story kind, then use the default
      // ordering, which is the order they are defined in the story file.
      if (a[1].kind === b[1].kind) {
        return 0;
      }

      // If the stories are in different story kinds, sort by root.
      const aRootName = a[1].kind.split('/')[0];
      const bRootName = b[1].kind.split('/')[0];
      if (aRootName !== bRootName) {
        // If a root is not found in rootOrder, its index will be -1
        // and we will sort it last.
        const aRootIndex = rootOrder.indexOf(aRootName);
        const bRootIndex = rootOrder.indexOf(bRootName);
        // If at least one of the roots is found, sort by rootOrder.
        if (!(aRootIndex === bRootIndex === -1)) {
          return (aRootIndex === -1 ? rootOrder.length : aRootIndex)
            - (bRootIndex === -1 ? rootOrder.length : bRootIndex);
        }
      }

      // Otherwise, use alphabetical order.
      return a[1].id.localeCompare(b[1].id)
    },
  },
  a11y: {
    restoreScroll: true,
  },
});

// Add global decorators.
addDecorator(withA11y);
addDecorator(withKnobs);

const loaderFn = () => {
  const allExports = [];

  // Automatically import all *.stories.js in these folders.
  const storiesSrc = requireContext('../src', true, /\.stories\.js$/);
  storiesSrc.keys().forEach(fname => allExports.push(storiesSrc(fname)));
  allExports.push(require('./Home.stories'));

  return allExports;
};
configure(loaderFn, module);
