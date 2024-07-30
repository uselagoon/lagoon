import * as R from 'ramda';
import bodyParser from 'body-parser';
import { Request, Response } from 'express';
import { RequestWithAuthData } from '../authMiddleware';
import { logger } from '../loggers/logger';
import { knex, query } from '../util/db';
import { sqlClientPool } from '../clients/sqlClient';
import { validateKey } from '../util/func';

const toFingerprint = async (sshKey) => {
  try {
    const pkey = new Buffer(sshKey).toString('base64')
    const pubkey = await validateKey(pkey, "public")
    if (pubkey['sha256fingerprint']) {
      return pubkey['sha256fingerprint']
    } else {
      throw new Error('not valid key')
    }
  } catch (e) {
    logger.error(`Invalid ssh key: ${sshKey}`);
  }
};

const mapFingerprints = async (keys) => {
  const fingerprintKeyMap = await Promise.all(
    keys.map(async sshKey => {
    const fp = await toFingerprint(sshKey)
    return {fingerprint: fp, key: sshKey}
  }))
  return fingerprintKeyMap
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
      .where("key_fingerprint","=", fingerprint)
      .toString(),
  );
  const keys = R.map(R.prop('sshKey'), rows);

  const fingerprintKeyMap = await mapFingerprints(keys)
  const found = await fingerprintKeyMap.filter(el => {if (el.fingerprint === fingerprint) { return el.key }})[0];

  if (!found) {
    logger.debug(`Unknown fingerprint: ${fingerprint}`);
    // drop out
    res.send();
  } else {
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
    // return key
    res.send(found.key);
  }
};

export default [bodyParser.json(), keysRoute];
