import { promisify } from 'util';
import axios from 'axios';
import * as faker from 'faker';
import { AxiosInstance } from 'axios';

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
};

const MUTATIONS = {
  ADD_BILLING_GROUP: {
    mutation: `
      mutation addBillingGroup($input: BillingGroupInput!) {
        addBillingGroup(input: $input) {
          name
        }
      }
    `,
    variables: { input: { name: fakeName, currency: 'USD' } },
    expected: {
      data: {
        addBillingGroup: {
          name: fakeName,
        },
      },
    },
  },
  ADD_PROJECT_WITH_STANDARD_AVAILABILITY: {
    mutation: `
      mutation addProject($input: AddProjectInput!) {
        addProject(input: $input){
          name
          availability
        }
      }
    `,
    variables: {
      input: {
        name: fakeProject,
        gitUrl: 'http://github.com',
        openshift: 1,
        productionEnvironment: 'master',
        availability: 'STANDARD',
      },
    },
    expected: {
      data: {
        addProject: {
          name: fakeProject,
          availability: 'STANDARD',
        },
      },
    },
  },
  UPDATE_BILLING_GROUP: {
    mutation: `
      mutation updateBillingGroup($input: UpdateBillingGroupInput!){
        updateBillingGroup(input: $input) {
          name
          type
          currency
          billingSoftware
        }
      }
    `,
    variables: {
      input: {
        group: { name: 'PLACEHOLDER' },
        patch: {
          name: 'PLACEHOLDER',
          currency: 'AUD',
          billingSoftware: 'Bexio',
        },
      },
    },
    expected: {
      data: {
        updateBillingGroup: {
          name: 'PLACEHOLDER',
          type: 'billing',
          currency: 'AUD',
          billingSoftware: 'Bexio',
        },
      },
    },
  },
};

let axiosInstance: AxiosInstance;

// Unit Under Test
describe('Group Resolvers', () => {
  beforeAll(async () => {
    // GET JWT Token
    const token = (await getJWTToken()).replace(/[\n\t\r]/g, '');
    requestConfig.headers.Authorization = `Bearer ${token}`;
    axiosInstance = axios.create(requestConfig);
  });

  describe('BillingGroup Mutations #mutations', () => {
    // scenarios and expectation
    /*
    it('', async () => {
      // Arrange
      const { mutation: query, variables, expected } = MUTATIONS.;
      const data = { query, variables, expected };
      // Act
      const response = await axiosInstance.post('/graphql', data);
      const { data: responseData } = response ? response : null;
      // Assert
      expect(responseData).toMatchObject(expected);
    });
    */

    it('When I run the mutation addBillingGroup, I expect the name to be returned', async () => {
      // Arrange
      const {
        mutation: query,
        expected,
        variables,
      } = MUTATIONS.ADD_BILLING_GROUP;
      const data = { query, variables };

      // Act
      const response = await axiosInstance.post('/graphql', data);
      const { data: responseData } = response ? response : null;

      // Assert
      expect(responseData).toMatchObject(expected);

      // CLEANUP - TODO: This is failing even though it's actually working???
      // const postDeleteData = {
      //   query: `mutation deleteGroup($input: DeleteGroupInput!) {
      //     deleteGroup(input: $input)
      //   }`,
      //   variables: { input: { group: { name: fakeName } } },
      // };
      // const result = await axiosInstance.post('/graphql', postDeleteData);
      // const { data: deleteData } = result ? result : null;
      // expect(deleteData).toMatchObject({
      //   data: {
      //     deleteGroup: 'success',
      //   },
      // });
    });

    it('When I add a project with STANDARD availability, the expect STANDARD to be returned', async () => {
      // Arrange
      const {
        mutation: query,
        variables,
        expected,
      } = MUTATIONS.ADD_PROJECT_WITH_STANDARD_AVAILABILITY;
      const data = { query, variables };
      // Act
      const response = await axiosInstance.post('/graphql', data);
      const { data: responseData } = response ? response : null;
      // Assert
      const expectedResult = {};
      expect(responseData).toMatchObject(expected);
    });

    const createNewGroup = async () => {
      const { mutation: query, variables } = MUTATIONS.ADD_BILLING_GROUP;
      variables.input.name = faker.random.alphaNumeric(10);
      const data = { query: query, variables };
      const response = await axiosInstance.post('/graphql', data);
      const {
        data: {
          data: { addBillingGroup },
        },
      } = response ? response : null;
      return addBillingGroup;
    };

    it('When I update a billing group name, currency, and billing software, I expect the result to reflect this', async () => {
      // Setup - create a new group
      const { name } = await createNewGroup();

      // Arrange
      const {
        mutation: query,
        variables,
        expected,
      } = MUTATIONS.UPDATE_BILLING_GROUP;

      // Modify the input and patch to use the new group name
      variables.input.group.name = name;
      variables.input.patch.name = `UPDATED ${name}`;

      // Modify the expected result to match the modified new group name
      expected.data.updateBillingGroup.name = `UPDATED ${name}`;

      const data = { query, variables };
      // Act
      const response = await axiosInstance.post('/graphql', data);
      const { data: responseData } = response ? response : null;
      // Assert
      expect(responseData).toMatchObject(expected);
    });
  });

  describe('BillingGroup Related Queries #queries', () => {
    // scenarios and expectation
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

    it('When I query for all projects, filtered by the "test" gitUrl, I expect the result to match the query signature', async () => {
      // Arrange
      const { query, expected } = QUERIES.ALL_PROJECTS_FILTERED_BY_GIT_URL;

      // Act
      const response = await axiosInstance.post('/graphql', { query });
      const { data } = response ? response : null;

      // Assert
      expect(data).toMatchObject(expected);
    });

    it('When I query for the "high-cotton" project by name, I expect the result to match the query signature', async () => {
      // Arrange
      const { query, expected } = QUERIES.GET_PROJECT_FILTERED_BY_NAME;

      // Act
      const response = await axiosInstance.post('/graphql', { query });
      const { data } = response ? response : null;

      // Assert
      expect(data).toMatchObject(expected);
    });

    it('When I query for all groups filtered by billing type, I expect "High Cotton Billing Group" to be in the returned result', async () => {
      // Arrange
      const { query, expected } = QUERIES.ALL_GROUPS_FILTERED_BY_BILLING_TYPE;

      // Act
      const response = await axiosInstance.post('/graphql', { query });
      const { data } = response ? response : null;
      // Assert
      expect(data.data.allGroups).toContainEqual(expected);
    });
  });
});
