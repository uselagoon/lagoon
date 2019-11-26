import React from 'react';
import ButtonAction from 'components/Button/ButtonAction';
import ButtonLink from 'components/Button/ButtonLink';
import Prepare from 'components/RestoreButton/Prepare';

const RestoreButton = ({ backup: { backupId, restore } }) => {
  if (!restore)
    return <Prepare backupId={backupId} />;

  if (restore.status === 'pending')
    return <ButtonAction disabled>Retrieving ...</ButtonAction>;

  if (restore.status === 'failed')
    return <ButtonAction disabled>Retrieve failed</ButtonAction>;

  return <ButtonLink href={restore.restoreLocation}>Download</ButtonLink>;
};

export default RestoreButton;
