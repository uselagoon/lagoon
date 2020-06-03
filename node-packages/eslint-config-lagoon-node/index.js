// This is based on a simpler way of sharing ESLint configuration outlined here:
// https://github.com/eslint/eslint/issues/3458#issuecomment-376174514
module.exports = {
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      'eslint-import-resolver-typescript': true,
    },
  },
  extends: ['airbnb-base'],
  plugins: ['typescript'],
  env: { es6: true, jest: true, node: true },
  rules: {
    // TODO: Flow is gone, do we need this?
    // Disable 'arrow-parens': ['error', 'as-needed'] Airbnb stylistic rule for Flow types in comments in single-parameter functions (in the API). This does not cause a regression either, because Prettier will remove other parentheses when it can.
    'arrow-parens': 'off',
    // Disable Airbnb stylistic rule because we communicate with services with snake case
    camelcase: 'off',
    // TODO: Flow is gone, do we need this?
    // Rule to enforce function return types. We disable this Airbnb setting because Flow will check our function return types.
    'consistent-return': 'off',
    // Fix issue with the way Prettier formats function calls
    'function-paren-newline': 'off',
    // Disable Airbnb stylistic rule
    'global-require': 'off',
    // Code style rule to enforce import ordering. We disable this Airbnb setting because we use absolute imports for types sometimes after relative imports.
    'import/first': 'off',
    // Fix the erroring of dev dependencies in updateSchema script
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.test.js', '**/scripts/*.js'],
      },
    ],
    // Code style rule to prefer a default export instead of a single named export, currently we disable this Airbnb setting to allow this behavior. We can decide later to turn this on again if we want.
    'import/prefer-default-export': 'off',
    // Prettier works better with its default 80 character max-length
    'max-len': 'off',
    // Disable Airbnb stylistic rule
    'no-await-in-loop': 'off',
    // Conflicts with Prettier's stripping of unnecessary parentheses
    'no-confusing-arrow': 'off',
    // Disable Airbnb rule
    'no-console': 'off',
    // Rule to restrict usage of confusing code style with mixed boolean operators. We disable this Airbnb setting because Prettier removes "unnecessary parentheses" here and breaks this.
    'no-mixed-operators': 'off',
    // Disable Airbnb stylistic rule
    'no-multi-assign': 'off',
    // Disable Airbnb stylistic rule
    'no-param-reassign': 'off',
    // Disable Airbnb stylistic rule
    'no-plusplus': 'off',
    // Disable Airbnb stylistic rule
    'no-restricted-globals': 'off',
    // Disable Airbnb stylistic rule
    'no-restricted-syntax': 'off',
    // Disable Airbnb stylistic rule
    'no-throw-literal': 'off',
    // Rule to prevent prefixing of underscores on variable names. We disable this Airbnb setting because we use some underscore prefixes in our code.
    'no-underscore-dangle': 'off',
    // Disable Airbnb stylistic rule
    'no-use-before-define': 'off',
    // Disable Airbnb stylistic rule
    'prefer-destructuring': 'off',
    // Disable Airbnb stylistic rule
    'prefer-promise-reject-errors': 'off',
    // Disable Airbnb stylistic rule
    radix: 'off',
  },
};
