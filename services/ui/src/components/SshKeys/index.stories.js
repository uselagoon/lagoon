import React from 'react';
import SshKeys from './index';
import AddSshKeysForm from './AddSshKey';

export default {
  component: SshKeys,
  title: 'Components/SshKeys',
}

const meData = 
  { 
    id: 1, 
    email: 'heyyo@me.com', 
    sshKeys: [
      {"id":10,"name":"auto-add via api","keyType":"ssh-rsa","created":"1978-01-14 14:25:01"},
      {"id":12,"name":"My Personal Key","keyType":"ssh-ed25519","created":"2018-01-14 14:25:01"}
    ]
};

const meDataNoKeys = 
  { 
    id: 1, 
    email: 'heyyo@me.com', 
    sshKeys: []
};

export const Default = () => (
  <SshKeys me={meData} />
);

export const NoKeys = () => (
  <SshKeys me={meDataNoKeys} />
);

export const AddSshKey = () => (
  <AddSshKeysForm me={meData} />
)