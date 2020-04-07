import React from 'react';
import BillingGroups from './index';

export default {
  component: BillingGroups,
  title: 'Components/BillingGroups',
}

const billingGroupsData = [
  {
    "id": "bb3-xxx-123",
    "name": "Tacos and Burritos",
    "currency": "CHF",
    "projects": [
      {
        "id": 1,
        "name": "pepsi"
      }
    ]
  },
  {
    "id": "8675-309",
    "name": "Jenny",
    "currency": "GBP",
    "projects": [
      {
        "id": 2,
        "name": "coke"
      }
    ]
  },
  {
    "id": "FF-00-00",
    "name": "Rainbows",
    "currency": "USD",
    "projects": [
      {
        "id": 5,
        "name": "red"
      },
      {
        "id": 4,
        "name": "orange"
      }
    ]
  },
];
export const Default = () => (
  <BillingGroups billingGroups={billingGroupsData} />
);

export const NoBillingGroups = () => (
  <BillingGroups billingGroups={[]} />
);
