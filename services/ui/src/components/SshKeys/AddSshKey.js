import React, { useState } from 'react';
import css from 'styled-jsx/css';
import Button from 'components/Button';
import { Mutation } from 'react-apollo';
import Me from 'lib/query/Me';
import { bp, color, fontSize } from 'lib/variables';
import AddSshKeyMutation from '../../lib/mutation/AddSshKey';

const AddSshKey = ({me: { id, email }}) => {

  const defaultValues = {sshKeyName: '', sshKey: '', sshKeyType: 'SSH_RSA'};
  const [values, setValues] = useState(defaultValues);

  const handleChange = e => {
    const {name, value} = e.target;
    setValues({...values, [name]: value});
  }

  const isFormValid = values.sshKeyName !== '' && values.sshKey !== '';

  return(
    <div className="addSshKey">

      <Mutation mutation={AddSshKeyMutation} refetchQueries={[{ query: Me }]}>
        {(addSshKey, { loading, called, error, data }) => {

          const addSshKeyHandler = () => { 
            addSshKey({
              variables: {
                input: {
                  name: values.sshKeyName,
                  keyValue: values.sshKey.replace('ssh-rsa', '').replace('ssh-ed25519', '').trim(),
                  keyType: values.sshKeyType,
                  user: {
                    id,
                    email
                  }
                }
              }
            });
            setValues(defaultValues);
          };

          if (!error && called && loading) {
            return <div>Adding SSH Key...</div>;
          }

          return (
            <div className="addNew">

              { error ? <div className="error">{error.message.replace('GraphQL error:', '').trim()}</div> : "" } 

              <div>
                <label>SSH Key Name</label>
                <input
                  aria-labelledby="addSshKeyName"
                  id="sshKeyName"
                  name="sshKeyName"
                  label='SSH Key Name'
                  className="addSshKeyInput"
                  type="text"
                  value={values.sshKeyName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="sshKeyType">SSH Key Type</label>
                <select
                  id="sshKeyType"
                  name="sshKeyType"
                  onChange={handleChange}
                  aria-labelledby="addSshKeyType"
                  label='SSH Key Type'
                  className="addSshKeyInput"
                >
                  {['SSH_RSA', 'SSH_ED25519'].map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>SSH Key</label>
                <textarea
                  aria-labelledby="addSshKey"
                  id='sshKey'
                  name='sshKey'
                  label='SSH Key'
                  className="addSshKeyInput"
                  type="text"
                  onChange={handleChange}
                  value={values.sshKey}
                  placeholder="Begins with 'ssh-rsa', 'ssh-ed25519'"/>
              </div>

              <Button disabled={!isFormValid} action={addSshKeyHandler}>Add</Button>

            </div>

          );
        }}
      </Mutation>

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
