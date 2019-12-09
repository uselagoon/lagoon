import React from 'react';
import Button from 'components/Button';
import Prepare from 'components/RestoreButton/Prepare';

/**
 * A button to restore a backup.
 */
const RestoreButton = ({ backup: { backupId, restore } }) => {
  if (!restore)
    return <Prepare backupId={backupId} />;

  if (restore.status === 'pending')
    return <Button disabled>Retrieving ...</Button>;

  if (restore.status === 'failed')
    return <Button disabled>Retrieve failed</Button>;

  return <Button href={restore.restoreLocation}>Download</Button>;
};

export default RestoreButton;
