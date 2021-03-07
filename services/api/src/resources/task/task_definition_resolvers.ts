import * as R from 'ramda';
import getFieldNames from 'graphql-list-fields';
import { ResolverFn } from '../';
import {
  pubSub,
  createEnvironmentFilteredSubscriber,
} from '../../clients/pubSub';
import {
  knex,
  prepare,
  query,
  isPatchEmpty,
} from '../../util/db';
import { Sql } from './sql';
import EVENTS from './events';
import { Helpers } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Validators as envValidators } from '../environment/validators';

export const addTaskDefinition = async (
    root,
    {
      input: {
        id,
        name,
        description,
        image,
        created,
      },
    },
    { sqlClient, hasPermission },
  ) => {

    //TODO: we need to consider who creates these definitions
    // Essentially, we want whoever creates this to determine the overall access permissions to the task
    // This can be done in the iteration that introduces links to environments/groups/etc.

    const {
        info: { insertId },
    } = await query(
      sqlClient,
      Sql.insertTaskDefinition(
        {
          id: null,
          name,
          description,
          image,
          created: null,
        }
      ),
    );

    const rows = await query(sqlClient, Sql.selectTaskDefinition(insertId));
    return R.prop(0, rows);
}

export const allTaskDefinitions = async(
  root,
  {
      input: {
      }
  },
  { sqlClient, hasPermission },
  ) => {
    //TODO: we'll need to do a lot of work here when it comes to the permissions system
    // essentially we only want to display the definitions a user has access to via their
    // groups, projects, etc.
    const rows = await query(sqlClient, Sql.selectTaskDefinitions());
    return R.prop(0, rows);
}

// TODO: question - do we actually want to ever update these tasks, or is it a create/delete only story
// The issue, as I see it, is that if tasks are updated, they may require different arguments - so versioning them makes more sense than updating.



export const taskDefinitionById = async(
  root,
  {
    input: {
      id
    }
  },
  { sqlClient, hasPermission },
  ) => {
    //TODO: we'll need to do a lot of work here when it comes to the permissions system
    // essentially we only want to display the definitions a user has access to via their
    // groups, projects, etc.
    const rows = await query(sqlClient, Sql.selectTaskDefinitions());
    return R.prop(0, rows);
}