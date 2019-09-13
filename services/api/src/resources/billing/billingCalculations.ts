import { HIT_TIERS, CURRENCY_PRICING } from './pricing';

/* ICustomerProjectBillingData
 * availability - Standard or High
 * storageDays - GBs used over the month (kilobytesUsed for all project environments / 1000 / 1000)
 * prodHours - Aggregated total running time of all productions environements
 * devHours - Aggregated total running time of all development environments
 * month - the month we are interested in, used for calculating the days in the month
 * year - the year we are interested in, used for calcuating the days in the month. defaults to the current year.
 */
export interface ICustomerProjectBillingData {
  name: string;
  hits: number;
  availability: string;
  storageDays: number;
  prodHours: number;
  devHours: number;
  month: number;
  year: number;
}

export interface ICustomer {
  id?: number;
  name?: string;
  currency: string;
  billingSoftware?: string;
  projects: ICustomerProjectBillingData[];
}

export const customerProjectsDataReducer = (projects: any, objKey: string) =>
  projects.reduce((acc, obj) => acc + obj[objKey], 0);

// project availability uniformity check - find any project that has different availability
const uniformAvailabilityCheck = (projects: ICustomerProjectBillingData[]) => {
  const found = projects.filter(
    (project, index, self) =>
      self.findIndex(p => p.availability !== project.availability) !== -1
  );
  if (found.length !== 0) {
    throw 'Projects must have the same availability';
  }
};

/**
 * Calculates the hit costs.
 *
 * @param {ICustomer} customer Customer object including:
 *
 * @return {Number} The hits cost in the currency provided
 */
export const hitsCost = ({ projects, currency }: ICustomer) => {
  uniformAvailabilityCheck(projects);
  const hits = customerProjectsDataReducer(projects, 'hits');
  const availability = projects[0].availability;
  const tier = hitTier(hits);
  const hitsInTier = hits - HIT_TIERS[tier - 1].max;
  const { availability: currencyPricingAvailability } = CURRENCY_PRICING[
    currency
  ];
  const { hitCosts, hitBase } = currencyPricingAvailability[availability];
  const hitBaseTiers = calculateHitBaseTiers(hitBase, hitCosts);

  return tier > 0
    ? Number((hitBaseTiers[tier] + hitsInTier * hitCosts[tier]).toFixed(2))
    : hitBaseTiers[0];
};

/**
 * Calculates the storage costs.
 *
 * @param {ICustomer} customer Customer object including:
 *
 * @return {Number} The storage cost in the currency provided
 */
export const storageCost = ({ projects, currency }: ICustomer) => {
  const { storagePerDay } = CURRENCY_PRICING[currency];
  const storageDays = customerProjectsDataReducer(projects, 'storageDays');
  const days = daysInMonth(projects[0].month, projects[0].year);
  const freeGBDays = projects.length * (5 * days);
  const storageToBill = Math.max(storageDays - freeGBDays, 0);
  // const averageGBsPerDay = storageDays / days;

  return storageDays > freeGBDays
    ? Number((storageToBill * storagePerDay).toFixed(2))
    : 0;
};

/**
 * Calculates the production cost.
 *
 * @param {ICustomer} customer Customer billing Currency
 *
 * @return {Number} The production environment cost in the currency provided
 */
export const prodCost = ({ currency, projects }: ICustomer) => {
  const { availability: currencyPricingAvailability } = CURRENCY_PRICING[
    currency
  ];

  let projectProdCosts = [];
  projects.map(project => {
    const { prodHours, availability } = project;
    const { prodSitePerHour } = currencyPricingAvailability[availability];
    projectProdCosts.push(prodHours * prodSitePerHour);
  });

  // TODO - HANDLE MORE THAN 1 PROD ENV FOR A PROJECT
  return Number(projectProdCosts.reduce((acc, obj) => acc + obj, 0).toFixed(2));
};

/**
 * Calculates the development environment cost.
 *
 * @param {ICustomer} customer Customer billing object
 *
 * @return {Number} The production environment cost in the currency provided
 */
export const devCost = ({ currency, projects }: ICustomer) => {
  const { availability: currencyPricingAvailability } = CURRENCY_PRICING[
    currency
  ];
  const freeDevHours = hoursInMonth(projects[0].month) * 2;

  let projectDevCosts = [];
  projects.map(project => {
    const { devHours, availability } = project;
    const { devSitePerHour } = currencyPricingAvailability[availability];

    const devToBill = Math.max(devHours - freeDevHours, 0);
    projectDevCosts.push(devToBill * devSitePerHour);
  });

  return Number(projectDevCosts.reduce((acc, obj) => acc + obj, 0).toFixed(2));
};

// Hit Cost Helpers
export const hitTier = (hits: number) =>
  HIT_TIERS.findIndex(x => {
    return x.min <= hits && x.max >= hits;
  });

// Calculate the hitBase tiers for a given currency minimum hitbase
const calculateHitBaseTiers = (hitBase, hitCosts) => {
  const hitBaseTiers = [Number(hitBase)];
  for (let i = 1; i < hitCosts.length; i++) {
    const previousHitTier = HIT_TIERS[i - 1];
    const hitBase = Number(
      (
        (previousHitTier.max + 1 - previousHitTier.min) * hitCosts[i - 1] +
        hitBaseTiers[i - 1]
      ).toFixed(2)
    );
    hitBaseTiers.push(hitBase);
  }
  return hitBaseTiers;
};

// HELPERS
export const hoursInMonth = (m: number) => {
  return Number(daysInMonth(m, new Date(Date.now()).getFullYear()) * 24);
};

export const daysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};
