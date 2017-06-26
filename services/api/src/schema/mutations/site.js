import {
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';

import { mutationWithClientMutationId } from 'graphql-relay';

import {
  createSite,
  updateSite,
} from '../models/site';

import siteType from '../types/site';

const createOrUpdateSiteFields = {
  inputFields: {
    siteName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    siteHost: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    site: {
      type: siteType,
      resolve: site => site,
    },
  },
};

export const createSiteMutation = mutationWithClientMutationId({
  name: 'CreateSite',
  mutateAndGetPayload: async ({ siteName, siteHost, fullJson }) =>
    createSite(siteName, siteHost, fullJson),
  ...createOrUpdateSiteFields,
});

export const updateSiteMutation = mutationWithClientMutationId({
  name: 'UpdateSite',
  mutateAndGetPayload: ({ siteName, siteHost, fullJson }) =>
    updateSite(siteName, siteHost, fullJson),
  ...createOrUpdateSiteFields,
});
