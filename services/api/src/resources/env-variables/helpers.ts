import * as R from 'ramda';
import { asyncPipe } from '@lagoon/commons/dist/util/func';
import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { Sql } from './sql';
import { GraphQLError } from 'graphql';

export const Helpers = (sqlClientPool: Pool) => {
  return {}
};

export const validateEnvVariables = async (args) => {
  // When adding LAGOON_FASTLY_SERVICE_ID variables, prevent 'runtime' scope and enforce 'build'.
  if (args.name != "" && args.name === "LAGOON_FASTLY_SERVICE_ID" && args.scope == "runtime") {
    throw new GraphQLError(`Scope should not be set as 'runtime' when adding LAGOON_FASTLY_SERVICE_ID variable, use 'build' instead`);
  }
};