import React from 'react';
import { AuthContext } from 'lib/Authenticator';

const noUser = {
  apiToken: 'dummy-value-not-used-but-evals-to-true',
  authenticated: false,
  provider: 'local-auth',
  providerData: {},
  user: {},
};

export default storyFn => (
  <AuthContext.Provider value={noUser}>
    {storyFn()}
  </AuthContext.Provider>
);
