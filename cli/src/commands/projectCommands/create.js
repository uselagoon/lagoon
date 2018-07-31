// @flow

import { green, blue } from 'chalk';
import { fromUrl as hostedGitInfoFromUrl } from 'hosted-git-info';
import inquirer from 'inquirer';
import R from 'ramda';
import { table } from 'table';

import {
  answerWithOptionIfSetOrPrompt,
  answerWithOptionIfSet,
} from '../../cli/answerWithOption';
import { config } from '../../config';
import gql from '../../gql';
import { printGraphQLErrors, printErrors } from '../../printErrors';
import { runGQLQuery } from '../../query';
import { getOptions } from '..';

import type Inquirer from 'inquirer';
import typeof Yargs from 'yargs';
import type { BaseHandlerArgs } from '..';

export const command = 'create';
export const description = 'Create new project';

export const CUSTOMER: 'customer' = 'customer';
export const NAME: 'name' = 'name';
export const GIT_URL: 'git_url' = 'git_url';
export const OPENSHIFT: 'openshift' = 'openshift';
export const BRANCHES: 'branches' = 'branches';
export const PULLREQUESTS: 'pullrequests' = 'pullrequests';
export const PRODUCTION_ENVIRONMENT: 'production_environment' =
  'production_environment';

export const commandOptions = {
  [CUSTOMER]: CUSTOMER,
  [NAME]: NAME,
  [GIT_URL]: GIT_URL,
  [OPENSHIFT]: OPENSHIFT,
  [BRANCHES]: BRANCHES,
  [PULLREQUESTS]: PULLREQUESTS,
  [PRODUCTION_ENVIRONMENT]: PRODUCTION_ENVIRONMENT,
};

type Options = {
  customer?: number,
  name?: string,
  git_url?: string,
  openshift?: number,
  branches?: string,
  pullrequests?: string,
  production_environment?: string,
};

export function allOptionsSpecified(options: Options): boolean {
  // Return a boolean of whether all possible command options keys...
  return R.all(
    // ...are contained in keys of the provided object
    R.contains(R.__, R.keys(options)),
    R.values(commandOptions),
  );
}

export function builder(yargs: Yargs): Yargs {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .options({
      [CUSTOMER]: {
        describe: 'Customer id to use for new project',
        type: 'number',
        alias: 'c',
      },
      [NAME]: {
        describe: 'Name of new project',
        type: 'string',
        alias: 'n',
      },
      [GIT_URL]: {
        describe: 'Git URL of new project',
        type: 'string',
        alias: 'u',
      },
      [OPENSHIFT]: {
        describe: 'Openshift id to use for new project',
        type: 'number',
        alias: 'o',
      },
      [BRANCHES]: {
        describe:
          'Branches to deploy. Possible values include "false" (no branches), "true" (all branches) and a regular expression to match branches.',
        type: 'string',
        alias: 'b',
      },
      [PULLREQUESTS]: {
        describe:
          'Pull requests to deploy. Possible values include "false" (no pull requests), "true" (all pull requests) and a regular expression to match pull request titles.',
        type: 'boolean',
        alias: 'r',
      },
      [PRODUCTION_ENVIRONMENT]: {
        describe: 'Production environment for new project',
        type: 'string',
        alias: 'p',
      },
    })
    .example(
      `$0 ${command}`,
      'Create new project (will prompt for all input values)\n',
    )
    .example(
      `$0 ${command} --${NAME} my_project`,
      'Create a new project with the name "my_project" (will prompt for all other values).',
    )
    .example(
      `$0 ${command} --${GIT_URL} git@github.com:amazeeio/drupal-example.git --${BRANCHES} '(staging|production)' --${PULLREQUESTS} '(Feature:|Hotfix:)`,
      'Create a new project with the Git URL "git@github.com:amazeeio/drupal-example.git" which will have the "staging" and "production" branches and all pull requests with "Feature:" or "Hotfix:" in the title deployed (will prompt for all other values).',
    )
    .example(
      `$0 ${command} --${CUSTOMER} 1 --${NAME} my_project --${GIT_URL} git@github.com:amazeeio/drupal-example.git --${OPENSHIFT} kickstart-openshift --${BRANCHES} '(staging|production)' --${PULLREQUESTS} '(Feature:|Hotfix:)' --${PRODUCTION_ENVIRONMENT} 'production'`,
      'Create a new project with all options specified (will not prompt the user).',
    );
}

type Customer = {
  value: number,
  name: string,
};

type Openshift = {
  value: number,
  name: string,
};

export async function getAllowedCustomersAndOpenshifts(
  cerr: typeof console.error,
): Promise<{
  allCustomers: ?Array<Customer>,
  allOpenshifts: ?Array<Openshift>,
  errors: ?Array<Error>,
}> {
  const customersAndOpenshiftsResults = await runGQLQuery({
    query: gql`
      query AllCustomersAndOpenshiftsForProjectCreate {
        allCustomers {
          value: id
          name
        }
        allOpenshifts {
          value: id
          name
        }
      }
    `,
    cerr,
  });

  return {
    allCustomers: R.path(
      ['data', 'allCustomers'],
      customersAndOpenshiftsResults,
    ),
    allOpenshifts: R.path(
      ['data', 'allOpenshifts'],
      customersAndOpenshiftsResults,
    ),
    errors: R.prop('errors', customersAndOpenshiftsResults),
  };
}

// Prompt the user to input data to be used for project creation
export async function promptForProjectInput(
  allCustomers: ?Array<Customer>,
  allOpenshifts: ?Array<Openshift>,
  clog: typeof console.log,
  options: Object,
): Promise<Inquirer.answers> {
  const questions: Array<Question> = [
    {
      type: 'list',
      name: CUSTOMER,
      message: 'Customer:',
      choices: allCustomers,
      // Using the `when` method of the question object, decide where to get the customer based on conditions
      // https://github.com/SBoudrias/Inquirer.js/issues/517#issuecomment-288964496
      when(answers) {
        return R.cond([
          // 1. If the `customer` is set in the command line arguments or the config, use that customer
          answerWithOptionIfSet({
            option: CUSTOMER,
            answers,
            notify: true,
            clog,
          }),
          // 2. If only one customer was returned from the allCustomers query, use that customer as the answer to the question and tell the user, not prompting them to choose.
          [
            R.compose(
              R.equals(1),
              R.length,
              R.prop('allCustomers'),
            ),
            (customersAndOptions) => {
              const firstCustomer = R.compose(
                R.head,
                R.prop('allCustomers'),
              )(customersAndOptions);
              clog(
                `${blue('!')} Using only authorized customer "${R.prop(
                  'name',
                  firstCustomer,
                )}"`,
              );
              answers.customer = R.prop('value', firstCustomer);
            },
          ],
          // 3. If more than one customer was returned from the allCustomers query, return true to prompt the user to choose from a list
          [R.T, R.T],
        ])({ allCustomers, options });
      },
    },
    {
      type: 'input',
      name: NAME,
      message: 'Project name:',
      validate: input => Boolean(input) || 'Please enter a project name.',
      when: answerWithOptionIfSetOrPrompt({
        option: NAME,
        options,
        notify: true,
        clog,
      }),
    },
    {
      type: 'input',
      name: GIT_URL,
      message: 'Git URL:',
      validate: input =>
        // Verify that it is a valid hosted git url...
        hostedGitInfoFromUrl(input) !== undefined ||
        // ...or some other non-hosted formats https://stackoverflow.com/a/22312124/1268612
        /((git|ssh|http(s)?)|(.+@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(
          input,
        ) ||
        // If the input is invalid, prompt the user to enter a valid Git URL
        'Please enter a valid Git URL.',
      when: answerWithOptionIfSetOrPrompt({
        option: GIT_URL,
        options,
        notify: true,
        clog,
      }),
    },
    {
      type: 'list',
      name: OPENSHIFT,
      message: 'Openshift:',
      choices: allOpenshifts,
      // Using the `when` method of the question object, decide where to get the openshift based on conditions
      // https://github.com/SBoudrias/Inquirer.js/issues/517#issuecomment-288964496
      when(answers) {
        return R.cond([
          // 1. If the `openshift` is set in the command line arguments or the config, use that openshift
          answerWithOptionIfSet({
            option: OPENSHIFT,
            answers,
            notify: true,
            clog,
          }),
          // 2. If only one openshift was returned from the allOpenshifts query, use that openshift as the answer to the question and tell the user, not prompting them to choose.
          [
            R.compose(
              R.equals(1),
              R.length,
              R.prop('allOpenshifts'),
            ),
            (openshiftsAndOptions) => {
              const firstOpenshift = R.compose(
                R.head,
                R.prop('allOpenshifts'),
              )(openshiftsAndOptions);
              clog(
                `${blue('!')} Using only authorized openshift "${R.prop(
                  'name',
                  firstOpenshift,
                )}"`,
              );
              answers.openshift = R.prop('value', firstOpenshift);
            },
          ],
          // 3. If more than one openshift was returned from the allOpenshifts query, return true to prompt the user to choose from a list
          [R.T, R.T],
        ])({ allOpenshifts, options });
      },
    },
    {
      type: 'input',
      name: BRANCHES,
      message: 'Deploy branches:',
      default: 'true',
      when: answerWithOptionIfSetOrPrompt({
        option: BRANCHES,
        options,
        notify: true,
        clog,
      }),
    },
    {
      type: 'input',
      name: PULLREQUESTS,
      message: 'Pull requests:',
      default: null,
      when: answerWithOptionIfSetOrPrompt({
        option: PULLREQUESTS,
        options,
        notify: true,
        clog,
      }),
    },
    {
      type: 'input',
      name: PRODUCTION_ENVIRONMENT,
      message: 'Production environment:',
      default: null,
      when: answerWithOptionIfSetOrPrompt({
        option: PRODUCTION_ENVIRONMENT,
        options,
        notify: true,
        clog,
      }),
    },
  ];

  return inquirer.prompt(questions);
}

type createProjectArgs = {
  clog: typeof console.log,
  cerr: typeof console.error,
  options: Options,
};

type Question = Inquirer.question & {
  name: $Values<typeof commandOptions>,
};

export async function createProject({
  clog,
  cerr,
  options,
}:
createProjectArgs): Promise<number> {
  const {
    allCustomers,
    allOpenshifts,
    errors,
  } = await getAllowedCustomersAndOpenshifts(cerr);

  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  if (R.equals(R.length(allCustomers), 0)) {
    return printErrors(cerr, { message: 'No authorized customers found!' });
  }

  if (R.equals(R.length(allOpenshifts), 0)) {
    return printErrors(cerr, { message: 'No authorized openshifts found!' });
  }

  const projectInput = await promptForProjectInput(
    allCustomers,
    allOpenshifts,
    clog,
    options,
  );

  const addProjectResult = await runGQLQuery({
    query: gql`
      mutation AddProject($input: ProjectInput!) {
        addProject(input: $input) {
          id
          name
          customer {
            name
          }
          git_url
          active_systems_deploy
          active_systems_remove
          branches
          pullrequests
          openshift {
            name
          }
          created
        }
      }
    `,
    cerr,
    variables: {
      input: projectInput,
    },
  });

  const { errors: addProjectErrors } = addProjectResult;

  if (addProjectErrors != null) {
    if (
      /Duplicate entry '[^']+' for key 'name'/.test(
        R.prop('message', R.head(addProjectErrors)),
      )
    ) {
      return printErrors(cerr, {
        message: `Project name "${R.prop(
          'name',
          projectInput,
        )}" already exists! Please select a different project name.`,
      });
    }

    return printGraphQLErrors(cerr, ...addProjectErrors);
  }

  const project = R.path(['data', 'addProject'], addProjectResult);

  const projectName = R.prop('name', project);

  clog(green(`Project "${projectName}" created successfully:`));

  clog(
    table([
      ['Project Name', projectName],
      ['Customer', R.path(['customer', 'name'], project)],
      ['Git URL', R.prop('git_url', project)],
      ['Active Systems Deploy', R.prop('active_systems_deploy', project)],
      ['Active Systems Remove', R.prop('active_systems_remove', project)],
      ['Branches', String(R.prop('branches', project))],
      ['Pull Requests', String(R.prop('pullrequests', project))],
      ['Openshift', R.path(['openshift', 'name'], project)],
      ['Created', R.prop('created', project)],
    ]),
  );

  return 0;
}

type Args = BaseHandlerArgs & {
  argv: {
    customer: ?string,
  },
};

export async function handler({ clog, cerr, argv }: Args): Promise<number> {
  const options = getOptions({
    config,
    argv,
    commandOptions,
    dynamicOptionKeys: [NAME],
  });

  return createProject({ clog, cerr, options });
}
