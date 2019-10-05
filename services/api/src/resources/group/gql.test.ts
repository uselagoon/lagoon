export const ADD_PROJECT = `
mutation addProject($input: AddProjectInput!) {
  addProject(input: $input){
    name
    availability
  }
}
`;

export const ADD_BILLING_GROUP = `
mutation addBillingGroup($input: BillingGroupInput!) {
  addBillingGroup(input: $input) {
    name
  }
}
`;

export const UPDATE_BILLING_GROUP = `
mutation updateBillingGroup($input: UpdateBillingGroupInput!){
  updateBillingGroup(input: $input) {
    name
    type
    currency
    billingSoftware
  }
}
`;

export const DELETE_BILLING_GROUP = `
mutation deleteGroup($input: DeleteGroupInput!) {
  deleteGroup(input: $input)
}
`;

export const ADD_PROJECT_TO_BILLING_GROUP = `
mutation addProjectToBillingGroup($input: ProjectBillingGroupInput){
  addProjectToBillingGroup(input: $input){
    name
    groups {
      name
    }
  }
}
`;

export const UPDATE_PROJECT_BILLING_GROUP = `
mutation updateProjectBillingGroup($input: ProjectBillingGroupInput) {
  updateProjectBillingGroup(input: $input){
    id
    name
    groups{
      ...on BillingGroup {
        name
      }
    }
  }
}
`;

export const REMOVE_PROJECT_FROM_BILLING_GROUP = `
mutation removeProjectFromBillingGroup($input: ProjectBillingGroupInput) {
  removeProjectFromBillingGroup(input: $input){
    id
    name
    groups{
      name
      id
    }
  }
}
`;

export const ALL_PROJECTS = `
query allProjects($createdAfter:String, $gitUrl:String, $order: ProjectOrderType) {
  allProjects(createdAfter:$createdAfter, gitUrl:$gitUrl, order:$order){
    name
    availability
    gitUrl
  }
}
`;

export const PROJECT_BY_NAME = `
query projectByName($name:String!) {
  projectByName(name:$name){
    name
  }
}
`;

export const ALL_GROUPS = `
query allGroups($name: String, $type: String) {
  allGroups(name: $name, type: $type){
    name
    type
    ...on BillingGroup {
      currency
    }
  }
}
`;

export const ALL_PROJECTS_IN_GROUP = `
query allProjectsInGroup($input: GroupInput) {
  allProjectsInGroup(input: $input){
    name
  }
}
`;

export const DELETE_PROJECT = `
mutation deleteProject($input:DeleteProjectInput!){
  deleteProject(input:$input)
}`;

export const BILLING_GROUP_COST = `
query billingGroupCost($input: GroupInput, $month: String) {
  billingGroupCost(input: $input, month: $month)
}
`;

// This is here because I wanted the above queries refactored out of the actual test file
// TODO: MOVE THE ABOVE GRAPHQL QUERIES/MUTATIONS SOMEWHERE ELSE
describe('Testing the Big Questions', () => {
  test('What is the meaning of life?', () => {
    const THE_MEANING_OF_LIFE = 42;
    expect(THE_MEANING_OF_LIFE).toBe(42);
  });
});
