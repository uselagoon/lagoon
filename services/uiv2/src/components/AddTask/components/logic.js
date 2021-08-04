import React from 'react';
import withHandlers from 'recompose/withHandlers';
import withState from 'recompose/withState';
import withProps from 'recompose/withProps';
import compose from 'recompose/compose';

const withSelectedSourceEnv = withState('selectedSourceEnv', 'setSelectedSourceEnv', '');
const withEnvironments = withProps(({ projectEnvironments, pageEnvironment }) => {
  const allButCurrentEnvironments = projectEnvironments.filter(
    env => env.id !== pageEnvironment.id
  );
  const options = allButCurrentEnvironments.map(env => ({
    label: env.name,
    value: env.id
  }));

  return {
    options,
  };
});
const withEnvHandlers = withHandlers({
  getEnvName: ({ projectEnvironments }) => id => {
    const environmentObj = projectEnvironments.find(env => env.id === id);
    if (!environmentObj) {
      return null;
    }

    return environmentObj.name;
  }
});

export default compose(
  withSelectedSourceEnv,
  withEnvironments,
  withEnvHandlers,
);
