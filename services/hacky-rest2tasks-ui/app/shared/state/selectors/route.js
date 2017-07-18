// @flow

export default (state: Object): Object => state.route;

export const selectLocationState = (state: Object): Object => ({
  locationBeforeTransitions: state &&
    state.route &&
    state.route.locationBeforeTransitions,
});

export const selectScreenReady = (state: Object): boolean =>
  state.route && state.route.screenReady;
