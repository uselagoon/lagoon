#!/usr/bin/env node

// Load environment variables from .env file.
require('dotenv-extended').config();

const fs = require('fs');
const path = require('path');
const request = require('sync-request');
const introspectionQuery = `{
  __schema {
    types {
      kind
      name
      possibleTypes {
        name
      }
    }
  }
}`;

const response = request('POST', process.env.API, {
  qs: { query: introspectionQuery },
});
const result = JSON.parse(response.body.toString('utf-8'));
const file = path.resolve(process.cwd(), 'app', 'shared', 'introspection.json');
fs.writeFileSync(file, JSON.stringify(result.data), 'utf-8');
