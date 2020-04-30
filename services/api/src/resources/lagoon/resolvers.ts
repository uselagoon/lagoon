
export const getLagoonVersion = async (_root, args, { models, keycloakGrant: grant }) => {
  let lagoonVersion = process.env.LAGOON_VERSION
  return lagoonVersion;
}
