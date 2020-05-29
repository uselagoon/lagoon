import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
const R = require('ramda');
import { bp } from 'lib/variables';
import { color } from 'lib/variables';

/**
 * Displays a select filter and sends state back to parent in a callback.
 */
const SelectFilter = ({ title, options, onFilterChange, currentValues, placeholder, isMulti}) => {
    placeholder = placeholder || '';
    
    const handleChange = (values) => {
      onFilterChange(values);
    };

    const selectStyles = {
        container: styles => ({
            ...styles,
            width: '40%'
        }),
        control: styles => ({ ...styles, backgroundColor: 'white' }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => {
            return {
                ...styles,
                backgroundColor: isDisabled && 'grey',
                cursor: isDisabled ? 'not-allowed' : 'default',
            };
        },
    };

    return (
      <>
        <label id={`${title.toLowerCase()}-label`} className="title">{title}</label>
        <Select
            instanceId={title.toLowerCase()}
            aria-label={title}
            name={title.toLowerCase()}
            styles={selectStyles}
            closeMenuOnSelect={false}
            options={options}
            isMulti={isMulti}
            onChange={handleChange}
            // value={{label: currentValues.label, value: currentValues.value}}
        />
        <style jsx>{`
            .title {
              margin: auto 0;
            }
        `}</style>
      </>
    );
};

export default SelectFilter;
