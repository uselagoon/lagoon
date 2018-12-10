// @flow

const R = require('ramda');
const { PubSub, withFilter } = require('graphql-subscriptions');
const { ForbiddenError } = require('apollo-server-express');

const pubSub = new PubSub();

const createProjectFilteredSubscriber = (events: string[], filterFn: any) => {
  return {
    // Allow publish functions to pass data without knowledge of query schema.
    resolve: (payload: Object) => payload,
    subscribe: withFilter(
      (
        root,
        { project },
        {
          credentials: {
            role,
            permissions: { projects },
          },
        },
      ) => {
        if (role !== 'admin' && !R.contains(String(project), projects)) {
          throw new ForbiddenError(`No access to project ${project}.`);
        }

        return pubSub.asyncIterator(events);
      },
      filterFn,
    ),
  };
};

module.exports = {
  pubSub,
  createProjectFilteredSubscriber,
};
