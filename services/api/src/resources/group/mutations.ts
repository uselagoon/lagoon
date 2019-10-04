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

export default {
  ADD_PROJECT,
  ADD_BILLING_GROUP,
  UPDATE_BILLING_GROUP,
  DELETE_BILLING_GROUP,
  ADD_PROJECT_TO_BILLING_GROUP,
  UPDATE_PROJECT_BILLING_GROUP,
  REMOVE_PROJECT_FROM_BILLING_GROUP,
};
