// @flow

const R = require('ramda');
const sshpk = require('sshpk');
const bodyParser = require('body-parser');

import type { $Request, $Response } from 'express';

function validateKey(req: $Request, res: $Response, next: Function): void {
  const key = (req.body && req.body.key) || '';

  if (!key) {
    return next(new Error('Missing key parameter in request body.'));
  }

  try {
    // Validate the format of the ssh key. This fails with an exception
    // if the key is invalid. We are not actually interested in the
    // result of the parsing and just use this for validation.
    sshpk.parseKey(key, 'ssh');

    // TODO: In hiera, we don't store comment / type information in the key
    //       itself, that means we need to extract the base64 string of the
    //       given ssh key and use that for the token payload... otherwise
    //       string comparison won't work in the authorization part (api)

    //    0       1        2
    // ssh-rsa base-64 [comment]
    const parsedKey = R.compose(R.prop(1), R.split(' '), R.defaultTo(''))(key);

    if (parsedKey == null) {
      next(new Error('Could not derive base64 key from ssh key...'));
      return;
    }

    // $FlowIgnore
    req.parsedKey = parsedKey;

    next();
  } catch (e) {
    next(new Error('Invalid body.key format... is this an ssh key?'));
  }
}

const parseJson = bodyParser.json();

module.exports = {
  validateKey,
  parseJson,
};
