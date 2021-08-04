import * as R from 'ramda';
import React, { useState, useEffect } from 'react';
import css from 'styled-jsx/css';
import Button from 'components/Button';

import { useMutation } from '@apollo/client';

import AddBillingModifierMutation from '../../lib/mutation/AddBillingModifier';
import UpdateBillingModifierMutation from 'lib/mutation/UpdateBillingModifier';
import AllBillingModifiersQuery from 'lib/query/AllBillingModifiers';
import BillingGroupCostsQuery from 'lib/query/BillingGroupCosts';

import moment from 'moment';

import { enGB } from 'date-fns/locale'
import { DateRangePicker, START_DATE, END_DATE } from 'react-nice-dates'

import 'react-nice-dates/build/style.css'

const BillingModifierForm = ({group, editBillingModifier, editHandler}) => {

  const getModifierType = ({discountFixed, discountPercentage, extraFixed, extraPercentage, min, max}) => {
    if(discountFixed !== 0){
      return 'discountFixed'
    }

    if (discountPercentage !== 0) {
      return 'discountPercentage'
    }

    if(extraFixed !== 0){
      return 'extraFixed'
    }

    if(extraPercentage !== 0){
      return 'extraPercentage'
    }

    if(min !== 0){
      return 'min'
    }

    if(max !== 0){
      return 'max'
    }

    return '';
  }

  const getModifierValue = ({discountFixed, discountPercentage, extraFixed, extraPercentage, min, max}) => {
    if(discountFixed !== 0){
      return discountFixed
    }

    if (discountPercentage !== 0) {
      return discountPercentage
    }

    if(extraFixed !== 0){
      return extraFixed
    }

    if(extraPercentage !== 0){
      return extraPercentage
    }

    if(min !== 0){
      return min
    }

    if(max !== 0){
      return max
    }

    return '';
  }

  const defaultValues = {
    startDate: !R.isEmpty(editBillingModifier) ? editBillingModifier.startDate : '',
    endDate: !R.isEmpty(editBillingModifier) ? editBillingModifier.endDate : '',
    modifierType: !R.isEmpty(editBillingModifier) ? getModifierType(editBillingModifier) : 'discountFixed',
    modifierValue: !R.isEmpty(editBillingModifier) ? getModifierValue(editBillingModifier) : '',
    customerComments: !R.isEmpty(editBillingModifier) ? editBillingModifier.customerComments : '',
    adminComments: !R.isEmpty(editBillingModifier) ? editBillingModifier.adminComments : '',
    weight: !R.isEmpty(editBillingModifier) ? editBillingModifier.weight : 0,
  };
  const [values, setValues] = useState(defaultValues);

  useEffect(() => {
    setValues(defaultValues)
  }, [editBillingModifier])

  const handleChange = e => {
    const {name, value} = e.target;
    setValues({...values, [name]: value});
  }

  const [addBillingModifier] = useMutation(
    AddBillingModifierMutation,
    {
      update(cache, { data: { addBillingModifier } }){

        const variables = { input: { name: group } };
        const { allBillingModifiers } = cache.readQuery({ query: AllBillingModifiersQuery, variables});
        const data = { allBillingModifiers: [...allBillingModifiers, {...addBillingModifier}] };

        cache.writeQuery({ query: AllBillingModifiersQuery, variables, data });
      }
    }
  );

  const [updateModifier] = useMutation(
    UpdateBillingModifierMutation,
    {
      update(cache, { data: { updateBillingModifier } }){
        const variables = { input: { name: group } };
        const { allBillingModifiers } = cache.readQuery({ query: AllBillingModifiersQuery, variables});
        const { id, weight } = updateBillingModifier;

        const idx = allBillingModifiers.findIndex(({id}) => id === id );

        if(allBillingModifiers[idx].weight !== weight){
          const data = { allBillingModifiers: allBillingModifiers.map(obj => id === obj.id ? updateBillingModifier : obj) };
          cache.writeQuery({ query: AllBillingModifiersQuery, variables, data });
        }

        if(updateBillingModifier){
          editHandler({})
        }
      }
    }
  );

  const isFormValid = values.startDate !== '' && values.endDate !== '' && values.modifierType && values.modifierValue && values.adminComments !== '';

  const formSubmitHandler = () => {
    const variables = {
      group: { name: group},
      startDate: values.startDate,
      endDate: values.endDate,
      discountFixed: values.modifierType === 'discountFixed' ? parseFloat(values.modifierValue) : 0,
      discountPercentage: values.modifierType === 'discountPercentage' ? parseFloat(values.modifierValue) : 0,
      extraFixed: values.modifierType === 'extraFixed' ? parseFloat(values.modifierValue) : 0,
      extraPercentage: values.modifierType === 'extraPercentage' ? parseFloat(values.modifierValue) : 0,
      min: values.modifierType === 'min' ? parseFloat(values.modifierValue) : 0,
      max: values.modifierType === 'max' ? parseFloat(values.modifierValue) : 0,
      customerComments: values.customerComments,
      adminComments: values.adminComments,
      weight: values.weight !== 0 ? parseInt(values.weight): 0
    };

    // const optimisticResponse = {
    //   addBillingModifier: {
    //     ...variables,
    //     __typename: "BillingModifier",
    //   }
    // };

    if(R.isEmpty(editBillingModifier)){
      addBillingModifier({ variables: { input: {...variables } } })
    }else{

      const optimisticResponse = {
        updateBillingModifier: {
          ...editBillingModifier,
          ...variables,
          __typename: "BillingModifier",
          group: {
            ...editBillingModifier.group,
            type:'billing',
            __typename: "BillingGroup"
          }
        }
      };

      const editVariables = { input: { id: editBillingModifier.id, patch: { ...variables }} };
      updateModifier({variables: editVariables, optimisticResponse });
    }
  }



  return (
    <div>

      <div>
        <label htmlFor="startDate">Date Range</label>
        <div className='date-range modifierInput'>
          <input
            id="startDate"
            name="startDate"
            className={'input' + (focus === START_DATE ? ' -focused' : '')}
            placeholder='Start date (YYYY-MM-DD)'
            onChange={handleChange}
            value={values.startDate}
          />
          <span className='date-range_arrow' />
          <input
            id="endDate"
            name="endDate"
            className={'input' + (focus === END_DATE ? ' -focused' : '')}
            placeholder='End date (YYYY-MM-DD)'
            onChange={handleChange}
            value={values.endDate}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ModifierType">Type</label>
        <select
          id="modifierType"
          name="modifierType"
          onChange={handleChange}
          aria-labelledby="modifierType"
          label='Modifier Type'
          className="modifierInput"
          value={values.modifierType}
        >
          {[
            {name: 'Discount: Fixed', value: 'discountFixed'},
            {name: 'Discount: Percentage (0-100)', value: 'discountPercentage'},
            {name: 'Extra: Fixed', value: 'extraFixed'},
            {name: 'Extra: Percentage (0-100)', value: 'extraPercentage'},
            {name: 'Minimum Amount', value: 'min'},
            {name: 'Maximum Amount', value: 'max'}
          ].map(modifier => (
            <option key={`${modifier.name}-${modifier.value}`} value={modifier.value}>
              {modifier.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Value</label>
        <input
          aria-labelledby="modifierValue"
          id="modifierValue"
          name="modifierValue"
          label='Modifier Value'
          className="modifierInput"
          type="text"
          value={values.modifierValue}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Admin Comments</label>
        <textarea
          aria-labelledby="adminComments"
          id='adminComments'
          name='adminComments'
          label='Admin Comments'
          className="modifierInput"
          type="text"
          onChange={handleChange}
          value={values.adminComments}
          placeholder="AIO Internal Messaging"/>
      </div>

      <div>
        <label>Customer Comments</label>
        <textarea
          aria-labelledby="customerComments"
          id='customerComments'
          name='customerComments'
          label='Customer Comments'
          className="modifierInput"
          type="text"
          onChange={handleChange}
          value={values.customerComments}
          placeholder="Customer Messaging"/>
      </div>

      <div>
        <label>Weight</label>
        <input
          aria-labelledby="weight"
          id='weight'
          name='weight'
          label='Weight'
          className="modifierInput"
          type="text"
          onChange={handleChange}
          value={values.weight}
          placeholder="0"/>
      </div>

      <div className="btnContainer">
        <Button disabled={!isFormValid} action={formSubmitHandler}>{R.isEmpty(editBillingModifier) ? 'Add' : 'Submit Changes' } </Button>
      </div>

      <style jsx>{`

      .btnContainer {
        width: 100%;
        text-align: right;
      }
      .nice-dates-popover {
        right: 5%;
      }
      .date-range {
        display: flex;
        justify-content: space-between;
      }

      .date-range_arrow:before {
        border-right: 2px solid #d3dde6;
        border-top: 2px solid #d3dde6;
        box-sizing: border-box;
        content: "";
        display: block;
        height: 18px;
        left: 50%;
        margin-left: -14px;
        margin-top: -9px;
        position: absolute;
        top: 50%;
        transform: rotate(45deg);
        width: 18px;
      }
      .date-range_arrow {
        flex-shrink: 0;
        position: relative;
        width: 36px;
      }
      .date-range .input {
        width: 100%;
      }
      .input.-focused, .input:focus {
        border-color: #438cd2;
      }
        .addNew {
          margin-top: 3em;
        }
        .modifierInput {
          width: 100%;
          margin-bottom: 15px;
        }
      `}</style>
    </div>

  )
}

export default BillingModifierForm;