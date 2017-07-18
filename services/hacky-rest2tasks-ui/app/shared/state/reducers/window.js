// @flow

import { RESIZE, SCROLL } from 'state/actions/window';

/* eslint-disable max-len */

// Initial window state.
const initialState: Object = {
  height: (__CLIENT__ &&
    (global.document.body.innerHeight ||
      global.document.documentElement.innerHeight)) ||
    0,
  width: (__CLIENT__ &&
    (global.document.body.innerWidth ||
      global.document.documentElement.innerWidth)) ||
    0,
  scroll: (__CLIENT__ &&
    (global.document.body.scrollTop ||
      global.document.documentElement.scrollTop)) ||
    0,
};

/* eslint-enable max-len */

export default (state: Object = initialState, action: Object): Object => {
  switch (action.type) {
    case RESIZE:
      return {
        ...state,
        height: action.payload.height,
        width: action.payload.width,
      };

    case SCROLL:
      return {
        ...state,
        scroll: action.payload.scroll,
      };

    default:
      return state;
  }
};
