import React from 'react';
import { bp, color } from 'lib/variables';

const Button = ({ action = null, href = null, disabled, children }) => {
  const ButtonElement = href ? 'a' : 'button';
  const onClick = action
    ? action
    : e => {
        if (disabled) {
          e.preventDefault();
          return false;
        }
      };
  return (
    <>
      <ButtonElement
        onClick={onClick}
        href={href}
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
    </>
  );
};

export default Button;
