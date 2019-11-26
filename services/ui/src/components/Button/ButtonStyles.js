import React from 'react';
import { bp, color, fontSize } from 'lib/variables';

const ButtonStyles = ({ element, children, disabled, ...rest }) => {
  const ButtonElement = element;
  return (
    <React.Fragment>
      <ButtonElement
        {...rest}
        disabled={disabled}
        className={`btn ${disabled ? 'btn--disabled' : ''}`}
      >
        {children}
      </ButtonElement>
      <style jsx>
        {`
          .btn {
            background-color: ${color.lightBlue};
            border: none;
            border-radius: 3px;
            color: ${color.white};
            cursor: pointer;
            padding: 10px 30px;
            @media ${bp.tinyUp} {
              align-self: auto;
            }

            &:hover {
              background-color: ${color.blue};
            }

            &.btn--disabled {
              background-color: ${color.lightestGrey};
              color: ${color.darkGrey};
              cursor: not-allowed;
            }
          }
        `}
      </style>
    </React.Fragment>
  );
};

export default ButtonStyles;
