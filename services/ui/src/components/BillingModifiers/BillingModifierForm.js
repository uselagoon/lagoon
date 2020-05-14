import React, { useState } from 'react';
import css from 'styled-jsx/css';
import Button from 'components/Button';

import moment from 'moment';

import { enGB } from 'date-fns/locale'
import { DateRangePicker, START_DATE, END_DATE } from 'react-nice-dates'

import 'react-nice-dates/build/style.css'

const BillingModifierForm = ({group, submitHandler}) => {

  const defaultValues = {
    startDate: '',
    endDate: '',
    modifierType: 'discountFixed',
    modifierValue: '',
    customerComments: '',
    adminComments: '',
    weight: 0,
  };
  const [values, setValues] = useState(defaultValues);

  const handleChange = e => {
    const {name, value} = e.target;
    setValues({...values, [name]: value});
  }


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
      customerComments: values.customerComments,
      adminComments: values.adminComments,
      weight: values.weight !== 0 ? parseInt(values.weight): 0
    };

    submitHandler(variables)
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
          />
          <span className='date-range_arrow' />
          <input
            id="endDate"
            name="endDate"
            className={'input' + (focus === END_DATE ? ' -focused' : '')}
            placeholder='End date (YYYY-MM-DD)'
            onChange={handleChange}
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
        >
          {[
            {name: 'Discount: Fixed', value: 'discountFixed'}, 
            {name: 'Discount: Percentage (0-100)', value: 'discountPercentage'},
            {name: 'Extra: Fixed', value: 'extraFixed'}, 
            {name: 'Extra: Percentage (0-100)', value: 'extraPercentage'} 
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
        <Button disabled={!isFormValid} action={formSubmitHandler}>Add</Button>
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