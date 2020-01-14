import React, { useState } from 'react';
import css from 'styled-jsx/css';
import moment from 'moment';
import Button from 'components/Button';
import { Mutation } from 'react-apollo';
import DeleteSshKeyById from 'lib/mutation/DeleteSshKeyById';
import { bp, color, fontSize } from 'lib/variables';
import AddSshKey from '../../lib/mutation/AddSshKey';


const SshKeys = (me) => {


  const { me: { id, email, sshKeys: keys } } = me;

  const handleInputChange = e => {
    const {name, value} = e.target
    setValues({...values, [name]: value})
  }

  const [values, setValues] = useState({sshKeyName: '', sshKey: '', sshKeyType: ''});

  return(
    <div className="keys">
      <div className="header">
        <label className="name">Name</label>
        <label className="type">Type</label>
        <label className="created">Created</label>
      </div>
      <div className="data-table">
        {!keys.length && <div className="data-none">No SshKeys</div>}
        {keys.map(key => (
          <div className="data-row" key={key.id}>
            <div className="name">{key.id} - {key.name}</div>
            <div className="type">{key.keyType}</div>
            <div className="created">{moment
                .utc(key.create)
                .local()
                .format('DD MMM YYYY, HH:mm:ss (Z)')}</div>
            <div className="delete">
              <Mutation mutation={DeleteSshKeyById}>
                {(deleteSshKeyById, { loading, called, error, data }) => {
                  if (error) {
                    return <div>{error.message}</div>;
                  }

                  if (called) {
                    return <div>Delete queued</div>;
                  }

                  return (
                    <Button action={() => deleteSshKeyById({
                      variables: {
                        input: {
                          id: key.id,
                        }
                      }
                    })}>Delete</Button>
                  );
                }}
              </Mutation>
            </div>
          </div>
        ))}
      </div>


      <Mutation mutation={AddSshKey}>
        {(addSshKey, { loading, called, error, data }) => {
          if (error) {
            return <div>{error.message}</div>;
          }

          if (called) {
            return <div>Adding queued</div>;
          }

          return (
            <div className="addNew">

            <div>
              <label>SSH Key Name</label>
              <input
                aria-labelledby="addSshKeyName"
                name="sshKeyName"
                label='SSH Key Name'
                className="addSshKeyInput"
                type="text"
                value={values.sshKeyName}
                onChange={handleInputChange}
              />
            </div>

            <div>
            <label>SSH Key Type</label>
            <input
                aria-labelledby="addSshKeyType"
                name='sshKeyType'
                label='SSH Key Type'
                className="addSshKeyInput"
                type="text"
                onChange={handleInputChange}
                value={values.sshKeyType}
                placeholder="SSH_RSA | SSH_ED25519"/>

            </div>

            <div>
              <label>SSH Key</label>
              <textarea
                  aria-labelledby="addSshKey"
                  name='sshKey'
                  label='SSH Key'
                  className="addSshKeyInput"
                  type="text"
                  onChange={handleInputChange}
                  value={values.sshKey}
                  placeholder="Begins with 'ssh-rsa', 'ssh-ed25519'"/>
            </div>


              <Button action={() => addSshKey({
                  variables: {
                    input: {
                      name: values.sshKeyName,
                      keyValue: values.sshKey,
                      keyType: values.sshKeyType,
                      user: {
                        id,
                        email
                      }
                    }
                  }
                })}>Add</Button>

          </div>

          );
        }}
      </Mutation>


      <style jsx>{`
        .header {
          @media ${bp.wideUp} {
            align-items: center;
            display: flex;
            margin: 0 0 14px;
            padding-right: 40px;
          }
          @media ${bp.smallOnly} {
            flex-wrap: wrap;
          }
          @media ${bp.tabletUp} {
            margin-top: 40px;
          }

          label {
            display: none;
            padding-left: 20px;
            @media ${bp.wideUp} {
              display: block;
            }

            &.name {
              width: 15%;
              @media ${bp.extraWideUp} {
                width: 50%;
              }
            }

            &.type {
              width: 25%;
              @media ${bp.extraWideUp} {
                width: 20%;
              }
            }

            &.created {
              width: 45%;
              @media ${bp.extraWideUp} {
                width: 55%;
              }
            }
          }
        }

        .data-table {
          background-color: ${color.white};
          border: 1px solid ${color.lightestGrey};
          border-radius: 3px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);

          .data-none {
            border: 1px solid ${color.white};
            border-bottom: 1px solid ${color.lightestGrey};
            border-radius: 3px;
            line-height: 1.5rem;
            padding: 8px 0 7px 0;
            text-align: center;
          }

          .data-row {
            border: 1px solid ${color.white};
            border-bottom: 1px solid ${color.lightestGrey};
            border-radius: 0;
            line-height: 1.5rem;
            padding: 8px 0 7px 0;
            @media ${bp.wideUp} {
              display: flex;
              justify-content: space-between;
              padding-right: 15px;
            }

            & > div {
              padding-left: 20px;
              @media ${bp.wideDown} {
                padding-right: 40px;
              }
              @media ${bp.wideUp} {
                &.name {
                  width: 50%;
                }

                &.type {
                  width: 20%;
                }

                &.download {
                  align-self: center;
                  width: 25%;
                  @media ${bp.extraWideUp} {
                    width: 20%;
                  }
                }
              }

              &.created {
                word-break: break-word;
                overflow: hidden;
                text-overflow: ellipsis;
                @media ${bp.wideUp} {
                  width: 45%;
                }
                @media ${bp.extraWideUp} {
                  width: 50%;
                }
              }
            }

            &:hover {
              border: 1px solid ${color.brightBlue};
            }

            &:first-child {
              border-top-left-radius: 3px;
              border-top-right-radius: 3px;
            }

            &:last-child {
              border-bottom-left-radius: 3px;
              border-bottom-right-radius: 3px;
            }
          }
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

export default SshKeys;
