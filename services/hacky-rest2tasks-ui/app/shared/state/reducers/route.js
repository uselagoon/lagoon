// @flow

import { LOCATION_CHANGE } from 'react-router-redux';

// Initial routing state.
const initialState: Object = {
  locationBeforeTransitions: null,
};

export default (state: Object = initialState, action: Object): Object => {
  if (action.type === LOCATION_CHANGE) {
    return {
      locationBeforeTransitions: action.payload,
    };
  }

  return state;
};
