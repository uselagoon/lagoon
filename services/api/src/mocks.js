import { MockList } from 'graphql-tools';
import faker from 'faker/locale/en';
import { packages } from './data/mock-data';

// The mocks object is an Apollo Resolver Map where each mock function has the
// following definition: (parent, args, context, info) => {}
// See https://www.apollographql.com/docs/graphql-tools/mocking/
// https://www.apollographql.com/docs/apollo-server/data/data/#resolver-map
//
// This file should closely match the TypeDefs.js.
// @TODO Prevent mocked values from diverging from defined values in typeDefs.
//   Maybe split up tyepDefs, resolvers and mocks into folders per API concept?

// Allow consumer to generate consistent results by seeding faker.
export const seed = (value = 123) => faker.seed(value);

// Helper function for dates that should be clustered near each other.
const addTime = (originalDate, hoursLimit) => {
  const date = new Date(originalDate);
  date.setTime(
    date.getTime()
    + faker.random.number(hoursLimit*60*60*1000)
  );
  return date.toISOString();
};

// Helper function to build an array of a given schema.
export const generator = (schema, min = 1, max) => {
  max = max || min;
  return Array.from({
    length: faker.random.number({
      min,
      max,
    }),
  }).map(() => {
    const innerGen = (anySchema) => Object.keys(anySchema).reduce((entity, key) => {
      if (Object.prototype.toString.call(anySchema[key]) === '[object Object]') {
        entity[key] = innerGen(anySchema[key]);
        return entity;
      }
      entity[key] = faker.fake(anySchema[key]);

      return entity;
    }, {});

    return innerGen(schema());
  });
};

//
// 'scalar' and 'enum' mocks from typeDefs.
//
const mocks = {
  Date: () => faker.date.between('2018-11-01T00:00:00', '2019-10-31T23:59:59').toISOString(),
  JSON: () => ({ id: faker.random.number(), currency: 'usd' }),
  SshKeyType: () => faker.random.arrayElement(['ssh_rsa', 'ssh_ed25519','ecdsa_sha2_nistp256','ecdsa_sha2_nistp384','ecdsa_sha2_nistp521']),
  DeployType: () => faker.random.arrayElement(['branch', 'pullrequest', 'promote']),
  EnvType: () => faker.random.arrayElement(['production', 'development']),
  NotificationType: () => faker.random.arrayElement(['slack', 'rocketchat', 'microsoftteams', 'email']),
  DeploymentStatusType: () => faker.random.arrayElement(['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete']),
  EnvVariableType: () => faker.random.arrayElement(['project', 'environment']),
  EnvVariableScope: () => faker.random.arrayElement(['build', 'runtime', 'global', 'container_registry']),
  TaskStatusType: () => faker.random.arrayElement(['active', 'succeeded', 'failed']),
  RestoreStatusType: () => faker.random.arrayElement(['pending', 'successful', 'failed']),
  EnvOrderType: () => faker.random.arrayElement(['name', 'updated']),
  ProjectOrderType: () => faker.random.arrayElement(['name', 'created']),
  ProjectAvailability: () => faker.random.arrayElement(['standard', 'high']),
  GroupRole: () => faker.random.arrayElement(['guest', 'reporter', 'developer', 'maintainer', 'owner']),
  Currency: () => faker.random.arrayElement(['AUD', 'EUR', 'GBP', 'USD', 'CHF', 'ZAR']),
};

//
// 'type' mocks from typeDefs.
//

mocks.File = () => {
  const name = faker.system.commonFileName('tgz');
  return {
    id: faker.random.number(),
    filename: name,
    download: `/download/${name}`,
    created: mocks.Date(),
  };
};

mocks.SshKey = () => ({
  id: faker.random.number(),
  name: `${faker.name.firstName()} SSH key`,
  keyValue: faker.random.uuid(),
  keyType: mocks.SshKeyType(),
  keyFingerprint: faker.random.uuid(),
  created: mocks.Date(),
});

mocks.User = (parent, args = {}, context, info) => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const user = {
    id: faker.random.number(),
    email: faker.internet.email(firstName, lastName),
    firstName,
    lastName,
    comment: faker.lorem.words(5),
    gitlabId: faker.random.number(),
    sshKeys: [ mocks.SshKey() ],
    groups: [],
  };
  return {
    ...user,
    groups: args.hasOwnProperty('groups')
      ? args.groups
      : [mocks.Group(null, {user})],
  }
};

mocks.GroupMembership = (parent, args = {}, context, info) => ({
  user: args.hasOwnProperty('user')
    ? args.user
    : mocks.User(null, {groups: []}),
  role: mocks.GroupRole(),
});

mocks.Group = (parent, args = {}, context, info) => {
  const user = args.hasOwnProperty('user')
    ? args.user
    : mocks.User(null, {groups: []});
  const user2 = mocks.User(null, {groups: []});

  const group = {
    id: faker.random.number(),
    name: faker.random.word(),
    // Only mock nested groups when not asked for a user-specific group.
    groups: !args.hasOwnProperty('user')
      ? [mocks.Group(null, {user: mocks.User(null, {groups: []})})]
      : [],
    members: [
      mocks.GroupMembership(null, {user}),
      mocks.GroupMembership(null, {user: user2}),
    ],
  };

  // Add a reference to the group to all of its members.
  user.groups.push(group);
  user2.groups.push(group);

  return group;
};

//mocks.Group = mocks.GroupInterface;

mocks.Me = () => ({
  id: faker.random.number(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  username: faker.internet.userName(),
  sshKeys: [{
    id: faker.random.number(),
    name: faker.random.arrayElement(['key-1', 'key-2', 'key-3']),
    keyType: faker.random.arrayElement(['SSH_RSA', 'SSH_ED25519', 'ECDSA_SHA2_NISTP256', 'ECDSA_SHA2_NISTP384', 'ECDSA_SHA2_NISTP521']),
    created: mocks.Date(),
    keyFingerprint: faker.random.uuid()
  },
  {
    id: faker.random.number(),
    name: faker.random.arrayElement(['key-1', 'key-2', 'key-3']),
    keyType: faker.random.arrayElement(['SSH_RSA', 'SSH_ED25519', 'ECDSA_SHA2_NISTP256', 'ECDSA_SHA2_NISTP384', 'ECDSA_SHA2_NISTP521']),
    created: mocks.Date(),
    keyFingerprint: faker.random.uuid()
  }]
})

mocks.Openshift = () => ({
  id: faker.random.number(),
  name: 'ci-local',
  consoleUrl: 'https://192.168.99.100:8443/',
  token: faker.random.uuid(),
  routerPattern: '${project}.${branch}.192.168.99.100.xip.io',
  projectUser: faker.internet.userName(),
  sshHost: '192.168.99.1',
  sshPort: '22',
  created: mocks.Date(),
});

mocks.NotificationMicrosoftTeams = () => ({
  id: faker.random.number(),
  name: 'amazeeio--lagoon-local-ci',
  webhook: 'https://amazeeio.teams.microsoft.com/hooks/ikF5XMohDZK7KpsZf/c9BFBt2ch8oMMuycoERJQMSLTPo8nmZhg2Hf2ny68ZpuD4Kn',
});

mocks.NotificationRocketChat = () => ({
  id: faker.random.number(),
  name: 'amazeeio--lagoon-local-ci',
  webhook: 'https://amazeeio.rocket.chat/hooks/ikF5XMohDZK7KpsZf/c9BFBt2ch8oMMuycoERJQMSLTPo8nmZhg2Hf2ny68ZpuD4Kn',
  channel: 'lagoon-local-ci'
});

mocks.NotificationSlack = () => ({
  id: faker.random.number(),
  name: 'amazeeio--lagoon-local-ci',
  webhook: 'https://amazeeio.slack.com/hooks/ikF5XMohDZK7KpsZf/c9BFBt2ch8oMMuycoERJQMSLTPo8nmZhg2Hf2ny68ZpuD4Kn',
  channel: 'lagoon-local-ci'
});

mocks.NotificationEmail = () => ({
  id: faker.random.number(),
  name: 'amazeeio--lagoon-local-ci',
  emailAddress: faker.internet.email(),
});

mocks.UnassignedNotification = () => ({
  id: faker.random.number(),
  name: 'unassigned--local-ci',
  type: mocks.NotificationType(),
});

mocks.Notification = () => {
  switch (mocks.NotificationType()) {
    case 'email':
      return mocks.NotificationEmail();
    case 'microsoftteams':
      return mocks.NotificationMicrosoftTeams();
    case 'rocketchat':
      return mocks.NotificationRocketChat();
    case 'slack':
      return mocks.NotificationSlack();
  }
};

mocks.Project = (parent, args = {}, context, info) => {
  const name = `${faker.company.catchPhraseAdjective()} ${faker.company.bsNoun()}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const project = {
    id: faker.random.number(),
    name,
    gitUrl: faker.random.arrayElement([`git@example.com/${name}/${faker.company.bsNoun()}.git`, `https://example.com/${name}/${faker.company.bsNoun()}.git`]),
    availability: mocks.ProjectAvailability(),
    privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIJKQIBAAKCAgEA+o[...]P0yoL8BoQQG2jCvYfWh6vyglQdrDYx/o6/8ecTwXokKKh6fg1q
-----END RSA PRIVATE KEY-----`,
    subfolder: '',
    notifications: [mocks.Notification()],
    activeSystemsDeploy: 'lagoon_controllerBuildDeploy',
    activeSystemsPromote: 'lagoon_controllerBuildDeploy',
    activeSystemsRemove: 'lagoon_controllerRemove',
    activeSystemsTask: 'lagoon_controllerJob',
    branches: faker.random.arrayElement(['true', 'false', '^(master|staging)$']),
    pullrequests: faker.random.arrayElement(['true', 'false', '[BUILD]']),
    productionEnvironment: 'master',
    autoIdle: faker.random.arrayElement([0, 1]),
    storageCalc: faker.random.arrayElement([0, 1]),
    problemsUi: 1,
    factsUi: 1,
    openshift: mocks.Openshift(),
    openshiftProjectPattern: '${project}-${name}',
    developmentEnvironmentsLimit: 10,
    environments: [],
    created: mocks.Date(),
    envVariables: [ mocks.EnvKeyValue() ],
    // groups: [ mocks.Group() ],
  };
  return {
    ...project,
    environments: args.hasOwnProperty('environments') ? args.environments : mocks.Query().allEnvironments(null, { project }),
  };
};

mocks.Environment = (parent, args = {}, context, info) => {
  const name = args.hasOwnProperty('name')
    ? args.name
    : faker.random.arrayElement(['master', 'staging', 'development', 'pr-42', 'pr-100', 'pr-175']);
  let deployType, deployBaseRef, deployHeadRef;
  if (/^pr\-/.test(name)) {
    deployType = 'pullrequest';
    deployBaseRef = 'target';
    deployHeadRef = 'source';
  } else {
    deployType = 'branch';
    deployBaseRef = name;
    deployHeadRef = 'source';
  }
  const created = mocks.Date();
  const updated = addTime(created, 48);
  const deleted = addTime(updated, 24);
  const project = args.hasOwnProperty('project') ? args.project : mocks.Project(null, { environment: {} });

  const environment = {
    id: faker.random.number(),
    name,
    project,
    deployType,
    deployBaseRef,
    deployHeadRef,
    deployTitle: name,
    autoIdle: faker.random.arrayElement([0, 1]),
    environmentType: name === 'master' ? 'production' : 'development',
    openshiftProjectName: `${project.name}-${name}`.toLowerCase(),
    updated,
    created,
    deleted,
    hoursMonth: mocks.EnvironmentHoursMonth(),
    storages: [],
    storageMonth: mocks.EnvironmentStorageMonth(),
    hitsMonth: mocks.EnvironmentHitsMonth(),
    envVariables: [ mocks.EnvKeyValue() ],
    route: name === 'master' ? `https://${project.name}.org` : `https://${name}.${project.name}.org`,
    routes: `https://${project.name}.org,https://varnish-${project.name}-org-prod.us.amazee.io,https://nginx-${project.name}-org-prod.us.amazee.io`,
    monitoringUrls: '',
    deployments: [
      mocks.Deployment(null, {environment: { created: new Date(mocks.Date()) }}),
      mocks.Deployment(null, {environment: {}})
    ],
    backups: [],
    tasks: [],
    problems: [],
    facts: [],
    services: [ mocks.EnvironmentService(), mocks.EnvironmentService(), mocks.EnvironmentService() ],
  };

  return {
    ...environment,
    storages: [ mocks.EnvironmentStorage(null, {environment}) ],
    deployments: args.hasOwnProperty('deployments') ? args.deployments : [
      mocks.Deployment(null, {environment} ),
      mocks.Deployment(null, {environment} )
    ],
    problems: args.hasOwnProperty('problems') ? args.problems : [
      mocks.Problem(null, {source: "Drutiny", severity: "CRITICAL"}),
      mocks.Problem(null, {source: "Trivy", severity: "MEDIUM"}),
      mocks.Problem(null, {source: "Drutiny", severity: "HIGH"}),
      mocks.Problem(null, {source: "OWASP ZAP", severity: "LOW"}),
      mocks.Problem(),
      mocks.Problem()
    ],
    facts: args.hasOwnProperty('facts') ? args.facts : [
      mocks.Fact(null, { name: "php-version", value: faker.random.arrayElement(['7.4.1', '7.2.1', '7.1.1', '8.1.0']), source: "php-version", category: "Programming language", keyFact: true} ),
      mocks.Fact(null, { name: "drupal-core", value: "9.0.12", source: "drupal-version", category: "Framework", keyFact: true} ),
      mocks.Fact(null, { name: "Lagoon", value: " 21.3.0", source: "env", category: "Platform", keyFact: true} ),
      mocks.Fact(null, { name: "site-code-status", value: faker.random.arrayElement(['200', '404', '403', '301', '504', '503']), source: "curl", category: "Performance", keyFact: true} ),
      mocks.Fact(null, { name: "lagoon-category", value: "saas", source: "saas", category: "Lagoon", keyFact: true} ),
      mocks.Fact(),
      mocks.Fact()
    ],
    backups: args.hasOwnProperty('backups') ? args.backups : [ mocks.Backup(null, {environment}) ],
    tasks: args.hasOwnProperty('tasks') ? args.tasks : [ mocks.Task(null, {environment}) ],
  };
};

mocks.EnvironmentHitsMonth = () => ({
  total: faker.random.number(),
});

mocks.EnvironmentStorage = (parent, args = {}, context, info) => ({
  id: faker.random.number(),
  environment: args.hasOwnProperty('environment') ? { id: args.environment.id } : { id: mocks.Environment().id },
  persistentStorageClaim: '',
  bytesUsed: faker.random.number({ precision: 0.001 }), // Float
  updated: mocks.Date(),
});

mocks.EnvironmentStorageMonth = () => {
  const date = new Date(mocks.Date());
  return {
    month: `${date.getFullYear()}-${date.getMonth() + 1}`,
    bytesUsed: faker.random.number({ precision: 0.001 }),
  };
};

mocks.EnvironmentHoursMonth = () => {
  const date = new Date(mocks.Date());
  return {
    month: `${date.getFullYear()}-${date.getMonth() + 1}`,
    hours: faker.random.number({ max: 24*30 }),
  };
};

mocks.EnvironmentService = () => ({
  id: faker.random.number(),
  name: faker.random.arrayElement(['cli', 'nginx', 'mariadb', 'solr', 'varnish', 'php']),
});

mocks.Fact = (parent, args = {}, context, info) => {
  const id = `${faker.random.number({min: 0, max: 99999})}`;
  const name = args.hasOwnProperty('name') ? args.name : faker.random.arrayElement(['drupal-version', 'drush-version', 'admin_toolbar', 'drupal-core', 'laravel', 'composer-version']);
  const value = args.hasOwnProperty('value') ? args.value : faker.random.arrayElement(['8.0.1', '9.0.1', '3.2.1', '10.20.2', '4.3.4']);
  const source = args.hasOwnProperty('source') ? args.source : faker.random.arrayElement(['drush_pml', 'drush_status', 'http_header', 'php-version', 'env']);
  const category = args.hasOwnProperty('category') ? args.category : faker.random.arrayElement(['Application', 'Framework', 'Docker configuration', 'Drupal configuration', 'Lagoon', 'Platform', 'Programming language']);
  const description = faker.lorem.paragraph();
  const environment = `${faker.random.number({min:0, max:5})}`;
  const keyFact = args.hasOwnProperty('keyFact') ? args.keyFact : false;
  const type = args.hasOwnProperty('type') ? args.type : 'TEXT';

  const references = [{
    id: faker.random.number(),
    fid: faker.random.number(),
    name: faker.random.arrayElement([
      ['nginx.company.amazee.io'], ['cli'], ['solr'], ['php'], ['backend.company.amazee.io']
    ])
  }];

  return {
    id: id,
    name: name,
    value: value,
    source: source,
    category: category,
    description,
    environment,
    keyFact,
    type,
    references
  };
};

mocks.Backup = (parent, args = {}, context, info) => {
  const date = mocks.Date();
  const backupId = faker.random.uuid();
  return {
    id: faker.random.number(),
    environment: args.hasOwnProperty('environment') ? { id: args.environment.id } : { id: mocks.Environment().id },
    source: faker.random.arrayElement(['files', 'mariadb']),
    backupId,
    created: date,
    deleted: addTime(date, 24),
    restore: mocks.Restore(null, {backupId}),
  };
};

mocks.Restore = (parent, args = {}, context, info) => {
  const backupId = args.hasOwnProperty('backupId')
    ? args.backupId
    : faker.random.number();
  return {
    id: faker.random.number(),
    backupId,
    status: mocks.RestoreStatusType(),
    restoreLocation: `/restore/${backupId}`,
    created: mocks.Date(),
  };
};

mocks.Deployment = (parent, args = {}, context, info) => {
  const id = faker.random.number();
  const created = args.hasOwnProperty('created') ? args.created : mocks.Date();
  const started = addTime(created, .5);
  const completed = addTime(started, .75);

  return {
    id,
    name: `build-${id}`,
    status: mocks.DeploymentStatusType(),
    created,
    started,
    completed,
    environment: args.hasOwnProperty('environment') ? args.environment : mocks.Environment(null, {deployments: []} ),
    remoteId: faker.random.number(),
    buildLog: 'Buildem logem ipsum.',
  };
};

mocks.EnvKeyValue = () => ({
  id: faker.random.number(),
  scope: mocks.EnvVariableScope(),
  name: 'LAGOON_API_VARIABLE_PROJECT',
  value: '4A65DC68F2',
});

mocks.Task = (parent, args = {}, context, info) => {
  const name = faker.random.arrayElement(['Site Status', 'Drupal Archive']);
  const created = mocks.Date();
  const started = addTime(created, 0.125);
  const completed = addTime(created, 1.7);
  return {
    id: args.hasOwnProperty('id') ? args.id : faker.random.number(),
    name,
    status: mocks.TaskStatusType(),
    created,
    started,
    completed,
    environment: args.hasOwnProperty('environment') ?  args.environment : mocks.Environment(),
    service: 'cli',
    command: name === 'Site Status' ? 'drush status' : 'drush archive-dump',
    remoteId: faker.random.uuid(),
    logs: 'Taskem logem ipsum.',
    files: [ mocks.File() ],
  };
};

mocks.ProblemIdentifier = () => {
  const recentYear = faker.random.arrayElement(['2019', '2020']);
  const vuln_id = `CVE-${recentYear}-${faker.random.number({min: 1000, max: 99999})}`;
  const severity = faker.random.arrayElement(['UNKNOWN', 'NEGLIGIBLE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
  const source = faker.random.arrayElement(['Harbor', 'Drutiny']);

  return {
    identifier: vuln_id,
    severity: severity,
    source: source,
    problems: Array.from({
        length: faker.random.number({
            min: 1,
            max: 20,
        }),
    }).map(() => {
        return mocks.Problem()
    })
  }
};

mocks.Problem = (parent, args = {}, context, info) => {
    const recentYear = faker.random.arrayElement(['2019', '2020']);
    const vuln_id = `CVE-${recentYear}-${faker.random.number({min: 1000, max: 99999})}`;
    const source = faker.random.arrayElement(['Lighthouse', 'Drutiny', 'Trivy', 'OWASP ZAP', 'Script']);
    // const created = faker.date.between('2019-10-01 00:00:00', '2020-03-31 23:59:59').toUTCString();
    const associatedPackage = faker.random.arrayElement(packages);
    // const version = `${faker.random.number(4)}.${faker.random.number(9)}.${faker.random.number(49)}`;
    // const fixedVersion = `${version}+deb8u${faker.random.number(9)}`;
    const severity = faker.random.arrayElement(['UNKNOWN', 'NEGLIGIBLE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    const description = faker.lorem.paragraph();
    const links = `https://security-tracker.debian.org/tracker/${vuln_id}`;
    const severityScore = `0.${faker.random.number({min:1, max:9})}`;
    const data =  JSON.stringify({id: `${faker.random.number({min:1, max:100})}`}, null, '\t');

    return {
      identifier: vuln_id,
      severity: args.hasOwnProperty('severity') ? args.severity : severity,
      source: args.hasOwnProperty('source') ? args.source : source,
      severityScore: severityScore,
      associatedPackage: associatedPackage,
      description,
      links,
      data
    };
};

mocks.ProblemMutation = (schema) => {
    return Array.from({
        length: faker.random.number({
            min: 1,
            max: 500,
        }),
    }).map(() => {
        let temp = schema();
        return (
            `problem${faker.random.number(1000000)}: addProblem(input: ${JSON.stringify(temp, 2, null)}) { identifier }`
        );
    });
};

//
// Query 'type' mock from typeDefs.
//
mocks.Query = () => ({
  me: () => mocks.Me(),
  userBySshKey: () => mocks.User(),
  projectByName: () => mocks.Project(),
  groupByName: () => mocks.Group(),
  projectByGitUrl: () => mocks.Project(),
  projectsByMetadata: () => mocks.Project(),
  environmentByName: () => mocks.Environment(),
  environmentByOpenshiftProjectName: () => mocks.Environment(),
  environmentWithBackup: () => () => mocks.Environment(null, { backups: [
    mocks.Backup(null, { environment: {} }),
  ]}),
  environmentWithBackups: () => mocks.Environment(null, { project: mocks.Project()}),
  environmentWithFacts: () => mocks.Environment(),
  environmentWithTask: ({projectName, envName}) => mocks.Environment(null, {
    name: envName,
    project: {
      name: projectName,
      problemsUi: true,
      factsUi: true
    },
    deployments: {}, problems: {}, facts: {}, environment: {},
    tasks: [ mocks.Task(null, { id: 1, environment: {} }) ]
  }),
  environmentWithTasks: () => mocks.Environment(null, {
    deployments: {}, problems: {}, facts: {}, environment: {}
  }),
  environmentWithDeployment: ({projectName, envName}) => mocks.Environment(null, {
    name: envName,
    project: {
      name: projectName,
      problemsUi: true,
      factsUi: true
    },
    tasks: {}, problems: {}, facts: {}, environment: {},
    deployments: [ mocks.Deployment() ]
  }),
  environmentWithDeployments: () => mocks.Environment(null, { deployments: [
    mocks.Deployment(null, { environment: { openshiftProjectName: "high-cotton-master" }}),
    mocks.Deployment(null, { environment: { openshiftProjectName: "high-cotton-master" }})
  ]}),
  deploymentByRemoteId: () => mocks.Deployment(),
  taskByRemoteId: () => mocks.Task(),
  allProjectsFromFacts: () => [{
    count: 4,
    projects: [
      mocks.Project(null, { environments: []}),
      mocks.Project(null, { environments: [
        mocks.Environment(null, { name: 'master', facts: [
          mocks.Fact(null, { name: "laravel", value: "7.0.12", source: "laravel-version", category: "Framework", keyFact: true} ),
          mocks.Fact(null, { name: "php-version", value: "7.1", source: "php-version", category: "Programming language", keyFact: true} ),
          mocks.Fact(null, { name: "site-code-status", value: '200', source: "curl", category: "Performance", keyFact: true} )
        ]})
      ]}),
      mocks.Project(null, { environments: [
        mocks.Environment(null, { name: 'master', facts: [
          mocks.Fact(null, { name: "express", value: "4.16.4", source: "npm", category: "Framework", keyFact: true} ),
          mocks.Fact(null, { name: "node-js", value: "16.0.1", source: "node-version", category: "Programming language", keyFact: true} ),
          mocks.Fact(null, { name: "site-code-status", value: '503', source: "curl", category: "Performance", keyFact: true} )
        ]})
      ]}),
      mocks.Project()
    ]
  }],
  allProjects: () => [
    mocks.Project(),
    mocks.Project(),
    mocks.Project(),
    mocks.Project(),
    mocks.Project()
  ],
  allOpenshifts: () => new MockList(9),
  allProblems: () => new MockList(20),
  allEnvironments: (parent, args = {}, context, info) => {
    const project = args.hasOwnProperty('project')
      ? args.project
      : mocks.Project(null, {environments: []});
    return [
      mocks.Environment(null, {project, name: 'master'}),
      mocks.Environment(null, {project, name: 'staging'}),
      mocks.Environment(null, {project, name: 'development'}),
      mocks.Environment(null, {project, name: 'pr-' + faker.random.number({min: 1, max: 50})}),
      mocks.Environment(null, {project, name: 'pr-' + faker.random.number({min: 51, max: 100})}),
      mocks.Environment(null, {project, name: 'pr-' + faker.random.number({min: 101, max: 150})}),
    ];
  },
  allGroups: () => new MockList(9),
  allProjectsInGroup: () => new MockList(5),
});

//
// Mutation 'type' mock from typeDefs.
// @TODO These mutations have not been tested and may need refactoring.
//
mocks.Mutation = () => ({
  addOrUpdateEnvironment: () => mocks.Environment(),
  updateEnvironment: () => mocks.Environment(),
  deleteEnvironment: () => faker.random.arrayElement(['success', `Error: unknown deploy type ${mocks.DeployType()}`]),
  deleteAllEnvironments: () => 'success',
  addOrUpdateEnvironmentStorage: () => mocks.EnvironmentStorage(),
  addNotificationSlack: () => mocks.NotificationSlack(),
  updateNotificationSlack: () => mocks.NotificationSlack(),
  deleteNotificationSlack: () => faker.random.arrayElement(['success', "Can't delete notification linked to projects"]),
  deleteAllNotificationSlacks: () => 'success',
  addNotificationRocketChat: () => mocks.NotificationRocketChat(),
  updateNotificationRocketChat: () => mocks.NotificationRocketChat(),
  deleteNotificationRocketChat: () => faker.random.arrayElement(['success', "Can't delete notification linked to projects"]),
  deleteAllNotificationRocketChats: () => 'success',
  addNotificationMicrosoftTeams: () => mocks.NotificationMicrosoftTeams(),
  updateNotificationMicrosoftTeams: () => mocks.NotificationMicrosoftTeams(),
  deleteNotificationMicrosoftTeams: () => faker.random.arrayElement(['success', "Can't delete notification linked to projects"]),
  deleteAllNotificationMicrosoftTeams: () => 'success',
  addNotificationEmail: () => mocks.NotificationEmail(),
  updateNotificationEmail: () => mocks.NotificationEmail(),
  deleteNotificationEmail: () => faker.random.arrayElement(['success', "Can't delete notification linked to projects"]),
  deleteAllNotificationEmails: () => 'success',
  addNotificationToProject: () => mocks.Project(),
  removeNotificationFromProject: () => mocks.Project(),
  removeAllNotificationsFromAllProjects: () => 'success',
  addOpenshift: () => mocks.Openshift(),
  updateOpenshift: () => mocks.Openshift(),
  deleteOpenshift: () => 'success',
  deleteAllOpenshifts: () => 'success',
  addProject: () => mocks.Project(),
  updateProject: () => mocks.Project(),
  deleteProject: () => 'success',
  deleteAllProjects: () => 'success',
  addSshKey: () => mocks.SshKey(),
  updateSshKey: () => mocks.SshKey(),
  deleteSshKey: () => 'success',
  deleteSshKeyById: () => 'success',
  deleteAllSshKeys: () => 'success',
  removeAllSshKeysFromAllUsers: () => 'success',
  addUser: () => mocks.User(),
  updateUser: () => mocks.User(),
  deleteUser: () => 'success',
  deleteAllUsers: () => 'success',
  addDeployment: () => mocks.Deployment(),
  deleteDeployment: () => 'success',
  updateDeployment: () => mocks.Deployment(),
  cancelDeployment: () => faker.random.arrayElement(['success', 'Deployment not cancelled, reason: Too slow.']),
  addBackup: () => mocks.Backup(),
  deleteBackup: () => 'success',
  deleteAllBackups: () => 'success',
  addRestore: () => mocks.Restore(),
  updateRestore: () => mocks.Restore(),
  addEnvVariable: () => mocks.EnvKeyValue(),
  deleteEnvVariable: () => 'success',
  addTask: () => mocks.Task(),
  taskDrushArchiveDump: () => mocks.Task(),
  taskDrushSqlDump: () => mocks.Task(),
  taskDrushCacheClear: () => mocks.Task(),
  taskDrushCron: () => mocks.Task(),
  taskDrushSqlSync: () => mocks.Task(),
  taskDrushRsyncFiles: () => mocks.Task(),
  deleteTask: () => 'success',
  updateTask: () => mocks.Task(),
  setEnvironmentServices: () => [ mocks.EnvironmentService() ],
  uploadFilesForTask: () => mocks.Task(),
  deleteFilesForTask: () => 'success',
  deployEnvironmentLatest: () => 'success',
  deployEnvironmentBranch: () => 'success',
  deployEnvironmentPullrequest: () => 'success',
  deployEnvironmentPromote: () => 'success',
  switchActiveStandby: () => 'success',
  addGroup: () => mocks.Group(),
  updateGroup: () => mocks.Group(),
  deleteGroup: () => 'success',
  deleteAllGroups: () => 'success',
  addUserToGroup: () => mocks.Group(),
  removeUserFromGroup: () => mocks.Group(),
  addGroupsToProject: () => mocks.Project(),
  removeGroupsFromProject: () => mocks.Project(),
});

//
// Subscription 'type' mock from typeDefs.
// @TODO These subscriptions don't work.
// Possible resources for fixing:
// https://www.apollographql.com/docs/react/data/subscriptions/
// https://spectrum.chat/apollo/subscriptions/how-to-test-component-with-subscribetomore~815325bc-bb27-4d5d-a27f-0788b256e382
//
mocks.Subscription = () => ({
  backupChanged: () => mocks.Backup(),
  deploymentChanged: () => mocks.Deployment(),
  taskChanged: () => mocks.Task(),
});

export default mocks;
