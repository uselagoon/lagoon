import * as R from 'ramda';
import { keycloakAdminClient } from '../clients/keycloakClient';
import pickNonNil from '../util/pickNonNil';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';

interface User {
  email: string;
  username: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  comment?: string;
  gitlabId?: string;
}

interface UserEdit {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  comment?: string;
  gitlabId?: string;
}

interface UserModel {
  loadAllUsers: () => Promise<User[]>;
  loadUserById: (id: string) => Promise<User>;
  addUser: (userInput: User) => Promise<User>;
  updateUser: (userInput: UserEdit) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
}

export class UsernameExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsernameExistsError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

const attrLens = R.lensPath(['attributes']);
const commentLens = R.lensPath(['comment']);

const attrCommentLens = R.compose(
  // @ts-ignore
  attrLens,
  commentLens,
  R.lensPath([0]),
);

const fetchGitlabId = async (user: User): Promise<string> => {
  const identities = await keycloakAdminClient.users.listFederatedIdentities({
    id: user.id,
  });

  const gitlabIdentity = R.find(
    R.propEq('identityProvider', 'gitlab'),
    identities,
  );

  // @ts-ignore
  return R.defaultTo('', R.prop('userId', gitlabIdentity));
};

const transformKeycloakUsers = async (
  keycloakUsers: UserRepresentation[],
): Promise<User[]> => {
  // Map from keycloak object to user object
  const users = keycloakUsers.map(
    (keycloakUser: UserRepresentation): User =>
      // @ts-ignore
      R.pipe(
        R.pick(['id', 'email', 'username', 'firstName', 'lastName']),
        R.set(commentLens, R.view(attrCommentLens, keycloakUser)),
      )(keycloakUser),
  );

  const usersWithGitlabIdFetch = users.map(
    async (user: User): Promise<User> => {
      const gitlabId = await fetchGitlabId(user);
      return {
        ...user,
        gitlabId,
      };
    },
  );

  return Promise.all(usersWithGitlabIdFetch);
};

const linkUserToGitlab = async (
  user: User,
  gitlabUserId: string,
): Promise<void> => {
  try {
    // Add Gitlab Federated Identity to User
    await keycloakAdminClient.users.addToFederatedIdentity({
      id: user.id,
      federatedIdentityId: 'gitlab',
      federatedIdentity: {
        identityProvider: 'gitlab',
        userId: gitlabUserId,
        userName: gitlabUserId, // we don't map the username, instead just use the UID again
      },
    });
  } catch (err) {
    throw new Error(
      `Error linking user "${user.email}" to Gitlab Federated Identity: ${err}`,
    );
  }
};

const unlinkUserFromGitlab = async (user: User): Promise<void> => {
  try {
    // Remove Gitlab Federated Identity from User
    await keycloakAdminClient.users.delFromFederatedIdentity({
      id: user.id,
      federatedIdentityId: 'gitlab',
    });
  } catch (err) {
    if (err.response.status && err.response.status === 404) {
      // No-op
    } else {
      throw new Error(
        `Error unlinking user "${
          user.email
        }" from Gitlab Federated Identity: ${err}`,
      );
    }
  }
};

const loadUserById = async (id: string): Promise<User> => {
  const keycloakUser = await keycloakAdminClient.users.findOne({
    id,
  });

  if (R.isNil(keycloakUser)) {
    throw new UserNotFoundError(`User not found: ${id}`);
  }

  const users = await transformKeycloakUsers([keycloakUser]);

  return users[0];
};

const loadAllUsers = async (): Promise<User[]> => {
  const keycloakUsers = await keycloakAdminClient.users.find();

  const users = await transformKeycloakUsers(keycloakUsers);

  return users;
};

const addUser = async (userInput: User): Promise<User> => {
  let response: { id: string; };
  try {
    response = await keycloakAdminClient.users.create({
      ...pickNonNil(['email', 'username', 'firstName', 'lastName'], userInput),
      enabled: true,
      attributes: {
        comment: [R.defaultTo('', R.prop('comment', userInput))],
      },
    });
  } catch (err) {
    if (err.response.status && err.response.status === 409) {
      throw new UsernameExistsError(
        `Username ${R.prop('username', userInput)} exists`,
      );
    } else {
      throw new Error(`Error creating Keycloak user: ${err.message}`);
    }
  }

  const user = await loadUserById(response.id);

  // If user has been created with a gitlabid, we map that ID to the user in Keycloak
  if (R.prop('gitlabId', userInput)) {
    await linkUserToGitlab(user, R.prop('gitlabId', userInput));
  }

  return {
    ...user,
    gitlabId: R.prop('gitlabId', userInput),
  };
};

const updateUser = async (userInput: UserEdit): Promise<User> => {
  try {
    await keycloakAdminClient.users.update(
      {
        id: userInput.id,
      },
      {
        ...pickNonNil(
          ['email', 'username', 'firstName', 'lastName'],
          userInput,
        ),
        attributes: {
          comment: [R.defaultTo('', R.prop('comment', userInput))],
        },
      },
    );
  } catch (err) {
    if (err.response.status && err.response.status === 409) {
      throw new UsernameExistsError(
        `Username ${R.prop('username', userInput)} exists`,
      );
    } else if (err.response.status && err.response.status === 404) {
      throw new UserNotFoundError(`User not found: ${userInput.id}`);
    } else {
      throw new Error(`Error updating Keycloak user: ${err.message}`);
    }
  }

  const user = await loadUserById(userInput.id);

  // If gitlabId was passed, assume it's changed
  if (R.prop('gitlabId', userInput)) {
    await unlinkUserFromGitlab(user);
    await linkUserToGitlab(user, R.prop('gitlabId', userInput));
  }

  return {
    ...user,
    gitlabId: R.prop('gitlabId', userInput),
  };
};

const deleteUser = async (id: string): Promise<void> => {
  try {
    await keycloakAdminClient.users.del({ id });
  } catch (err) {
    if (err.response.status && err.response.status === 404) {
      throw new UserNotFoundError(`User not found: ${id}`);
    } else {
      throw new Error(`Error deleting user ${id}: ${err}`);
    }
  }
};

export const User = (): UserModel => ({
  loadAllUsers,
  loadUserById,
  addUser,
  updateUser,
  deleteUser,
});
