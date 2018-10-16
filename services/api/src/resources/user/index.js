// @flow

const moveUserSshKeyToObject = (
  {
    id,
    email,
    firstName,
    lastName,
    comment,
    gitlabId,
    sshKeyId,
    sshKeyName,
    sshKeyValue,
    sshKeyType,
    sshKeyCreated,
  } /* : {
  id: number,
  email: string,
  firstName: string,
  lastName: string,
  comment: string,
  gitlabId: number,
  sshKeyId: number,
  sshKeyName: string,
  sshKeyValue: string,
  sshKeyType: string,
  sshKeyCreated: number,
} */,
) => ({
  id,
  email,
  firstName,
  lastName,
  comment,
  gitlabId,
  sshKey: {
    id: sshKeyId,
    name: sshKeyName,
    value: sshKeyValue,
    type: sshKeyType,
    created: sshKeyCreated,
  },
});

module.exports = { moveUserSshKeyToObject };
