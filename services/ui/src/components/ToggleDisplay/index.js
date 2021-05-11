import React from 'react';
import { bp, color } from 'lib/variables';

const ToggleDisplay = ({ action = null, href = null, disabled, children, variant }) => {
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
        className={`${variant ? `btn-${variant}` : 'btn'} ${disabled ? 'btn--disabled' : ''} `}
      >
        {children}
      </ButtonElement>
      <style jsx>
        {`
          .toggle {
          
          }
        `}
      </style>
    </>
  );
};

export default ToggleDisplay;
