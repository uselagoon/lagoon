import React from 'react';
import Select from 'react-select';
import { bp } from 'lib/variables';
import { color } from 'lib/variables';
import makeAnimated from 'react-select/animated';

const animatedComponents = makeAnimated();

/**
 * Displays a select filter and sends state back to parent in a callback.
 *
 */
const SelectFilter = ({ title, options, onFilterChange, loading, defaultValue, isMulti}) => {

    const handleChange = (values) => {
      onFilterChange(values);
    };

    const selectStyles = {
        container: (styles) => {
            return ({
                ...styles,
                "width": "100%"
            })
        },
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
      <div className="filter">
        <label id={`${title.toLowerCase()}-label`} className="title">{title}</label>
        <Select
            instanceId={title.toLowerCase()}
            aria-label={title}
            name={title.toLowerCase()}
            styles={selectStyles}
            closeMenuOnSelect={false}
            defaultValue={defaultValue}
            options={options}
            isMulti={isMulti}
            onChange={handleChange}
        />
        <style jsx>{`
            .title {
              margin: auto 0;
              @media ${bp.wideUp} {
                margin: auto 15px;
              }
            }
            .filter {
              margin-bottom: 1em;

              @media ${bp.wideUp} {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                flex: 2 1 auto;
                margin: 0;
              }
            }
        `}</style>
      </div>
    );
};

export const MultiSelectFilter = ({ title, options, onFilterChange, loading, defaultValue, isMulti}) => {

    const handleChange = (values) => {
      onFilterChange(values);
    };

    const selectStyles = {
        container: (styles) => {
            return ({
                ...styles,
                "width": "100%"
            })
        },
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
      <div className="multi-filter">
        <label id={`${title.toLowerCase()}-label`} className="title">{title}</label>
        <Select
            instanceId={title.toLowerCase()}
            aria-label={title}
            name={title.toLowerCase()}
            styles={selectStyles}
            closeMenuOnSelect={false}
            components={animatedComponents}
            defaultValue={defaultValue}
            options={options}
            isMulti={isMulti}
            onChange={handleChange}
        />
        <style jsx>{`
            .title {
              margin: auto 0;
              @media ${bp.wideUp} {
                margin: auto 15px;
              }
            }
            .filter {
              margin-bottom: 1em;

              @media ${bp.wideUp} {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                flex: 2 1 auto;
                margin: 0;
              }
            }
            .multi-filter {
              margin-bottom: 1em;

              @media ${bp.wideUp} {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                flex: auto;
                margin: 0;
                // width: 100%;
              }
            }
        `}</style>
      </div>
    );
};


export default SelectFilter;
