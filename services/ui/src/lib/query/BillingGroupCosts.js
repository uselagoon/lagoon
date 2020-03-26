import gql from 'graphql-tag';

export default gql`
  query billingGroupCosts($input: GroupInput, $month: String!) {
    costs: billingGroupCost(input: $input, month: $month)
  }
`;
