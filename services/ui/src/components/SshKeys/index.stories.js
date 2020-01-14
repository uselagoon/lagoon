import React from 'react';
import SshKeys from './index';

export default {
  component: SshKeys,
  title: 'Components/SshKeys',
}



const keysData = [
  {"id":10,"name":"auto-add via api","keyType":"ssh-ed25519","created":"2020-01-14 14:25:01","__typename":"SshKey"},
  {"id":11,"name":"My Pesonal SSH Key","keyType":"ssh-ed25519","created":"2019-01-1 14:25:01","__typename":"SshKey"}
];
export const Default = () => (
  <SshKeys keys={keysData} />
);

export const NoKeys = () => (
  <SshKeys keys={[]} />
);
