import React from 'react';
import BillingGroupProjects from './index';
import { data } from './data.json';
import ApiConnection from "lib/ApiConnection";

export default {
  component: BillingGroupProjects,
  title: 'Components/BillingGroupProjects',
}

export const Default = () => (
  <ApiConnection>
    <BillingGroupProjects projects={data.costs.projects} />
  </ApiConnection>
);
