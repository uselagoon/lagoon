import Git from 'nodegit';

export default () => {
  const time = parseInt(Date.now() / 1000, 10);
  const offset = new Date().getTimezoneOffset();

  return Git.Signature.create('API', 'api@amazee.io', time, offset);
};
