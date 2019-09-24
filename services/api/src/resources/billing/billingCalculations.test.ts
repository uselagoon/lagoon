/* eslint-env jest */

import { CURRENCIES, AVAILABILITY } from './pricing';
import {
  hitsCost,
  storageCost,
  prodCost,
  devCost,
  hitTier,
  IBillingGroup,
  projectsDataReducer,
} from './billingCalculations';

interface IMockDataType {
  billingGroups: IBillingGroup[];
}

// month: 'July 2019',
const mockData: IMockDataType = {
  billingGroups: [
    {
      // CH - July 2019
      name: 'VF',
      currency: CURRENCIES.USD,
      billingSoftware: 'xero',
      projects: [
        {
          name: 'v-ch',
          month: 7,
          year: 2019,
          hits: 1_075,
          availability: AVAILABILITY.STANDARD,
          storageDays: 197,
          prodHours: 744,
          devHours: 0,
        },
        {
          name: 'v-web',
          month: 7,
          year: 2019,
          hits: 342_371,
          availability: AVAILABILITY.STANDARD,
          storageDays: 0,
          prodHours: 744,
          devHours: 744,
        },
      ],
    },
    {
      name: 'SV',
      currency: CURRENCIES.USD,
      billingSoftware: 'xero',
      projects: [
        {
          name: 's_com',
          month: 7,
          year: 2019,
          hits: 6_833_467,
          availability: AVAILABILITY.HIGH,
          storageDays: 784.064378,
          prodHours: 744,
          devHours: 1488,
        },
        {
          name: 's_m_com',
          month: 7,
          year: 2019,
          hits: 13_782,
          availability: AVAILABILITY.HIGH,
          storageDays: 23.725226,
          prodHours: 744,
          devHours: 744,
        },
        {
          name: 'd8beta_s_com',
          month: 7,
          year: 2019,
          hits: 0,
          availability: AVAILABILITY.HIGH,
          storageDays: 0,
          prodHours: 744,
          devHours: 1488,
        },
      ],
    },
  ],
};

const { projects: p1 } = mockData.billingGroups[0];
const { projects: p2 } = mockData.billingGroups[1];

// Unit Under Test
describe('Billing Calculations', () => {
  describe('Hit Tier', () => {
    // scenarios and expectation
    it('When hits are between { MIN: 300_001, MAX: 2_500_000 }, then the "hitTier should be 1', () => {
      // Arrange
      // Act
      const hits = projectsDataReducer(p1, 'hits');
      // Assert
      expect(hitTier(hits)).toBe(1);
    });

    it('When hits are between { MIN: 2_500_001, MAX: 10_000_000 }, then the "hitTier should be 2', () => {
      // Arrange
      // Act
      const hits = projectsDataReducer(p2, 'hits');
      // Assert
      expect(hitTier(hits)).toBe(2);
    });
  });

  describe('Hit Costs - Customers billed in US Dollars', () => {
    // scenarios and expectation
    it('Given two projects with standard availability, and hits [1_075, 342_371], the hit cost should be 75.52', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[0];
      // Act
      const cost = hitsCost(billingGroup);
      // Assert
      expect(cost).toBe(75.52);
    });

    it('Given three projects with high availability, and hits [6_833_467, 13_782, 0], the hit cost should be 1468.61', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[1];
      // Act
      const cost = hitsCost(billingGroup);
      // Assert
      expect(cost).toBe(1468.61);
    });
  });

  describe('Storage Costs - Customers billed in US Dollars', () => {
    // scenarios and expectation
    it('Given the total storage of all projects do NOT exceed the free storage tier the cost should be 0.', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[0];
      // Act
      const cost = storageCost(billingGroup);
      // Assert
      expect(cost).toBe(0);
    });

    it('Given the total storage of three projects exceed the free storage tier, GBDays [784.064378, 23.725226, 0], the cost should be 11.41.', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[1];
      // Act
      const cost = storageCost(billingGroup);
      // Assert
      expect(cost).toBe(11.41);
    });
  });

  describe('Environment Costs - Customers billed in US Dollars', () => {
    // scenarios and expectation
    it('Given a billingGroup with two projects running for the entire month of July, 2019 (744 hours) the Production costs should be 62.05', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[0];
      // Act
      const cost = prodCost(billingGroup);
      // Assert
      expect(cost).toBe(62.05);
    });

    // scenarios and expectation
    it('Given a billingGroup does not have more than the freely included development environments, the costs should be 0', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[0];
      // Act
      const cost = devCost(billingGroup);
      // Assert
      expect(cost).toBe(0);
    });
  });
});
