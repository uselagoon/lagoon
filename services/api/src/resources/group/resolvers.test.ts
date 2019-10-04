import { promisify } from 'util';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as faker from 'faker';

const exec = promisify(require('child_process').exec);

const GRAPHQL_ENDPOINT = 'http://localhost:3000';

const fakeName = faker.random.alphaNumeric(10);
const fakeProject = faker.random.alphaNumeric(15);

const requestConfig = {
  baseURL: GRAPHQL_ENDPOINT,
  timeout: 20000,
  headers: {
    Authorization: '',
    'content-type': 'application/json',
  },
};

const getJWTToken = async () => {
  try {
    const { stdout: jwtToken, stderr } = await exec(
      'docker-compose exec -T auto-idler /create_jwt.sh',
    );
    if (stderr) {
      throw stderr;
    }
    return jwtToken;
  } catch (err) {
    console.error(err);
  }
};

// const createNewGroup = async () => {
//   const { query, variables } = MUTATIONS.addBillingGroup;
//   variables.input.name = faker.random.alphaNumeric(10);
//   const data = { query, variables };
//   const response = await axiosInstance.post('/graphql', data);
//   const {
//     data: {
//       data: { addBillingGroup },
//     },
//   } = response ? response : null;
//   return addBillingGroup;
// };

const QUERIES = {
  ALL_PROJECTS_FILTERED_BY_GIT_URL: {
    query: `
      query allProjects {
        allProjects(gitUrl:"test"){
          id
          gitUrl
          name
          availability
          groups{
            ...on BillingGroup {
              name
            }
          }
        }
      }
    `,
    expected: {
      data: {
        allProjects: [
          {
            id: 18,
            gitUrl: 'test',
            name: 'high-cotton',
            availability: 'HIGH',
            groups: [
              {
                name: 'High Cotton Billing Group',
              },
              {},
              {},
            ],
          },
        ],
      },
    },
  },
  GET_PROJECT_FILTERED_BY_NAME: {
    query: `
      query getProject {
        projectByName(name:"high-cotton"){
          id
          name
          availability
          groups{
            name
            ...on BillingGroup{
              name
              currency
            }
          }
        }
      }
    `,
    expected: {
      data: {
        projectByName: {
          id: 18,
          name: 'high-cotton',
          availability: 'HIGH',
          groups: [
            {
              name: 'High Cotton Billing Group',
              currency: 'USD',
            },
            {
              name: 'project-high-cotton',
            },
            {
              name: 'ui-customer',
            },
          ],
        },
      },
    },
  },
  ALL_GROUPS_FILTERED_BY_BILLING_TYPE: {
    query: `
      query allGroups {
        allGroups(type:"billing"){
          name
          type
          ...on BillingGroup {
            currency
          }
          projects{
            id
            name
          }
        }
      }
    `,
    expected: {
      name: 'High Cotton Billing Group',
      type: 'billing',
      currency: 'USD',
      projects: [
        {
          id: 18,
          name: 'high-cotton',
        },
      ],
    },
  },
  ALL_PROJECTS_IN_GROUP: {
    query: `
      query allProjectsInGroup($input:GroupInput) {
        allProjectsInGroup(input: $input){
          name
        }
      }
    `,
    variables: { input: { name: 'High Cotton Billing Group' } },
    expected: {
      data: {
        allProjectsInGroup: [
          {
            name: 'high-cotton',
          },
        ],
      },
    },
  },
  BILLING_GROUP_COST: {
    query: `
      query billingGroupCost($input: GroupInput, $month: String) {
        billingGroupCost(input: $input, month: $month)
      }
    `,
    variables: {
      input: { name: 'High Cotton Billing Group' },
      month: '2019-08',
    },
    expected: {
      data: {
        billingGroupCost: {
          currency: 'USD',
          availability: {
            high: {
              hitCost: 213.03,
              storageCost: 1.4,
              environmentCost: {
                prod: 206.68,
                dev: 0,
              },
              projects: [
                {
                  id: '18',
                  name: 'high-cotton',
                  availability: 'HIGH',
                  month: 7,
                  year: 2019,
                  hits: 343446,
                  storageDays: 197,
                  prodHours: 1488,
                  devHours: 744,
                  environments: {
                    '0': {
                      id: '3',
                      name: 'Master',
                      type: 'production',
                      hits: {
                        hits: 0,
                      },
                      storage: {
                        bytesUsed: null,
                        month: null,
                      },
                      hours: {
                        month: '2019-08',
                        hours: 0,
                      },
                    },
                    '1': {
                      id: '4',
                      name: 'Staging',
                      type: 'development',
                      hits: {
                        hits: 0,
                      },
                      storage: {
                        bytesUsed: null,
                        month: null,
                      },
                      hours: {
                        month: '2019-08',
                        hours: 0,
                      },
                    },
                    '2': {
                      id: '5',
                      name: 'Development',
                      type: 'development',
                      hits: {
                        hits: 0,
                      },
                      storage: {
                        bytesUsed: null,
                        month: null,
                      },
                      hours: {
                        month: '2019-08',
                        hours: 0,
                      },
                    },
                    '3': {
                      id: '6',
                      name: 'PR-175',
                      type: 'development',
                      hits: {
                        hits: 0,
                      },
                      storage: {
                        bytesUsed: null,
                        month: null,
                      },
                      hours: {
                        month: '2019-08',
                        hours: 0,
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  },
};

const ADD_PROJECT = `
mutation addProject($input: AddProjectInput!) {
  addProject(input: $input){
    name
    availability
  }
}
`;

const addNewProject = project =>
  graphql(ADD_PROJECT, {
    input: {
      name: 'PLACEHOLDER',
      gitUrl: 'http://github.com',
      openshift: 1,
      productionEnvironment: 'master',
      availability: 'STANDARD',
      ...project,
    },
  });

const ADD_BILLING_GROUP = `
mutation addBillingGroup($input: BillingGroupInput!) {
  addBillingGroup(input: $input) {
    name
  }
}
`;

const addNewBillingGroup = input =>
  graphql(ADD_BILLING_GROUP, {
    input: {
      name: 'PLACEHOLDER',
      currency: 'USD',
      ...input,
    },
  });

const UPDATE_BILLING_GROUP = `
mutation updateBillingGroup($input: UpdateBillingGroupInput!){
  updateBillingGroup(input: $input) {
    name
    type
    currency
    billingSoftware
  }
}
`;
const updateBillingGroup = (group, patch) =>
  graphql(UPDATE_BILLING_GROUP, {
    input: {
      group: { ...group },
      patch: { ...patch },
    },
  });

const DELETE_BILLING_GROUP = `
mutation deleteGroup($input: DeleteGroupInput!) {
  deleteGroup(input: $input)
}
`;

const ADD_PROJECT_TO_BILLING_GROUP = `
mutation addProjectToBillingGroup($input: ProjectBillingGroupInput){
  addProjectToBillingGroup(input: $input){
    name
    groups {
      name
    }
  }
}
`;

// const ADD_PROJECT_TO_BILLING_GROUP_SETUP = `
// mutation addProject($addProjectInput:AddProjectInput!, $addBillingGroupInput: BillingGroupInput!) {
//   addProject(input:$addProjectInput){
//     name
//     availability
//   }
//   addBillingGroup(input: $addBillingGroupInput) {
//     name
//   }
// }
// `;

const MUTATIONS = {
  updateBillingGroup: (fakeGroupName, fakeGroupNameUpdate) => ({
    query: UPDATE_BILLING_GROUP,
    variables: {
      input: {
        group: { name: fakeGroupName },
        patch: {
          name: fakeGroupNameUpdate,
          currency: 'AUD',
          billingSoftware: 'Bexio',
        },
      },
    },
    expected: {
      data: {
        updateBillingGroup: {
          name: fakeGroupNameUpdate,
          type: 'billing',
          currency: 'AUD',
          billingSoftware: 'Bexio',
        },
      },
    },
  }),
  deleteBillingGroup: fakeGroupName => ({
    query: DELETE_BILLING_GROUP,
    variables: { input: { group: { name: fakeGroupName } } },
    expected: {
      data: {
        deleteGroup: 'success',
      },
    },
  }),
  addProject: fakeProjectName => ({
    query: ADD_PROJECT,
    variables: {
      input: {
        name: fakeProjectName,
        gitUrl: 'http://github.com',
        openshift: 1,
        productionEnvironment: 'master',
        availability: 'STANDARD',
      },
    },
    expected: {
      data: {
        addProject: {
          name: fakeProjectName,
          availability: 'STANDARD',
        },
      },
    },
  }),
  addProjectToBillingGroup: (fakeProjectName, fakeGroupName) => ({
    query: ADD_PROJECT_TO_BILLING_GROUP,
    variables: {
      input: {
        project: { name: fakeProjectName },
        group: { name: fakeGroupName },
      },
    },
    expected: {
      data: {
        addProjectToBillingGroup: {
          name: fakeProjectName,
          groups: [
            { name: `project-${fakeProjectName}` },
            { name: fakeGroupName },
          ],
        },
      },
    },
  }),
  updateProjectBillingGroup: (fakeProjectName, fakeGroupName) => ({
    query: ``,
    variables: {},
    expected: {},
  }),
  removeProjectFromBillingGroup: (fakeGroupName, fakeProjectName) => ({
    query: ``,
    variables: {},
    expected: {},
  }),
};

let axiosInstance: AxiosInstance;

const graphql = (query: String, variables?) =>
  axiosInstance.post('/graphql', {
    query,
    ...(variables ? { variables } : {}),
  });

// Unit Under Test
describe('Billing Group Costs Related Queries & Mutation', () => {
  beforeAll(async () => {
    // GET JWT Token
    const token = (await getJWTToken()).replace(/[\n\t\r]/g, '');
    requestConfig.headers.Authorization = `Bearer ${token}`;
    axiosInstance = axios.create(requestConfig);
  });

  describe('BillingGroup Mutations #mutations', () => {
    // scenarios and expectation

    it('When I run the mutation addBillingGroup, I expect the name to be returned. #mutaion #addBillingGroup', async () => {
      // Arrange
      const fakeGroupName = faker.random.alphaNumeric(10);
      const expected = {
        data: {
          addBillingGroup: {
            name: fakeGroupName,
          },
        },
      };

      // Act
      const { data } = await addNewBillingGroup({ name: fakeGroupName });

      // Assert
      expect(data).toMatchObject(expected);

      // TODO - ADD GROUP TO CLEANUP ARRAY
    });

    it('When I update a billing group name, currency, and billing software, I expect the result to reflect this. #mutation #updateBillingGroup', async () => {
      // Arrange
      const fakeGroupName = faker.random.alphaNumeric(10);
      const fakeGroupNameUpdate = faker.random.alphaNumeric(10);
      await addNewBillingGroup({ name: fakeGroupName });

      const { query, variables, expected } = MUTATIONS.updateBillingGroup(
        fakeGroupName,
        fakeGroupNameUpdate,
      );

      // Act
      const response = await graphql(query, variables);
      const { data: responseData } = response ? response : null;
      // Assert
      expect(responseData).toMatchObject(expected);
    });

    it('When I delete a billing group, I expect it to go away. #mutation #deleteGroup', async () => {
      // Arrange
      const fakeGroupName = faker.random.alphaNumeric(10);
      await addNewBillingGroup({ name: fakeGroupName });
      const { query, variables, expected } = MUTATIONS.deleteBillingGroup(
        fakeGroupName,
      );

      // Act
      const response = await graphql(query, variables);
      const { data: responseData } = response ? response : null;

      // Assert
      expect(responseData).toMatchObject(expected);
    }, 30000);

    it('When I add a project with STANDARD availability, the expect STANDARD to be returned. #mutation #addProject', async () => {
      // Arrange
      const fakeProjectName = faker.random.alphaNumeric(10);
      const { query, variables, expected } = MUTATIONS.addProject(
        fakeProjectName,
      );

      // Act
      const response = await graphql(query, variables);
      const { data: responseData } = response ? response : null;

      // Assert
      expect(responseData).toMatchObject(expected);
    });

    it("When I add a project to a billing group, I should see that project returned in the billing groups' projects array. #mutation #addProjectToBillingGroup", async () => {
      // Arrange
      const fakeProjectName = faker.random.alphaNumeric(10);
      const fakeGroupName = faker.random.alphaNumeric(10);

      await addNewProject({ name: fakeProjectName });
      await addNewBillingGroup({ name: fakeGroupName });

      const { query, variables, expected } = MUTATIONS.addProjectToBillingGroup(
        fakeProjectName,
        fakeGroupName,
      );

      // Act
      const response = await graphql(query, variables);
      const { data: responseData } = response ? response : null;

      // sort the resulting group array otherwise the array order can throw off the test
      const nameSortFn = (a, b) => (a.name > b.name ? 1 : -1);
      responseData.data.addProjectToBillingGroup.groups.sort(nameSortFn);
      expected.data.addProjectToBillingGroup.groups.sort(nameSortFn);

      // Assert
      expect(responseData).toMatchObject(expected);
    });

    /*
    it("When I update the billing group associated to a project, I should see that project in the new billing group's projects. #mutation #updateProjectBillingGroup", async () => {
      // Arrange
      const fakeProjectName = faker.random.alphaNumeric(10);
      const fakeGroupName = faker.random.alphaNumeric(10);
      const fakeGroupUpdateName = faker.random.alphaNumeric(10);

      await addNewProject({ name: fakeProjectName });
      await addNewBillingGroup({ name: fakeGroupName });
      await addProjectToBillingGroup({ name: fakeGroupUpdateName });

      const {
        query,
        variables,
        expected,
      } = MUTATIONS.updateProjectbillingGroup(
        fakeProject,
        fakeGroupName,
        fakeGroupUpdateName,
      );

      // Act
      const response = await graphql(query, variables);
      const { data: responseData } = response ? response : null;

      // Assert
      expect(responseData).toMatchObject(expected);
    });
    */

    /*
    it("When I remove a project from a billing group, I shouldn't see that project in the billing group's project list. #mutation #removeProjectFromBillingGroup", async () => {
      // Arrange
      const fakeProjectName = faker.random.alphaNumeric(10);
      const fakeGroupName = faker.random.alphaNumeric(10);

      await addNewProject({ name: fakeProjectName });
      await addNewBillingGroup({ name: fakeGroupName });
      await addProjectToBillingGroup({
        project: fakeProjectName,
        group: fakeGroupName,
      });

      const {
        query,
        variables,
        expected,
      } = MUTATIONS.removeProjectFromBillinGroup();

      // Act
      const response = await graphql(query, variables);
      const { data: responseData } = response ? response : null;

      // Assert
      expect(responseData).toMatchObject(expected);
    });
    */
  });

  describe('BillingGroup Related Queries #queries', () => {
    // scenarios and expectation

    it('When I query for all projects, filtered by the "test" gitUrl, I expect the result to match the query signature. #query #allProjects', async () => {
      // Arrange
      const { query, expected } = QUERIES.ALL_PROJECTS_FILTERED_BY_GIT_URL;

      // Act
      const response = await graphql(query);
      const { data } = response ? response : null;

      // Assert
      expect(data).toMatchObject(expected);
    });

    it('When I query for the "high-cotton" project by name, I expect the result to match the query signature. #query #projectByName', async () => {
      // Arrange
      const { query, expected } = QUERIES.GET_PROJECT_FILTERED_BY_NAME;

      // Act
      const response = await axiosInstance.post('/graphql', { query });
      const { data } = response ? response : null;

      // Assert
      expect(data).toMatchObject(expected);
    });

    it('When I query for all groups filtered by billing type, I expect "High Cotton Billing Group" to be in the returned result. #query #allGroups', async () => {
      // Arrange
      const { query, expected } = QUERIES.ALL_GROUPS_FILTERED_BY_BILLING_TYPE;

      // Act
      const response = await axiosInstance.post('/graphql', { query });
      const { data } = response ? response : null;
      // Assert
      expect(data.data.allGroups).toContainEqual(expected);
    });

    it('When I query for all projects in a group, I expect the result to match the query signature. #query #allProjectsInGroup', async () => {
      // Arrange
      const { query, expected, variables } = QUERIES.ALL_PROJECTS_IN_GROUP;
      const data = { query, variables };

      // Act
      const response = await axiosInstance.post('/graphql', data);
      const { data: responseData } = response ? response : null;

      // Assert
      expect(responseData).toMatchObject(expected);
    });

    it('When I query for the billing group cost, I expect the result to match the test data for hits, storage, and environment hours. #query #billingGroupCost', async () => {
      // Arrange
      const { query, expected, variables } = QUERIES.BILLING_GROUP_COST;
      const data = { query, variables };

      // Act
      const response = await axiosInstance.post('/graphql', data);
      const { data: responseData } = response ? response : null;

      // Assert
      expect(responseData).toMatchObject(expected);
    });
  });
});

// QUERY TEMPLATE
/*
  it('', async () => {
    // Arrange
    const { query, expected } = QUERIES.

    // Act
    const response = await axiosInstance.post('/graphql', { query });
    const { data } = response ? response : null;

    // Assert
    expect(data).toMatchObject(expected);
  });
  */

// MUTATION TEMPLATE
/*
  it('', async () => {
    // Arrange
    const { query, variables, expected } = MUTATIONS.;
    const data = { query, variables };
    // Act
    const response = await axiosInstance.post('/graphql', data);
    const { data: responseData } = response ? response : null;
    // Assert
    expect(responseData).toMatchObject(expected);
  });
  */
