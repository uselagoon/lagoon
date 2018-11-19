import React from 'react';
import Prepare from './Prepare';

const RestoreButton = ({ backup: { backupId }, backup: { restore }, className }) => {
  if (!restore)
    return <Prepare className={className} backupId={backupId} />;

  if (restore.status === 'pending')
    return <button className={className} disabled>Preparing ...</button>;

  if (restore.status === 'failed')
    return <button className={className} disabled>Download error</button>;

  return <a className={className} href={restore.restoreLocation}>Download</a>;
};

export default RestoreButton;
