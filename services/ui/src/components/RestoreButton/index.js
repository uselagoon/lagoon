import React from 'react';
import Prepare from 'components/RestoreButton/Prepare';

const RestoreButton = ({ backup: { backupId, restore }, className }) => {
  if (!restore)
    return <Prepare className={`restore-button ${className}`} backupId={backupId} />;

  if (restore.status === 'pending')
    return <button className={`restore-button ${className}`} disabled>Preparing ...</button>;

  if (restore.status === 'failed')
    return <button className={`restore-button ${className}`} disabled>Download error</button>;

  return <a className={`restore-button ${className}`} href={restore.restoreLocation}>Download</a>;
};

export default RestoreButton;
