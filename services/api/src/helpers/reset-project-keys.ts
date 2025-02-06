import * as R from 'ramda';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { sanitizeGroupName } from '@lagoon/commons/dist/api';
import * as gitlabApi from '@lagoon/commons/dist/gitlab/api';
import { getKeycloakAdminClient } from '../clients/keycloak-admin';
import { sqlClientPool } from '../clients/sqlClient';
import { esClient } from '../clients/esClient';
import { query } from '../util/db';
import { Group, SparseGroup } from '../models/group';
import { User } from '../models/user';
import { validateKey, generatePrivateKey as genpk } from '../util/func';
import { Sql as sshKeySql } from '../resources/sshKey/sql';

interface GitlabProject {
  id: number;
  path: string;
  ssh_url_to_repo: string;
  namespace: {
    kind: string;
    path: string;
    full_path: string;
  };
}

(async () => {
  const keycloakAdminClient = await getKeycloakAdminClient();

  const GroupModel = Group({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
  });
  const UserModel = User({
    sqlClientPool,
    keycloakAdminClient,
    esClient,
  });

  const projectArgs = process.argv.slice(2);
  if (projectArgs.length === 0) {
    logger.error('You must pass project names as space separated options');
    return;
  }

  const allGitlabProjects =
    (await gitlabApi.getAllProjects()) as GitlabProject[];
  const projectRecords = await query(
    sqlClientPool,
    'SELECT * FROM `project` WHERE name IN (:projects)',
    {
      projects: projectArgs,
    },
  );

  for (const project of projectRecords) {
    logger.debug(`Processing ${project.name}`);

    const gitlabProject = R.find(
      (findProject: GitlabProject) =>
        sanitizeGroupName(findProject.path) === project.name,
    )(allGitlabProjects) as GitlabProject;

    // Load default group
    const projectGroupName = `project-${project.name}`;
    let keycloakGroup: SparseGroup | undefined;
    try {
      keycloakGroup = await GroupModel.loadSparseGroupByName(projectGroupName);
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error(
          `Could not load group ${projectGroupName}: ${err.message}`,
        );
      } else {
        throw err;
      }
    }

    // //////////////////////
    // Delete Current Key //
    // //////////////////////
    if (R.prop('privateKey', project)) {
      let keyPair = {} as any;
      try {
        const publickey = await validateKey(R.prop('privateKey', project), 'private');
        keyPair = {
          ...keyPair,
          private: R.replace(
            /\n/g,
            '\n',
            R.prop('privateKey', project).toString('openssh'),
          ),
          public: publickey['publickey'],
          fingerprint: publickey['sha256fingerprint'],
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(
            `There was an error with the privateKey: ${err.message}`,
          );
        } else {
          throw err;
        }
      }
      const keyParts = keyPair.public.split(' ');

      // Delete users with current key
      const userRows = await query(
        sqlClientPool,
        sshKeySql.selectUserIdsBySshKeyFingerprint(keyPair.fingerprint),
      );

      for (const userRow of userRows) {
        const userId = R.prop('usid', userRow);

        try {
          await UserModel.deleteUser(userId);
        } catch (err: unknown) {
          if (err instanceof Error) {
            if (!err.message.includes('User not found')) {
              throw err;
            }
          }
        }

        // Delete public key
        await query(
          sqlClientPool,
          'DELETE FROM ssh_key WHERE key_value = :key',
          {
            key: keyParts[1],
          },
        );

        // Delete user_ssh_key link
        await query(
          sqlClientPool,
          'DELETE FROM user_ssh_key WHERE usid = :usid',
          {
            usid: userId,
          },
        );
      }

      // Delete current private key
      await query(
        sqlClientPool,
        'UPDATE project p SET private_key = NULL WHERE id = :pid',
        {
          pid: project.id,
        },
      );
    }

    // ////////////////
    // Make new key //
    // ////////////////

    // Generate new keypair
    const genkey = await genpk();
    const keyPair = {
      private: genkey['privatekeypem'],
      public: genkey['publickey'],
      fingerprint: genkey['sha256fingerprint'],
      type: genkey['type'],
    };

    // Save the newly generated key
    await query(
      sqlClientPool,
      'UPDATE project p SET private_key = :pkey WHERE id = :pid',
      {
        pkey: keyPair.private,
        pid: project.id,
      },
    );

    // Find or create a user that has the public key linked to them
    const userRows = await query(
      sqlClientPool,
      sshKeySql.selectUserIdsBySshKeyFingerprint(keyPair.fingerprint),
    );
    const userId = R.path([0, 'usid'], userRows) as string;

    let user: (User & { id: string }) | undefined;
    if (!userId) {
      try {
        user = (await UserModel.addUser({
          email: `default-user@${project.name}`,
          username: `default-user@${project.name}`,
          comment: `autogenerated user for project ${project.name}`,
        })) as User & { id: string };

        const keyParts = keyPair.public.split(' ');

        const { insertId } = await query(
          sqlClientPool,
          sshKeySql.insertSshKey({
            id: null,
            name: 'auto-add via reset',
            keyValue: keyParts[1],
            keyType: keyParts[0],
            keyFingerprint: keyPair.fingerprint,
          }),
        );
        await query(
          sqlClientPool,
          sshKeySql.addSshKeyToUser({ sshKeyId: insertId, userId: user.id }),
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(
            `Could not create default project user for ${project.name}: ${err.message}`,
          );
        } else {
          throw err;
        }
      }
    } else {
      user = (await UserModel.loadUserById(userId)) as User & { id: string };
    }

    if (user && keycloakGroup) {
      // Add the user (with linked public key) to the default group as maintainer
      try {
        await GroupModel.addUserToGroup(
          user,
          { id: keycloakGroup.id },
          'maintainer',
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(
            `Could not link user to default projet group for ${project.name}: ${err.message}`,
          );
        } else {
          throw err;
        }
      }
    }

    try {
      await gitlabApi.addDeployKeyToProject(gitlabProject.id, keyPair.public);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (!err.message.includes('has already been taken')) {
          throw new Error(
            `Could not add deploy_key to gitlab project ${gitlabProject.id}, reason: ${err}`,
          );
        }
      }
    }
  }

  logger.info('Reset completed');
})();
