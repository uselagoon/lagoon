const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

// Let's use the default lagoon environment variables for creating a JWT
require('dotenv-extended').load({
  defaults: path.join(__dirname, '..', '..', '.env.defaults'),
});

const { createJWTWithoutSshKey } = require('@lagoon/commons/src/jwt');

const {
  buildClientSchema,
  introspectionQuery,
  printSchema,
} = require('graphql/utilities');

const jwtSecret = process.env.JWTSECRET || '';
const issuer = process.env.JWTISSUER || 'auth.amazee.io';
const audience = process.env.JWTAUDIENCE || 'api.amazee.io';

const payload = {
  sub: 'updateSchemaScript',
  aud: audience,
  iss: issuer,
  role: 'admin',
};

const jwt = createJWTWithoutSshKey({
  payload,
  jwtSecret,
});

const schemaDir = path.join(__dirname, '..', 'data');
const schemaPath = path.join(schemaDir, 'schema');

const SERVER = 'http://localhost:3000/graphql';

// Save JSON of full schema introspection for Babel Relay Plugin to use
fetch(`${SERVER}`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt}`,
  },
  body: JSON.stringify({ query: introspectionQuery }),
})
  .then((res) => {
    if (res.status !== 200) {
      console.error(res.statusText);
      console.error(res.status);
    } else {
      return res;
    }
  })
  .then(res => res.json())
  .then((schemaJSON) => {
    fs.writeFileSync(`${schemaPath}.json`, JSON.stringify(schemaJSON, null, 2));

    // Save user readable type system shorthand of schema
    const graphQLSchema = buildClientSchema(schemaJSON.data);
    fs.writeFileSync(`${schemaPath}.graphql`, printSchema(graphQLSchema));
  })
  .catch((err) => {
    console.error(err);
  });
