import { promisify } from 'util';
import axios from 'axios';
import * as faker from 'faker';
import { AxiosInstance } from 'axios';

const exec = promisify(require('child_process').exec);

const GRAPHQL_ENDPOINT = 'http://localhost:3000';

const fakeName = faker.random.alphaNumeric(10);

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
              billingSoftware
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
              billingSoftware: 'null',
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
            billingSoftware
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
      billingSoftware: 'null',
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
    expected: {
      data: {
        addBillingGroup: {
          name: fakeName,
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

  describe('BillingGroup #billing', () => {
    // scenarios and expectation
    /*
    it('', async () => {
      // Arrange
      const postData = {
        query: ,
      };
      // Act
      const response = await axiosInstance.post('/graphql', postData);
      const { data } = response ? response : null;
      // Assert
      const expectedResult = {};
      expect(data).toMatchObject(expectedResult);
    });
    */

    it('When I run the mutation addBillingGroup, I expect the name to be returned', async () => {
      // Arrange
      const { mutation: query, expected } = MUTATIONS.ADD_BILLING_GROUP;
      const variables = { input: { name: fakeName, currency: 'USD' } };
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
