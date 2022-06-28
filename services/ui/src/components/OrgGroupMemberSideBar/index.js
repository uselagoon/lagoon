import React, { useState } from 'react';
import * as R from 'ramda';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import gql from 'graphql-tag';
import { bp, color, fontSize } from 'lib/variables';
import { Mutation } from 'react-apollo';
import ReactSelect from 'react-select';
import Button from 'components/Button';
import withLogic from 'components/OrgGroupMemberSideBar/logic';

const ADD_GROUP_MEMBER_MUTATION = gql`
  mutation addUserToGroup($email: String!, $group: String!, $role: GroupRole!) {
    addUserToGroup(input:{
      user:{email: $email}
      group:{name: $group}
      role: $role
    }){
      name
    }
  }
`;

let options = [
  {
    label: 'Guest',
    value: 'GUEST'
  },
  {
    label: 'Reporter',
    value: 'REPORTER'
  },
  {
    label: 'Developer',
    value: 'DEVELOPER'
  },
  {
    label: 'Maintainer',
    value: 'MAINTAINER'
  },
  {
    label: 'Owner',
    value: 'OWNER'
  }
];

const GroupMemberSideBar = ({ group,
  inputValueEmail,
  groupName,
  setInputValue,
  selectedRole,
  setSelectedRole }) => {

  return (
    <div className="details">
    <Mutation mutation={ADD_GROUP_MEMBER_MUTATION}>
    {(addGroupMember, {loading, error, data}) => {
      if (error) {
        return <div>{error.message}</div>;
      }
      return (
        <>
          <div className="newMember">
            <h4>Add user to group</h4>
            <div className="form-box">
              <label>Email Address: <input className="inputEmail" type="text" value={inputValueEmail} onChange={setInputValue} /></label>
            </div>
            <label>User Role:
            <div className="selectRole">
              <ReactSelect
                aria-label="Role"
                placeholder="Select a role..."
                name="role"
                value={options.find(o => o.value === selectedRole)}
                onChange={selectedOption => setSelectedRole(selectedOption)}
                options={options}
                required
              />
            </div></label>
            <div>
              <p></p>
              <Button
                disabled={inputValueEmail === "" || selectedRole === undefined}
                action={() =>
                  addGroupMember({
                  variables: {
                      email: inputValueEmail,
                      role: selectedRole.value,
                      group: group.name,
                    }
                  })
                }
                variant='green'
              >Add
              </Button>
            </div>
          </div>
        </>
        );
      }}
    </Mutation>
    <style jsx>{`
      .newMember {
        background: ${color.lightGrey};
        padding: 15px;
        border-width:1px;
        border-style: solid;
        border-radius: 4px;
        border-color: hsl(0,0%,90%);
        @media ${bp.smallOnly} {
          margin-bottom: 20px;
          order: -1;
          width: 100%;
        }
      }
      .form-box input, textarea{
        display: block;
        width: 100%;
        border-width:1px;
        border-style: solid;
        border-radius: 4px;
        min-height: 38px;
        border-color: hsl(0,0%,80%);
        font-family: 'source-code-pro',sans-serif;
        font-size: 0.8125rem;
        color: #5f6f7a;
        padding: 8px;
        box-sizing: border-box;
      }
      input[type="text"]:focus {
        border: 2px solid ${color.linkBlue};
        outline: none;
      }
    `}</style>
    </div>
  );
};

export default withLogic(GroupMemberSideBar);
