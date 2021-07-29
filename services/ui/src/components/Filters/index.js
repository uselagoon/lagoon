import React from 'react';
import Select, { components } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import makeAnimated from 'react-select/animated';

import { bp } from 'lib/variables';
import { color } from 'lib/variables';

const animatedComponents = makeAnimated();

/**
 * Displays a select filter and sends state back to parent in a callback.
 *
 */
const SelectFilter = ({
  title, options, onFilterChange, loading, defaultValue, isMulti, placeholder
}) => {

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
        placeholder={placeholder}
        isMulti={isMulti}
        onChange={handleChange}
      />
      <style jsx>{`
        .title {
          margin: auto 0;
          @media ${bp.wideUp} {
            margin: auto;
            padding-right: 20px;
          }
        }
        .filter {
          margin-bottom: 1em;
          font-size: 0.9em;

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

export const MultiSelectFilter = ({
  title,
  options,
  onFilterChange,
  loading,
  defaultValue,
  isMulti,
  placeholder,
  ref
}) => {

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
        ref={ref}
        instanceId={title.toLowerCase()}
        aria-label={title}
        name={title.toLowerCase()}
        styles={selectStyles}
        closeMenuOnSelect={false}
        components={animatedComponents}
        defaultValue={defaultValue}
        options={options}
        isMulti={isMulti}
        placeholder={placeholder}
        onChange={handleChange}
      />
      <style jsx>{`
        .title {
          margin: auto 0;
          padding: 1em 0;
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
          font-size: 0.9em;

          @media ${bp.wideUp} {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export const MultiCreatableSelectFilter = ({
  title,
  options,
  onFilterChange,
  loading,
  defaultValue,
  isMulti,
  placeholder,
  ref
}) => {

  const handleChange = (values) => {
    onFilterChange(values);
  };

  const SelectContainer = ({ children, ...props }) => {
    return (
      <div>
        <components.SelectContainer {...props}>
          {children}
        </components.SelectContainer>
      </div>
    );
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
      <CreatableSelect
        ref={ref}
        isClearable
        instanceId={title.toLowerCase()}
        aria-label={title}
        name={title.toLowerCase()}
        styles={selectStyles}
        closeMenuOnSelect={true}
        components={animatedComponents}
        defaultValue={defaultValue}
        // getOptionLabel={option => option.label ? `${option.label} (${option.value})` : `${option.value}`}
        options={options}
        isMulti={isMulti}
        placeholder={placeholder}
        onChange={handleChange}
      />
      <style jsx>{`
        .title {
          margin: auto 0;
          padding: 1em 0;
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
          font-size: 0.9em;

          @media ${bp.wideUp} {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};


export default SelectFilter;
