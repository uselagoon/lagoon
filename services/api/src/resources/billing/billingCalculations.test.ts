import { CURRENCIES, AVAILABILITY } from './pricing';
import {
  hitsCost,
  storageCost,
  prodCost,
  devCost,
  hitTier,
  IBillingGroup,
  projectsDataReducer
} from './billingCalculations';

interface ITestBillingGroup extends IBillingGroup {
  expectations?: {
    hits: number;
    storage: number;
    prod: number;
    dev: number;
  };
}
interface IMockDataType {
  billingGroups: ITestBillingGroup[];
}

// month: 'July 2019',
const mockData: IMockDataType = {
  billingGroups: [
    {
      // CH - July 2019
      name: 'VF',
      expectations: {
        hits: 75.52,
        storage: 0,
        prod: 62.05,
        dev: 0
      },
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
          devHours: 0
        },
        {
          name: 'v-web',
          month: 7,
          year: 2019,
          hits: 342_371,
          availability: AVAILABILITY.STANDARD,
          storageDays: 0,
          prodHours: 744,
          devHours: 744
        }
      ]
    },
    {
      name: 'SV',
      expectations: {
        hits: 1468.61,
        storage: 11.41,
        prod: 310.02,
        dev: 0
      },
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
          devHours: 1488
        },
        {
          name: 's_m_com',
          month: 7,
          year: 2019,
          hits: 13_782,
          availability: AVAILABILITY.HIGH,
          storageDays: 23.725226,
          prodHours: 744,
          devHours: 744
        },
        {
          name: 'd8beta_s_com',
          month: 7,
          year: 2019,
          hits: 0,
          availability: AVAILABILITY.HIGH,
          storageDays: 0,
          prodHours: 744,
          devHours: 1488
        }
      ]
    },
    {
      name: 'FC',
      expectations: {
        hits: 1265.95,
        storage: 22.18,
        prod: 206.68,
        dev: 62.05
      },
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
          devHours: 5208
        },
        {
          name: 'mil_fc_com',
          month: 8,
          year: 2019,
          hits: 279_553,
          availability: AVAILABILITY.HIGH,
          storageDays: 4.80221,
          prodHours: 744,
          devHours: 2232
        }
      ]
    },
    {
      name: 'Swiss - OYW',
      expectations: {
        hits: 55.0,
        storage: 0,
        prod: 51.63,
        dev: 25.6
      },
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
          devHours: 1488
        },
        {
          name: 'oyw',
          month: 8,
          year: 2019,
          hits: 102_352,
          availability: AVAILABILITY.STANDARD,
          storageDays: 45.075144,
          prodHours: 744,
          devHours: 3695
        }
      ]
    },
    {
      name: 'MIS',
      expectations: {
        hits: 55,
        storage: 0,
        prod: 25.82,
        dev: 0
      },
      currency: CURRENCIES.GBP,
      billingSoftware: '',
      projects: [
        {
          name: 'co',
          month: 8,
          year: 2019,
          hits: 86_766,
          availability: AVAILABILITY.STANDARD,
          storageDays: 0,
          prodHours: 744,
          devHours: 0
        }
      ]
    },
    {
      name: 'AUS-COM',
      expectations: {
        hits: 481.37,
        storage: 0,
        prod: 446.4,
        dev: 203.58
      },
      currency: CURRENCIES.AUD,
      billingSoftware: '',
      projects: [
        {
          name: 'fta',
          month: 8,
          year: 2019,
          hits: 0,
          availability: AVAILABILITY.STANDARD,
          storageDays: 12,
          prodHours: 744,
          devHours: 0
        },
        {
          name: 'cd',
          month: 8,
          year: 2019,
          hits: 14186,
          availability: AVAILABILITY.STANDARD,
          storageDays: 101,
          prodHours: 744,
          devHours: 2_232
        },
        {
          name: 'zpor',
          month: 8,
          year: 2019,
          hits: 0,
          availability: AVAILABILITY.STANDARD,
          storageDays: 25,
          prodHours: 744,
          devHours: 649
        },
        {
          name: 'zpub',
          month: 8,
          year: 2019,
          hits: 20_938,
          availability: AVAILABILITY.STANDARD,
          storageDays: 23,
          prodHours: 744,
          devHours: 744
        },
        {
          name: 'apmpor',
          month: 8,
          year: 2019,
          hits: 0,
          availability: AVAILABILITY.STANDARD,
          storageDays: 4,
          prodHours: 0,
          devHours: 2_137
        },
        {
          name: 'zhi',
          month: 8,
          year: 2019,
          hits: 234,
          availability: AVAILABILITY.STANDARD,
          storageDays: 3,
          prodHours: 744,
          devHours: 0
        },
        {
          name: 'moa',
          month: 8,
          year: 2019,
          hits: 240_264,
          availability: AVAILABILITY.STANDARD,
          storageDays: 121,
          prodHours: 744,
          devHours: 382
        },
        {
          name: 'flt',
          month: 8,
          year: 2019,
          hits: 555_994,
          availability: AVAILABILITY.STANDARD,
          storageDays: 74,
          prodHours: 744,
          devHours: 1_999
        },
        {
          name: 'pha',
          month: 8,
          year: 2019,
          hits: 788_270,
          availability: AVAILABILITY.STANDARD,
          storageDays: 164,
          prodHours: 744,
          devHours: 744
        }
      ]
    }
  ]
};

// {
//   name: '',
//   expectations: {
//     hits: -999,
//     storage: -999,
//     prod: -999,
//     dev: -999,
//   },
//   currency: CURRENCIES.USD,
//   billingSoftware: '',
//   projects: [
//     {
//       name: '',
//       month: ,
//       year: 2019,
//       hits: ,
//       availability: AVAILABILITY.,
//       storageDays: ,
//       prodHours: ,
//       devHours: ,
//     },
//   ],
// },

const { projects: p1 } = mockData.billingGroups[0];
const { projects: p2 } = mockData.billingGroups[1];

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const hitsCostTestString = (group: ITestBillingGroup) =>
  `Given ${group.projects.length} project(s) with ${
    group.projects[0].availability
  } availability and hits [${group.projects
    .map(project => project.hits)
    .join()}], during ${
    monthNames[group.projects[0].month - 1]
  } the cost should be ${group.expectations.hits} #hits #${group.currency} #${
    group.name
  }: `;

const storageCostTestString = (group: ITestBillingGroup) =>
  `Given the total storage of ${
    group.projects.length
  } project(s), and GBDays [${group.projects
    .map(project => project.storageDays)
    .join()}], during ${
    monthNames[group.projects[0].month - 1]
  } the cost should be ${group.expectations.storage}. #storage #${
    group.currency
  } #${group.name}`;

const prodEnvironmentCostTestString = (group: ITestBillingGroup) =>
  `Given a billing group with ${
    group.projects.length
  } project(s), running for [${group.projects
    .map(project => project.prodHours)
    .join()}] hours during ${
    monthNames[group.projects[0].month - 1]
  } the cost should be ${group.expectations.prod}. #prod #${group.currency} #${
    group.name
  } `;

const devEnvironmentCostTestString = (group: ITestBillingGroup) =>
  `Given a billing group with ${
    group.projects.length
  } project(s), running for [${group.projects
    .map(project => project.devHours)
    .join()}] hours during ${
    monthNames[group.projects[0].month - 1]
  } the cost should be ${group.expectations.dev}. #dev #${group.currency} #${
    group.name
  }`;

const currencyFilter = currency => group =>
  group.currency === CURRENCIES[currency];

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

  describe('Hit Costs - Customers billed in US Dollars (USD) #Hits #USD', () => {
    // scenarios and expectation
    mockData.billingGroups.filter(currencyFilter(CURRENCIES.USD)).map(group => {
      it(hitsCostTestString(group), () => {
        // Act
        const cost = hitsCost(group);
        // Assert
        expect(cost).toBe(group.expectations.hits);
      });
    });
  });

  describe('Hit Costs - Customers billed in Pounds (GBP) #Hits #GBP', () => {
    // scenarios and expectation
    mockData.billingGroups.filter(currencyFilter(CURRENCIES.GBP)).map(group => {
      it(hitsCostTestString(group), () => {
        // Act
        const cost = hitsCost(group);
        // Assert
        expect(cost).toBe(group.expectations.hits);
      });
    });
  });

  describe('Storage Costs - Customers billed in US Dollars (USD) #Storage #USD', () => {
    // scenarios and expectation
    mockData.billingGroups.filter(currencyFilter(CURRENCIES.USD)).map(group => {
      it(storageCostTestString(group), () => {
        // Act
        const cost = storageCost(group);
        // Assert
        expect(cost).toBe(group.expectations.storage);
      });
    });
  });

  describe('Storage Costs - Customers billed in Pounds (GBP) #Storage #GBP', () => {
    // scenarios and expectation
    mockData.billingGroups.filter(currencyFilter(CURRENCIES.GBP)).map(group => {
      it(storageCostTestString(group), () => {
        // Act
        const cost = storageCost(group);
        // Assert
        expect(cost).toBe(group.expectations.storage);
      });
    });
  });

  describe('Prod Environment Costs - Customers billed in US Dollars (USD) #Environment #USD', () => {
    // scenarios and expectation
    mockData.billingGroups.filter(currencyFilter(CURRENCIES.USD)).map(group => {
      it(prodEnvironmentCostTestString(group), () => {
        // Act
        const cost = prodCost(group);
        // Assert
        expect(cost).toBe(group.expectations.prod);
      });
    });
  });

  describe('Dev Environment Costs - Customers billed in US Dollars (USD) #Environment #USD', () => {
    // scenarios and expectation
    mockData.billingGroups.filter(currencyFilter(CURRENCIES.USD)).map(group => {
      it(devEnvironmentCostTestString(group), () => {
        // Act
        const cost = devCost(group);
        // Assert
        try {
          expect(cost).toBe(group.expectations.dev);
        } catch (exception) {
          console.log(group);
          throw exception;
        }
      });
    });
  });

  describe('Environment Costs - Customers billed in Pounds (GBP) #Environment #GBP', () => {
    // scenarios and expectation
    mockData.billingGroups.filter(currencyFilter(CURRENCIES.GBP)).map(group => {
      it(prodEnvironmentCostTestString(group), () => {
        // Act
        const cost = prodCost(group);
        // Assert
        expect(cost).toBe(group.expectations.prod);
      });

      it(devEnvironmentCostTestString(group), () => {
        // Act
        const cost = devCost(group);
        // Assert
        expect(cost).toBe(group.expectations.dev);
      });
    });
  });
}); // End Billing Calculations
