import React from 'react';
import BillingGroupBarChart from './index'

import { data } from './data.json';

export default {
  component: BillingGroupBarChart,
  title: 'Components/BillingGroup/BarChart',
}

export const Default = () => (
  <BillingGroupBarChart data={data.costs} />
);