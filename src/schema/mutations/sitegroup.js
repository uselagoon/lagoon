import {
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import { mutationWithClientMutationId } from 'graphql-relay';

import {
  createSiteGroup,
  updateSiteGroup,
} from '../models/sitegroup';

import siteGroupType from '../types/sitegroup';

const createOrUpdateSiteGroupFields = {
  inputFields: {
    siteGroupName: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    siteGroup: {
      type: siteGroupType,
      resolve: (siteGroup) => siteGroup,
    },
  },
};

export const createSiteGroupMutation = mutationWithClientMutationId({
  name: 'CreateSiteGroup',
  mutateAndGetPayload: async ({ siteGroupName, fullJson }) =>
    createSiteGroup(siteGroupName, fullJson),
  ...createOrUpdateSiteGroupFields,
});

export const updateSiteGroupMutation = mutationWithClientMutationId({
  name: 'UpdateSiteGroup',
  mutateAndGetPayload: async ({ siteGroupName, fullJson }) =>
    updateSiteGroup(siteGroupName, fullJson),
  ...createOrUpdateSiteGroupFields,
});
