// @flow

/* eslint-disable no-console */

import nano from 'nano';
import logger from '../logger';

const couch = nano('http://auth_database:5984');
const database = couch.use('auth');

couch.db.create('auth', error => {
  if (!error) {
    logger.debug('Authentication database created.');
  } else {
    logger.debug('Authentication database already exists.');
  }
});

database.insert(
  {
    views: {
      by_token: {
        map: (doc => emit(doc.token, doc)).toString(),
      },
    },
  },
  '_design/auth',
);

export function insert(
  doc: Object,
  params?: string | Object | null = null,
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

export function destroy(id: string, rev: string): Promise<Object> {
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

export function get(id: string): Promise<Object> {
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

export function view(
  design: string,
  view: string,
  values: Object,
): Promise<Object> {
  return new Promise((resolve, reject) => {
    database.view(design, view, values, (error, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}
