import * as R from 'ramda';
import sshpk from 'sshpk';
import bodyParser from 'body-parser';
import { Request, Response } from 'express';
import { RequestWithAuthData } from '../authMiddleware';
import { logger } from '../loggers/logger';
import { knex, query } from '../util/db';
import { sqlClientPool } from '../clients/sqlClient';

const toFingerprint = sshKey => {
  try {
    return sshpk
      .parseKey(sshKey, 'ssh')
      .fingerprint()
      .toString();
  } catch (e) {
    logger.error(`Invalid ssh key: ${sshKey}`);
  }
};

const keysRoute = async (
  { body: { fingerprint }, legacyCredentials }: RequestWithAuthData,
  res: Response,
) => {
  if (!legacyCredentials || legacyCredentials.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (!fingerprint) {
    return res.status(500).send('Missing parameter "fingerprint"');
  }

  logger.debug(`Accessing keys with fingerprint: ${fingerprint}`);

  const rows = await query(
    sqlClientPool,
    knex('ssh_key AS sk')
      .select(knex.raw("CONCAT(sk.key_type, ' ', sk.key_value) as sshKey"))
      .toString(),
  );
  const keys = R.map(R.prop('sshKey'), rows);

  // Object of fingerprints mapping to SSH keys
  // Ex. { <fingerprint>: <key> }
  const fingerprintKeyMap = R.compose(
    // Transform back to object from pairs
    R.fromPairs,
    // Remove undefined fingerprints
    // @ts-ignore
    R.reject(([sshKeyFingerprint]) => sshKeyFingerprint === undefined),
    // Transform from single-level array to array of pairs, with the SSH key fingerprint as the first value
    // @ts-ignore
    R.map(sshKey => [toFingerprint(sshKey), sshKey]),
  // @ts-ignore error TS2554: Expected 0 arguments, but got 1.
  )(keys);

  const result = R.propOr('', fingerprint, fingerprintKeyMap);

  if (!result) {
    logger.debug(`Unknown fingerprint: ${fingerprint}`);
  }

  // update key used timestamp
  const foundkey = await query(
    sqlClientPool,
    knex('ssh_key')
      .select('id')
      .where('key_fingerprint', fingerprint)
      .toString(),
  );
  // check if a key is found
  if (foundkey.length > 0) {
    var date = new Date();
    const convertDateFormat = R.init;
    var lastUsed = convertDateFormat(date.toISOString());
    await query(
      sqlClientPool,
      knex('ssh_key')
        .where('id', foundkey[0].id)
        .update({lastUsed: lastUsed})
        .toString(),
    );
  }

  res.send(result);
};

export default [bodyParser.json(), keysRoute];
