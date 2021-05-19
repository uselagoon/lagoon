import React from 'react';
import BillingGroup from './index';
import { data } from './data.json';

export default {
  component: BillingGroup,
  title: 'Components/BillingGroup/BillingCosts',
}

export const Default = () => (
  <BillingGroup billingGroupCosts={data.costs} />
);
