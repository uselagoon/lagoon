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
    {
      name: 'FC',
      currency: CURRENCIES.USD,
      billingSoftware: '',
      projects: [
        {
          name: 'fc_com',
          month: 8,
          year: 2019,
          hits: 5_120_109,
          availability: AVAILABILITY.HIGH,
          storageDays: 971.194088,
          prodHours: 744,
          devHours: 5208,
        },
        {
          name: 'mil_fc_com',
          month: 8,
          year: 2019,
          hits: 279_553,
          availability: AVAILABILITY.HIGH,
          storageDays: 4.80221,
          prodHours: 744,
          devHours: 2232,
        },
      ],
    },
    {
      name: 'OYW',
      currency: CURRENCIES.GBP,
      billingSoftware: '',
      projects: [
        {
          name: 'l2030',
          month: 8,
          year: 2019,
          hits: 56_147,
          availability: AVAILABILITY.STANDARD,
          storageDays: 16.897876,
          prodHours: 744,
          devHours: 1488,
        },
        {
          name: 'oyw',
          month: 8,
          year: 2019,
          hits: 102_352,
          availability: AVAILABILITY.STANDARD,
          storageDays: 45.075144,
          prodHours: 744,
          devHours: 3695,
        },
      ],
    },
  ],
};

const { projects: p1 } = mockData.billingGroups[0];
const { projects: p2 } = mockData.billingGroups[1];

// Unit Under Test
describe('Billing Calculations', () => {
  describe('Hit Tier #hit-tier', () => {
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

  describe('Hit Costs - Customers billed in US Dollars (USD) #USD', () => {
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

    it('Given two projects with high availability, and hits [5,120,109, 279,553], the hit cost should be 1,265.95', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[2];
      // Act
      const cost = hitsCost(billingGroup);
      // Assert
      expect(cost).toBe(1265.95);
    });
  });

  describe('Hit Costs - Customers billed in Pounds (GBP) #Hits #GBP', () => {
    // scenarios and expectation
    it('Given two projects with standard availability, and hits [56,147, 102,352], the hit cost should be 55.00', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[3];
      // Act
      const cost = hitsCost(billingGroup);
      // Assert
      expect(cost).toBe(55.0);
    });
  });

  describe('Storage Costs - Customers billed in US Dollars (USD) #Storage #USD', () => {
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

  describe('Storage Costs - Customers billed Pounds (GBP) #Storage #GBP', () => {
    // scenarios and expectation
    it('Given the total storage of two projects [971.194088, 4.80221] the cost should be 22.18.', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[2];
      // Act
      const cost = storageCost(billingGroup);
      // Assert
      expect(cost).toBe(22.18);
    });
  });

  describe('Environment Costs - Customers billed in US Dollars (USD) #Environment #USD', () => {
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

  describe('Environment Costs - Customers billed in Pounds (GBP) #Environment #GBP', () => {
    // scenarios and expectation
    it('Given a billingGroup with two projects in August running all month, the costs should be 206.68', () => {
      // Arrange
      const billingGroup = mockData.billingGroups[2];
      // Act
      const cost = prodCost(billingGroup);
      // Assert
      expect(cost).toBe(206.68);
    });
  });
}); // End Billing Calculations
