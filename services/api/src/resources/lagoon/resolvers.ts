import { ResolverFn } from '../';

export const getLagoonVersion: ResolverFn = async (_root, args, { models, keycloakGrant: grant }) => {
  let lagoonVersion = process.env.LAGOON_VERSION
  return lagoonVersion;
}
