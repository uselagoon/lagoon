import { promisify } from 'util';
import axios, { AxiosResponse, AxiosInstance } from 'axios';
import { BillingModifier } from '../../models/billing';
import { GroupInput, BillingGroup } from '../../models/group';
import { BillingModifierInput } from './resolvers';

const exec = promisify(require('child_process').exec);

let axiosInstance: AxiosInstance;

const requestConfig = (token) => ({
  baseURL: 'http://localhost:3000',
  timeout: 60000,
  headers: {
    Authorization:
    `Bearer ${token}`,
    'content-type': 'application/json'
  }
});

const getJWTToken = async () => {
  try {
    const { stdout: jwtToken, stderr } = await exec(
      'docker-compose exec -T auto-idler /create_jwt.py',
    );
    if (stderr) {
      // throw stderr;
      console.error(stderr);
    }
    return jwtToken;
  } catch (err) {
    console.error(err);
  }
};


export const initializeGraphQL = async () => {
  // GET JWT Token
  const token = (await getJWTToken()).replace(/[\n\t\r]/g, '');
  const config = requestConfig(token);
  axiosInstance = axios.create(config);
  return axiosInstance;
}


type DataResult = {
  data: {
    allBillingModifiers: [BillingModifier];
    addBillingModifier: BillingModifier;
    updateBillingModifier: BillingModifier;
    deleteBillingModifier: String;
    addBillingGroup: BillingGroup;
  };
  errors?: any;
  // [key: string]: Project | Group;
};

type AxiosResponseGraphQL = Promise<AxiosResponse<DataResult>>;
type AxiosGraphQL = (query: String, variables?: any) => AxiosResponseGraphQL;

const graphql: AxiosGraphQL = async (query: String, variables?: any) => {
  if (!axiosInstance){
    await initializeGraphQL()
  }
  return axiosInstance.post('/graphql', {
    query,
    ...(variables ? { variables } : {})
  });
}


const BILLING_MODIFIER_FIELDS = 'id, group { id, name, type }, startDate, endDate, discountFixed, discountPercentage, extraFixed, extraPercentage, min, max, customerComments, adminComments';

const ADD_BILLING_MODIFIER = `
  mutation addBillingModifier($input: AddBillingModifierInput!) {
    addBillingModifier(input: $input){
      ${BILLING_MODIFIER_FIELDS}
    }
  }
`;
const UPDATE_BILLING_MODIFIER = `
  mutation updateBillingModifier($input: UpdateBillingModifierInput!) {
    updateBillingModifier(input: $input){
      ${BILLING_MODIFIER_FIELDS}
    }
  }
`;
const DELETE_BILLING_MODIFIER = `
  mutation deleteBillingModifier($input: DeleteBillingModifierInput!) {
    deleteBillingModifier(input: $input)
  }
`;

const DELETE_ALL_BILLING_MODIFIERS = `
mutation deleteAllBillingModifiers($input: GroupInput!){
  deleteAllBillingModifiersByBillingGroup(input: $input)
}
`

const ALL_BILLING_MODIFIERS = `
  query allBillingModifiers($input: GroupInput!, $month: String) {
    allBillingModifiers(input: $input, month: $month){
      ${BILLING_MODIFIER_FIELDS}
    }
  }
`;

const ADD_BILLING_GROUP = `
mutation addBillingGroup($input: BillingGroupInput!) {
  addBillingGroup(input: $input) {
    name
  }
}
`;

export const addBillingModifier = ( billingModifier: BillingModifierInput) => graphql(ADD_BILLING_MODIFIER, { input: billingModifier });
export const updateBillingModifier = (id: Number, patch: BillingModifier) => graphql(UPDATE_BILLING_MODIFIER, { input: {id, patch } })
export const deleteBillingModifier = (id: Number) => graphql(DELETE_BILLING_MODIFIER, { input : { id } });
export const deleteAllBillingModifiers = (group: GroupInput) => graphql(DELETE_ALL_BILLING_MODIFIERS, { input : group });
export const allBillingModifiers = (group: GroupInput, month?: string) => graphql(ALL_BILLING_MODIFIERS, { input : group, month });

export const addBillingGroup = (billingGroup: BillingGroup) => graphql(ADD_BILLING_GROUP, { input: billingGroup });