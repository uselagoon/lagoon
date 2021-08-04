import React from 'react';
import { color } from 'lib/variables';

/**
 * Displays a box, given an optional class name.
 */
const Box = ({ className = '', children }) => (
  <>
    <div className={`box ${className}`}>
      <div className={`content ${className}`}>{children}</div>
    </div>
    <style jsx>{`
      .box {
        border: 1px solid ${color.lightestGrey};
        box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
        border-radius: 3px;
        position: relative;
        width: 100%;

        &::after {
          bottom: 4px;
          content: '';
          display: block;
          height: 20px;
          left: 15px;
          position: absolute;
          transition: box-shadow 0.5s ease;
          width: calc(100% - 30px);
        }

        &:hover {
          border: 1px solid ${color.brightBlue};

          &::after {
            box-shadow: 0px 12px 40px 0px rgba(73, 127, 250, 0.5);
          }
        }

        .content {
          background-color: ${color.white};
          height: 100%;
          overflow: hidden;
          padding: 16px 20px;
          position: relative;
          transition: background-image 0.5s ease-in-out;
          z-index: 10;
        }
      }
    `}</style>
  </>
);

export default Box;
