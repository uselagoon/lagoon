import { Response } from 'express';
import { RequestWithAuthData } from '../authMiddleware';
import { logger } from '../loggers/logger';
import { knex, query } from '../util/db';
import { sqlClientPool } from '../clients/sqlClient';

interface KeysRequestBody {
  fingerprint: string;
}

/**
 * Finds an ssh key by fingerprint and returns its public key.
 *
 * For use in `ssh` service. Return body must be in format:
 * keyType keyValue
 */
const keysRoute = async (
  { body: { fingerprint }, legacyCredentials }: RequestWithAuthData<KeysRequestBody>,
  res: Response,
) => {
  if (legacyCredentials?.role !== 'admin') {
    return res.status(401).send('Unauthorized legacy token');
  }

  if (!fingerprint) {
    return res.status(500).send('Missing parameter "fingerprint"');
  }

  const key = await getKeyByFingerprint(fingerprint);

  if (!key) {
    logger.info(`/keys: no user with key fingerprint: ${fingerprint}`);
    return res.send();
  }

  logger.debug(`/keys: returning key with fingerprint: ${fingerprint}`);

  res.send(`${key.keyType} ${key.keyValue}`);
};

interface SshKey {
  keyType: String;
  keyValue: String;
}

// Return an ssh key, if attached to user, and update its `last_used` time.
const getKeyByFingerprint = async (fingerprint: string): Promise<SshKey | null> => {
  const conn = await sqlClientPool.getConnection();

  const rows = await query(conn,
    knex('ssh_key')
      .join('user_ssh_key', 'ssh_key.id', '=', 'user_ssh_key.skid')
      .select('key_type', 'key_value')
      .where('key_fingerprint', fingerprint)
      .whereNotNull('usid')
      .toString(),
  ) as SshKey[];

  if (rows.length != 1) {
    await conn.end();
    return null;
  }

  await query(conn,
    knex('ssh_key')
      .where('key_fingerprint', fingerprint)
      .update({lastUsed: knex.fn.now()})
      .toString(),
  );

  await conn.end();
  return rows[0];
}

export default [keysRoute];
