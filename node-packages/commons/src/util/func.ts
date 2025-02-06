import { unless, is, isNil, isEmpty, partialRight, complement } from 'ramda';
import { getConfigFromEnv } from './config';

export const isNumber = is(Number);
export const isArray = is(Array);

export const toNumber = (input: string | number): number =>
  unless(isNumber, partialRight(parseInt, [10]), input) as number;

export const notArray = complement(isArray);
export const isNotNil = complement(isNil);
export const isNotEmpty = complement(isEmpty);

export const asyncPipe =
  (...functions: any[]) =>
  (input: any) =>
    functions.reduce((chain, func) => chain.then(func), Promise.resolve(input));

export const jsonMerge = <T extends Record<string, any>>(
  a: T[],
  b: T[],
  prop: string,
) => {
  var reduced = a.filter(function (aitem) {
    return !b.find(function (bitem) {
      return aitem[prop] === bitem[prop];
    });
  });

  return reduced.concat(b);
};

// will return only what is in a1 that isn't in a2
// eg:
// a1 = [1,2,3,4]
// a2 = [1,2,3,5]
// arrayDiff(a1,a2) = [4]
export const arrayDiff = (a: Array<any>, b: Array<any>) =>
  a.filter((e) => !b.includes(e));

export const encodeBase64 = (data: string): string =>
  Buffer.from(data, 'utf8').toString('base64');

export const decodeBase64 = (data: string): string =>
  Buffer.from(data, 'base64').toString('utf8');

export const encodeJSONBase64 = (data: any): string =>
  encodeBase64(JSON.stringify(data));

export const decodeJSONBase64 = (data: string): any =>
  JSON.parse(decodeBase64(data));

interface PublicKeyResponse {
  error?: string;
  publickey?: string;
  type?: string;
  value?: string;
  sha256fingerprint?: string;
  md5fingerprint?: string;
  comment?: string;
}

interface PrivateKeyResponse {
  error: string;
  publickey: string;
  publickeypem: string;
  sha256fingerprint: string;
  md5fingerprint: string;
  type: string;
  value: string;
  privatekeypem: string;
}

// helper that will use the crypto handler service to check if a public or private key is valid or not
export async function validateKey(
  key: string,
  type: 'public' | 'private',
): Promise<PublicKeyResponse | PrivateKeyResponse> {
  let response = await fetch(
    `http://${getConfigFromEnv('SIDECAR_HANDLER_HOST', 'localhost')}:3333/validate/${type}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ key: encodeBase64(key) }).toString(),
    },
  );

  if (!response.ok) {
    throw new Error(`Error validating key: ${response.status}`);
  }

  if (type === 'public') {
    return (await response.json()) as PublicKeyResponse;
  } else {
    return (await response.json()) as PrivateKeyResponse;
  }
}

// helper that will use the crypto handler service to generate a private key with associated public key
export async function generatePrivateKey(): Promise<PrivateKeyResponse> {
  let response = await fetch(
    `http://${getConfigFromEnv('SIDECAR_HANDLER_HOST', 'localhost')}:3333/generate/ed25519`,
  );

  if (!response.ok) {
    throw new Error(`Error generating key: ${response.status}`);
  }

  return (await response.json()) as PrivateKeyResponse;
}
