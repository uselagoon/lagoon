import React, { useState } from 'react';
import css from 'styled-jsx/css';
import { Mutation } from 'react-apollo';

import { color } from 'lib/variables';
import AddBillingModifierMutation from '../../lib/mutation/AddBillingModifier';
import AllBillingModifiersQuery from 'lib/query/AllBillingModifiers';
import BillingGroupCostsQuery from 'lib/query/BillingGroupCosts';

import BillingModifierForm from "./BillingModifierForm";

const AddBillingModifier = ({ group, month }) => {

  return(
    <div className="addBillingModifier">

      <Mutation 
        mutation={AddBillingModifierMutation} 
        refetchQueries={[
          { query: AllBillingModifiersQuery, variables: { input: { name: group } } },
          { query: BillingGroupCostsQuery, variables: { input: { name: group }, month }}
        ]}
      >
        {(addBillingModifier, { loading, called, error, data }) => {

          const addBillingModifierHandler = (input) => { 
            addBillingModifier({ variables: { input } });
          };

          if (!error && called && loading) {
            return <div>Adding Billing Modifier...</div>;
          }

          return (
            <div className="addNew">
              <h2>Add Billing Modifier</h2>
              { error ? <div className="error">{error.message.replace('GraphQL error:', '').trim()}</div> : "" } 
              <BillingModifierForm group={group} submitHandler={addBillingModifierHandler} />
            </div>
          );
        }}
      </Mutation>

      <style jsx>{`
        .addBillingModifier {
          margin: 1rem 0;
          padding: 30px 20px;
          background-color: #fff;
          border: 1px solid #f5f6fa;
          border-radius: 3px;
          box-shadow: 0px 4px 8px 0px rgba(0,0,0,0.03);
        }
        .error {
          color: #e64545;
        }
      `}</style>
    </div>
  );
};

export default AddBillingModifier;
