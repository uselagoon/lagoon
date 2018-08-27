import React from 'react';

export default ({ environment }) => {
  const productionLabel = environment.environmentType == 'production' ? <div>Prod</div> : '';
  return (
    <div>
      {productionLabel}
      <label>Branch</label>
      <div>{environment.name}</div>
    </div>
  );
};
