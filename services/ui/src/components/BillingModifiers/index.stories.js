import React from 'react';
import BillingModifiers from './AllBillingModifiers';

import { data } from './data.json';

export default {
  component: BillingModifiers,
  title: 'Components/BillingGroup/BillingModifiers',
}

export const Default = () => (
  <BillingModifiers group="Lorem" modifiers={data.allBillingModifiers} month="2020-04" />
);