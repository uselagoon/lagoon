import React from 'react';
import { Button, Icon } from 'semantic-ui-react';

import { bp, color } from 'lib/variables';

const ToggleDisplay = ({ action = null, disabled, children, icon, variant }) => {
  const onClick = action ? action : e => {
    if (disabled) {
      e.preventDefault();
      return false;
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      icon={icon}
      className={`${variant ? `btn-${variant}` : 'btn'} ${disabled ? 'btn--disabled' : ''} `}
    >
      {children}
    </Button>
  );
};

export default ToggleDisplay;
