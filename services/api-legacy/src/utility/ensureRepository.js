import Git from 'nodegit';
import credentialsCallback from './credentialsCallback';

const expectDefaultState = (repository) => {
  if (!repository.isDefaultState()) {
    throw new Error('The repository is not in the default state.');
  }

  return repository;
};

// Open the repository directory or fetch it from the remote.
export default async (url, branch, destination) => {
  try {
    // Check if the repository already exists.
    const repository = await Git.Repository.open(destination);

    // Ensure that we are on the right branch.
    await repository.checkoutBranch(branch);
    return expectDefaultState(repository);
  } catch (error) {
    // Repository doesn't exist locally yet. Clone it.
    const repository = await Git.Clone.clone(url, destination, {
      checkoutBranch: branch,
      fetchOpts: {
        callbacks: {
          certificateCheck: () => 1,
          credentials: credentialsCallback,
        },
      },
    });

    return expectDefaultState(repository);
  }
};
