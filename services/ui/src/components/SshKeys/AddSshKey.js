import React, { useState } from 'react';
import css from 'styled-jsx/css';
import Button from 'components/Button';
import { useMutation } from '@apollo/client';
import Me from 'lib/query/Me';
import { bp, color, fontSize } from 'lib/variables';
import AddSshKeyMutation from '../../lib/mutation/AddSshKey';

const AddSshKey = ({me: { id, email }}) => {

  const defaultValues = {sshKeyName: '', sshKey: ''};
  const [values, setValues] = useState(defaultValues);

  const [addSshKeyMutation, { data, loading, error, called }] = useMutation(AddSshKeyMutation, {
    refetchQueries: [{ query: Me }]
  });

  const handleChange = e => {
    const {name, value} = e.target;
    setValues({...values, [name]: value});
  }

  const isFormValid = values.sshKeyName !== '' && !values.sshKey.includes('\n') &&
  (
    values.sshKey.trim().startsWith('ssh-rsa') ||
    values.sshKey.trim().startsWith('ssh-ed25519')
  );

  const regex = /\s*(ssh-\S+)\s+(\S+).*/
  // First capture group is the type of the ssh key
  // Second capture group is the actual ssh key
  // Whitespace and comments are ignored

  const addSshKeyHandler = () => {
    addSshKeyMutation({
      variables: {
        input: {
          name: values.sshKeyName,
          keyValue: values.sshKey.match(regex)[2],
          keyType: values.sshKey.match(regex)[1].replace('-', '_').toUpperCase(),
          user: {
            id,
            email
          }
        }
      }
    });
    setValues(defaultValues);
  };

  return(
    <div className="addSshKey">
      {!error && called && loading && <div>Adding SSH Key...</div>}
      <div className="addNew">
        {error ? <div className="error">{error.message.replace('GraphQL error:', '').trim()}</div> : "" }

        <div>
          <label htmlFor="sshKeyName">SSH Key Name</label>
          <input
            id="sshKeyName"
            name="sshKeyName"
            className="addSshKeyInput"
            type="text"
            value={values.sshKeyName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="sshKey">SSH Key</label>
          <textarea
            id='sshKey'
            name='sshKey'
            className="addSshKeyInput"
            type="text"
            onChange={handleChange}
            value={values.sshKey}
            placeholder="Begins with 'ssh-rsa', 'ssh-ed25519'"/>
        </div>

        <Button disabled={!isFormValid} action={addSshKeyHandler}>Add</Button>
      </div>
      <style jsx>{`
        .error {
          color: #e64545;
        }
        .addNew {
          margin-top: 3em;
        }
        .addSshKeyInput {
          width: 100%;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
};

export default AddSshKey;
