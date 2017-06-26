import { GraphQLSchema, GraphQLObjectType } from 'graphql';

import { nodeField } from './node';

import { siteByNameField, allSitesField } from './queries/site';

import {
  siteGroupByNameField,
  siteGroupByGitUrlField,
  allSiteGroupsField,
} from './queries/sitegroup';

import { clientByNameField, allClientsField } from './queries/client';

import { createSiteMutation, updateSiteMutation } from './mutations/site';

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
      siteByName: siteByNameField,
      siteGroupByName: siteGroupByNameField,
      siteGroupByGitUrl: siteGroupByGitUrlField,
      clientByName: clientByNameField,
    }),
  }),
};

const query = new GraphQLObjectType({
  name: 'QueryRoot',
  fields: () => ({
    node: nodeField,
    viewer: viewerField,
    allSites: allSitesField,
    allSiteGroups: allSiteGroupsField,
    allClients: allClientsField,
    siteByName: siteByNameField,
    siteGroupByName: siteGroupByNameField,
    siteGroupByGitUrl: siteGroupByGitUrlField,
    clientByName: clientByNameField,
  }),
});

const mutation = new GraphQLObjectType({
  name: 'MutationRoot',
  fields: () => ({
    createSite: createSiteMutation,
    updateSite: updateSiteMutation,
    createSiteGroup: createSiteGroupMutation,
    updateSiteGroup: updateSiteGroupMutation,
  }),
});

export default new GraphQLSchema({ query, mutation });
