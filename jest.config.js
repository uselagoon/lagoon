module.exports = {
  projects: [
    // Projects having their own config
    "services/api/commons",
    "services/webhook-handler",
    // Everything else (specified in object notation to avoid Jest duplicate config error)
    {
      testMatch: [
        "<rootDir>/!(cli|services/api/commons/|services/webhook-handler/){**/__tests__/**/*.js?(x),**/?(*.)(spec|test).js?(x)}"
      ],
      testPathIgnorePatterns: ["node_modules"]
    }
  ]
};
