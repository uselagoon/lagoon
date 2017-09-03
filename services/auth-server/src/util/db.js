// @flow

/* eslint-disable no-console */

const nano = require('nano');
const logger = require('../logger');

const couch = nano('http://auth-database:5984');
const database = couch.use('auth');

couch.db.create('auth', error => {
  if (!error) {
    logger.debug('Authentication database created.');
  } else {
    logger.debug('Authentication database already exists.');
  }

  database.insert(
    {
      views: {
        by_token: {
          map: 'function(doc) { emit(doc.token, doc) }',
        },
      },
    },
    '_design/auth'
  );
});

function insert(
  doc: Object,
  params?: string | Object | null = null
): Promise<Object> {
  return new Promise((resolve, reject) => {
    database.insert(doc, params, (error, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

function destroy(id: string, rev: string): Promise<Object> {
  return new Promise((resolve, reject) => {
    database.destroy(id, rev, (error, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

function get(id: string): Promise<Object> {
  return new Promise((resolve, reject) => {
    database.get(id, (error, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

function view(design: string, name: string, values: Object): Promise<Object> {
  return new Promise((resolve, reject) => {
    database.view(design, name, values, (error, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

module.exports = {
  insert,
  destroy,
  get,
  view,
};
