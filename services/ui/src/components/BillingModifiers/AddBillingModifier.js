import * as R from 'ramda';
import React from 'react';
import css from 'styled-jsx/css';
import { color } from 'lib/variables';


import BillingModifierForm from "./BillingModifierForm";

const AddBillingModifier = ({ group, month, editBillingModifier, editHandler }) => {

  return(
    <div className="addBillingModifier">

      <div className="addNew">
        <h2>{R.isEmpty(editBillingModifier) ? 'Add' : 'Edit' } Billing Modifier</h2>
        <BillingModifierForm group={group} editBillingModifier={editBillingModifier} editHandler={editHandler} />
      </div>

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
