import {
  GraphQLScalarType,
  Kind,
} from 'graphql';

export default new GraphQLScalarType({
  name: 'Json',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => // eslint-disable-line no-confusing-arrow
    ast.kind === Kind.STRING ? JSON.parse(ast.value) : null,
});
