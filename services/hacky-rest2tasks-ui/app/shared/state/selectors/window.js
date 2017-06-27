// @flow

export default (state: Object): Object => state.window;

export const selectWindowHeight = (state: Object): number =>
  state.window && state.window.height;

export const selectWindowWidth = (state: Object): number =>
  state.window && state.window.width;

export const selectWindowScroll = (state: Object): number =>
  state.window && state.window.scroll;
