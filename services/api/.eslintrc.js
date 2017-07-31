module.exports = {
  extends: ['airbnb-base', 'plugin:flowtype/recommended'],
  plugins: ['flowtype'],
  env: { es6: true, jest: true, node: true },
  rules: {
    // Rule to require trailing commas. We disable the dangling function commas because we are targeting Node.js 8, which does not have this feature yet.
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      },
    ],
    // Rule to enforce function return types. We disable this because Flow will check our function return types.
    'consistent-return': 'off',
    // Code style rule to enforce import ordering. We disable this because we use absolute imports for types sometimes after relative imports.
    'import/first': 'off',
    // Code style rule to prefer a default export instead of a single named export, currently we disable this to allow this behavior. We can decide later to turn this on again if we want.
    'import/prefer-default-export': 'off',
    // Prettier works better with its default 80 character max-length
    'max-len': 'off',
    // Rule to restrict usage of confusing code style with mixed boolean operators. We disable this because Prettier removes "unnecessary parentheses" here and breaks this.
    'no-mixed-operators': 'off',
    // Rule to prevent prefixing of underscores on variable names. We disable this because we use some underscore prefixes in our code.
    'no-underscore-dangle': 'off',
  },
};
