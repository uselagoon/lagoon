import React from 'react';
import GlobalStyles from 'layouts/GlobalStyles';
import { color } from 'lib/variables';

export default {
  title: 'Home/Welcome',
};

export const toLagoon = () => (
  <GlobalStyles>
    <h1>Lagoon UI</h1>
    <p>This is the style guide for Lagoon.</p>
    <h4>Keyboard shortcuts</h4>
    <p>
      To toggle the display of the “add-ons” panel, press the <kbd>A</kbd> key.
    </p>
    <p>
      More keyboard shortcuts are available.
      {' '}
      <a href="/?path=/settings/shortcuts" style={{color: color.blue}} className="hover-state">
        See the keyboard shortcuts page
      </a>
      {' '}
      or use the <b>circled … button</b> near the top left of this website.
    </p>
  </GlobalStyles>
);
toLagoon.story = {
  name: 'to Lagoon',
};
