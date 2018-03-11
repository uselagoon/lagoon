// @flow

import { green, blue } from 'chalk';
import { fromUrl as hostedGitInfoFromUrl } from 'hosted-git-info';
import inquirer from 'inquirer';
import R from 'ramda';
import { table } from 'table';

import gql from '../../gql';
import { printGraphQLErrors, printErrors } from '../../printErrors';
import { runGQLQuery } from '../../query';

import type Inquirer from 'inquirer';
import typeof Yargs from 'yargs';
import type { BaseArgs } from '..';

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

type Options = {|
  customer?: number,
  name?: string,
  git_url?: string,
  openshift?: number,
  branches?: string,
  pullrequests?: string,
  production_environment?: string,
|};

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
          'Pull requests to deploy. Possible values include "false" (no pull requests) and "true" (all pull requests).',
        type: 'boolean',
        alias: 'prs',
      },
      [PRODUCTION_ENVIRONMENT]: {
        describe: 'Production environment for new project',
        type: 'string',
        alias: 'p',
      },
    })
    .example('$0', 'Create new project\n');
}

type Customer = {
  value: number,
  name: string,
};

type Openshift = {
  value: number,
  name: string,
};

export async function getAllowedCustomersAndOpenshifts(cerr: typeof console.error): Promise<{
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

function notifyUsedOption(clog: typeof console.log, option: string): void {
  clog(`${blue('!')} Using "${option}" option from arguments or config`);
}

// Return a [predicate, transformer] pair for use with R.cond(). The predicate and transformer functions expect an object with an "options" property containing the options to use.
export function answerFromOptionsPropCond(
  option: $Values<typeof commandOptions>,
  answers: Inquirer.answers,
  clog: typeof console.log,
) {
  return [
    R.compose(
      // Option is set
      R.has(option),
      R.prop('options'),
    ),
    (objectWithOptions: { options: Object }) => {
      // Assign option key in the answers object to option value and let the user know
      const propVal = R.path(['options', option], objectWithOptions);
      notifyUsedOption(clog, option);
      // eslint-disable-next-line no-param-reassign
      answers[option] = propVal;
    },
  ];
}

// Return a function to use with the `when` option of the question object.
// https://github.com/SBoudrias/Inquirer.js/issues/517#issuecomment-288964496
export function answerFromOptions(
  option: $Values<typeof commandOptions>,
  options: Object,
  clog: typeof console.log,
) {
  return (answers: Inquirer.answers) => {
    const [predicate, transform] = answerFromOptionsPropCond(
      option,
      answers,
      clog,
    );
    return R.ifElse(
      // If the option exists...
      predicate,
      // ...use it and let the user know...
      transform,
      // ...otherwise return true to prompt the user to manually enter the option
      R.T,
    )({ options });
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
          answerFromOptionsPropCond(CUSTOMER, answers, clog),
          // 2. If only one customer was returned from the allCustomers query, use that customer as the answer to the question and tell the user, not prompting them to choose.
          [
            R.compose(R.equals(1), R.length, R.prop('allCustomers')),
            (customersAndOptions) => {
              const firstCustomer = R.compose(R.head, R.prop('allCustomers'))(customersAndOptions);
              clog(`${blue('!')} Using only authorized customer "${R.prop(
                'name',
                firstCustomer,
              )}"`);
              // eslint-disable-next-line no-param-reassign
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
      when: answerFromOptions(NAME, options, clog),
    },
    {
      type: 'input',
      name: GIT_URL,
      message: 'Git URL:',
      validate: input =>
        // Verify that it is a valid hosted git url...
        hostedGitInfoFromUrl(input) !== undefined ||
        // ...or some other non-hosted formats https://stackoverflow.com/a/22312124/1268612
        /((git|ssh|http(s)?)|(.+@[\w\.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(input) ||
        // If the input is invalid, prompt the user to enter a valid Git URL
        'Please enter a valid Git URL.',
      when: answerFromOptions(GIT_URL, options, clog),
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
          answerFromOptionsPropCond(OPENSHIFT, answers, clog),
          // 2. If only one openshift was returned from the allOpenshifts query, use that openshift as the answer to the question and tell the user, not prompting them to choose.
          [
            R.compose(R.equals(1), R.length, R.prop('allOpenshifts')),
            (openshiftsAndOptions) => {
              const firstOpenshift = R.compose(R.head, R.prop('allOpenshifts'))(openshiftsAndOptions);
              clog(`${blue('!')} Using only authorized openshift "${R.prop(
                'name',
                firstOpenshift,
              )}"`);
              // eslint-disable-next-line no-param-reassign
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
      when: answerFromOptions(BRANCHES, options, clog),
    },
    {
      type: 'input',
      name: PULLREQUESTS,
      message: 'Pull requests:',
      default: null,
      when: answerFromOptions(PULLREQUESTS, options, clog),
    },
    {
      type: 'input',
      name: PRODUCTION_ENVIRONMENT,
      message: 'Production environment:',
      default: null,
      when: answerFromOptions(PRODUCTION_ENVIRONMENT, options, clog),
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
    return printErrors(cerr, 'No authorized customers found!');
  }

  if (R.equals(R.length(allOpenshifts), 0)) {
    return printErrors(cerr, 'No authorized openshifts found!');
  }

  // If all options have been specified in the config or the command line options...
  const projectInput = allOptionsSpecified(options)
    ? // ...notify the user about using each of the options and then use that options object (`forEachObjIndexed` returns the object passed in as second parameter)...
    R.forEachObjIndexed((value, key) => notifyUsedOption(clog, key), options)
    : // ...otherwise, prompt for input for the missing options
    await promptForProjectInput(allCustomers, allOpenshifts, clog, options);

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
      // Just use the options and don't even go into the prompt if all options are already specified via . Otherwise inquirer will not set the correct answers.
      // Ref: https://github.com/SBoudrias/Inquirer.js/issues/517#issuecomment-364912436
      input: projectInput,
    },
  });

  const { errors: addProjectErrors } = addProjectResult;
  if (addProjectErrors != null) {
    return printGraphQLErrors(cerr, ...addProjectErrors);
  }

  const project = R.path(['data', 'addProject'], addProjectResult);

  const projectName = R.prop('name', project);

  clog(green(`Project "${projectName}" created successfully:`));

  clog(table([
    ['Project Name', projectName],
    ['Customer', R.path(['customer', 'name'], project)],
    ['Git URL', R.prop('git_url', project)],
    ['Active Systems Deploy', R.prop('active_systems_deploy', project)],
    ['Active Systems Remove', R.prop('active_systems_remove', project)],
    ['Branches', String(R.prop('branches', project))],
    ['Pull Requests', String(R.prop('pullrequests', project))],
    ['Openshift', R.path(['openshift', 'name'], project)],
    ['Created', R.prop('created', project)],
  ]));

  return 0;
}

type Args = BaseArgs & {
  argv: {
    customer: ?string,
  },
};

export async function handler({
  clog,
  cerr,
  config,
  argv,
}:
Args): Promise<number> {
  const notUndefined = R.complement(R.equals(undefined));
  // Dynamic options are options that will likely change every time and shouldn't be specified in the config
  const dynamicOptions = [NAME];

  // Filter options to be only those included in the command options keys
  const options = R.pick(R.values(commandOptions), {
    // Remove options from the config that should require user input every time
    ...R.omit(dynamicOptions, config),
    // Don't overwrite values with non-specified arguments (which yargs sets as `undefined`)
    ...R.filter(notUndefined, argv),
  });

  return createProject({ clog, cerr, options });
}
