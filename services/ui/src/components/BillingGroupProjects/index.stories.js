import React from 'react';
// import Projects from './Projects';
import BillingGroupProjects from './index'

import { data } from './data.json';

export default {
  component: BillingGroupProjects,
  title: 'Components/BillingGroup/Projects',
}

export const Default = () => (
  <BillingGroupProjects projects={data.costs.projects} />
);