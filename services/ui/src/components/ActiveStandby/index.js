import React, {useState} from 'react';
import * as R from 'ramda';
import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';
import Button from 'components/Button';


const ActiveStandby = ({ activeEnvironment = "", standbyEnvironment = "", changeHandler}) => {
  if (activeEnvironment === "" || standbyEnvironment === "") {
    return null;
  }

  const [values, setValues] = useState();
  const handleChange = e => {
    const {name, value} = e.target;
    setValues({...values, [name]: value});

    if (value !== activeEnvironment){
      changeHandler()
    }
  }

  return (
    <div className="activeStandby">
      <select
        id="activeEnvironment"
        name="activeEnvironment"
        className="activeEnvironment"
        onChange={handleChange}
        aria-labelledby="Active Branch"
        label='Switch Active Branch'
      >
        <option value={activeEnvironment}>{activeEnvironment}</option>
        <option value={standbyEnvironment}>{standbyEnvironment}</option>
      </select>
      <style jsx>{`
          .activeEnvironment {
            background-size: 14px;
            border: 1px solid ${color.midGrey};
            height: 40px;
            padding: 0 12px 0 34px;
            transition: border 0.5s ease;
            @media ${bp.smallOnly} {
              margin-bottom: 20px;
              order: -1;
              width: 100%;
            }
            @media ${bp.tabletUp} {
              width: 100%;
            }
            &::placeholder {
              color: ${color.midGrey};
            }
            &:focus {
              border: 1px solid ${color.brightBlue};
              outline: none;
            }
          }
      `}</style>
    </div>
  );
};

export default ActiveStandby;
