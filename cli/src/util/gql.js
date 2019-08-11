// @flow

// A no-op tagged template function to mark strings as GraphQL for tooling
export default function gql(
  literals: Array<string>,
  ...substitutions: Array<any>
) {
  let result = '';

  // run the loop only for the substitution count
  substitutions.forEach((substitution, key) => {
    result += literals[key];
    result += substitution;
  });

  // add the last literal
  result += literals[literals.length - 1];

  return result;
}
