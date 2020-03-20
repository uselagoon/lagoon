import React from 'react';
import * as R from 'ramda';
import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';


const ActiveStandby = ({ active = "", standby = "", toggleHandler}) => {
  if (active === "" || standby === "") {
    return null;
  }

  return (
    <div className="activeStandby">
      <label className="switch">
        <input type="checkbox" onChange={toggleHandler} />
        <span className="slider"></span>
      </label>
      <style jsx>{`
          /* The switch - the box around the slider */
          .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
          }

          /* Hide default HTML checkbox */
          .switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          /* The slider */
          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgb(79, 121,223);
            -webkit-transition: .4s;
            transition: .4s;
          }

          .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            -webkit-transition: .4s;
            transition: .4s;
          }

          input:checked + .slider {
            background-color: rgb(126,216,166);
          }

          input:focus + .slider {
            box-shadow: 0 0 1px rgb(126,216,166);
          }

          input:checked + .slider:before {
            -webkit-transform: translateX(26px);
            -ms-transform: translateX(26px);
            transform: translateX(26px);
          }
      `}</style>
    </div>
  );
};

export default ActiveStandby;
