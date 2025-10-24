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

export const getErrorMessage = (err: unknown): string => {
  let msg = `unknown error (${typeof err})`;

  if (err instanceof Error) {
    msg = err.message;
  } else if (typeof err === 'string') {
    msg = err;
  }

  return msg;
}

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

// https://github.com/kubernetes/apimachinery/blob/v0.34.1/pkg/util/validation/validation.go#L219
// javascript implementation of the function used by kubernetes to verify ingress
const dns1123LabelFmt: string = "[a-z0-9]([-a-z0-9]*[a-z0-9])?";
const dns1123SubdomainFmt: string = `${dns1123LabelFmt}(\\.${dns1123LabelFmt})*`;
const dns1123SubdomainMaxLength: number = 253;
export function isDNS1123Subdomain(value: string): boolean {
  if (value.length > dns1123SubdomainMaxLength) {
      return false;
  }

  const dns1123SubdomainRegexp = new RegExp(dns1123SubdomainFmt);

  if (!dns1123SubdomainRegexp.test(value)) {
      return false;
  }
	return true;
}

// https://github.com/kubernetes/apimachinery/blob/v0.34.1/pkg/util/validation/validation.go#L41
// javascript implementation of the function used by kubernetes to verify annotation/label keys
const labelKeyCharFmt = "[A-Za-z0-9]";
const labelKeyExtCharFmt = "[-A-Za-z0-9_.]";
const labelKeyFmt = `(${labelKeyCharFmt}${labelKeyExtCharFmt}*)?${labelKeyCharFmt}`;
const labelKeyErrMsg = "must consist of alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character";
const labelKeyMaxLength = 63;
const labelKeyRegexp = new RegExp(`^${labelKeyFmt}$`);
export function isLabelKey(value: string) {
  const errs = [];
  const parts = value.split("/");
  let name;
  switch (parts.length) {
    case 1:
      name = parts[0];
      break;
    case 2:
      const prefix = parts[0];
      name = parts[1];
      if (prefix.length === 0) {
        errs.push("prefix part cannot be empty");
      } else if (!isDNS1123Subdomain(prefix)) {
        errs.push(`prefix part ${prefix} must be a valid DNS subdomain`);
      }
      break;
    default:
      return errs.concat(`a valid label key ${labelKeyErrMsg} with an optional DNS subdomain prefix and '/' (e.g. 'example.com/MyName')`);
  }
  if (name.length === 0) {
    errs.push("name part cannot be empty");
  } else if (name.length > labelKeyMaxLength) {
    errs.push(`name part exceeds maximum length of ${labelKeyMaxLength}`);
  }
  if (!labelKeyRegexp.test(name)) {
    errs.push(`name part ${labelKeyErrMsg}`);
  }
  return errs;
}