import Git from 'nodegit';

export default () =>
  Git.Cred.userpassPlaintextNew(process.env.GIT_USERNAME, process.env.GIT_PASSWORD);
