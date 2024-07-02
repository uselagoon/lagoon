import { unless, is, isNil, isEmpty, partialRight, complement } from 'ramda';
import http from 'http';
import querystring from 'querystring';
import { getConfigFromEnv } from './config';

export const isNumber = is(Number);
export const isArray = is(Array);

export const toNumber = (input: string | number): number =>
  unless(isNumber, partialRight(parseInt, [10]), input) as number;

export const notArray = complement(isArray);
export const isNotNil = complement(isNil);
export const isNotEmpty = complement(isEmpty);

export const asyncPipe = (...functions) => input =>
  functions.reduce((chain, func) => chain.then(func), Promise.resolve(input));

export const jsonMerge = function(a, b, prop) {
  var reduced = a.filter(function(aitem) {
    return !b.find(function(bitem) {
      return aitem[prop] === bitem[prop];
    });
  });
  return reduced.concat(b);
}

// will return only what is in a1 that isn't in a2
// eg:
// a1 = [1,2,3,4]
// a2 = [1,2,3,5]
// arrayDiff(a1,a2) = [4]
export const arrayDiff = (a:Array<any>, b:Array<any>) =>  a.filter(e => !b.includes(e));

// helper that will use the crypto handler service to check if a public or private key is valid or not
export async function validateKey(key, type) {
  const data = querystring.stringify({'key': key});
  const options = {
      hostname: getConfigFromEnv("SIDECAR_HANDLER_HOST", "localhost"),
      port: 3333,
      path: `/validate/${type}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      },
  };
  let p = new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
          res.setEncoding('utf8');
          let responseBody = '';

          res.on('data', (chunk) => {
              responseBody += chunk;
          });

          res.on('end', () => {
              resolve(JSON.parse(responseBody));
          });
      });
      req.on('error', (err) => {
          reject(err);
      });
      req.write(data)
      req.end();
  });
  return await p;
}

// helper that will use the crypto handler service to generate a private key with associated public key
export async function generatePrivateKey() {
  const options = {
      hostname: getConfigFromEnv("SIDECAR_HANDLER_HOST", "localhost"),
      port: 3333,
      path: '/generate/ed25519',
      method: 'GET',
  };
  let p = new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
          res.setEncoding('utf8');
          let responseBody = '';

          res.on('data', (chunk) => {
              responseBody += chunk;
          });

          res.on('end', () => {
              resolve(JSON.parse(responseBody));
          });
      });
      req.on('error', (err) => {
          reject(err);
      });
      req.end();
  });
  return await p;
}