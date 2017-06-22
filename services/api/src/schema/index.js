import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';

import { nodeField } from './node';

import {
  siteByIdField,
  allSitesField,
} from './queries/site';

import {
  siteGroupByIdField,
  siteGroupByNameField,
  siteGroupByGitUrlField,
  allSiteGroupsField,
} from './queries/sitegroup';

import {
  clientByIdField,
  allClientsField,
} from './queries/client';

import {
  createSiteMutation,
  updateSiteMutation,
} from './mutations/site';

import {
  createSiteGroupMutation,
  updateSiteGroupMutation,
} from './mutations/sitegroup';

const viewerField = {
  resolve: () => true,
  type: new GraphQLObjectType({
    name: 'Viewer',
    fields: () => ({
      allSites: allSitesField,
      allSiteGroups: allSiteGroupsField,
      allClients: allClientsField,
    }),
  }),
};

export default new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'QueryRoot',
    fields: () => ({
      node: nodeField,
      viewer: viewerField,
      siteById: siteByIdField,
      siteGroupById: siteGroupByIdField,
      siteGroupByName: siteGroupByNameField,
      siteGroupByGitUrl: siteGroupByGitUrlField,
      clientById: clientByIdField,
      allSiteGroups: allSiteGroupsField,
    }),
  }),
  mutation: new GraphQLObjectType({
    name: 'MutationRoot',
    fields: () => ({
      createSite: createSiteMutation,
      updateSite: updateSiteMutation,
      createSiteGroup: createSiteGroupMutation,
      updateSiteGroup: updateSiteGroupMutation,
    }),
  }),
});
