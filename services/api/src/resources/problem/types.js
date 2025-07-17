import { GraphQLScalarType, GraphQLError } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Kind } from 'graphql/language';

const SeverityScoreType = new GraphQLScalarType({
  name: 'SeverityScore',
  description: 'Severity score is a numeric measure (0-1) of a problems severity',
  serialize: parseFloat,
  parseValue: parseFloat,
  parseLiteral(ast) {
    switch (ast.kind) {
      case(Kind.NULL): return null; break;
      case(Kind.INT): if(ast.value == 0 || ast.value == 1) {
          return ast.value;
      }
      break;
      case(Kind.FLOAT):
        if(ast.value >= 0 && ast.value <= 1) {
            return ast.value;
        }
    }
    throw new GraphQLError('Severity Score is invalid - should be a one place decimal between 0 and 1 or null');
  }
});

const types = {
  SeverityScoreType,
};

module.exports = types;