import React from 'react';
import BillingModifiers from './AllBillingModifiers';
import ApiConnection from "lib/ApiConnection";
import mocks, { seed } from 'api/src/mocks';

seed();
const modifiers = mocks.Query().allBillingModifiers();

export default {
  component: BillingModifiers,
  title: 'Components/BillingModifiers/BillingModifiers',
}

export const Default = () => {
  return (
    <ApiConnection>
      <BillingModifiers group="Lorem" modifiers={modifiers} month="2020-04" />
    </ApiConnection>
  );
}
