import { HIT_TIERS, CURRENCY_PRICING, AVAILABILITY } from './pricing';

/* IProjectData
 * availability - Standard or High
 * storageDays - GBs used over the month (kilobytesUsed for all project environments / 1000 / 1000)
 * prodHours - Aggregated total running time of all productions environements
 * devHours - Aggregated total running time of all development environments
 * month - the month we are interested in, used for calculating the days in the month
 * year - the year we are interested in, used for calcuating the days in the month. defaults to the current year.
 */
export interface IProjectData {
  name: string;
  hits: number;
  availability: string;
  storageDays: number;
  prodHours: number;
  devHours: number;
  month: number;
  year: number;
}

export interface IBillingGroup {
  id?: number;
  name?: string;
  currency: string;
  billingSoftware?: string;
  projects: IProjectData[];
}

export const projectsDataReducer = (projects: any, objKey: string) =>
  projects.reduce((acc, obj) => acc + obj[objKey], 0);

// project availability uniformity check - find any project that has different availability
const uniformAvailabilityCheck = (projects: IProjectData[]) => {
  const found = projects.filter(
    (project, index, self) =>
      self.findIndex(p => p.availability !== project.availability) !== -1,
  );
  if (found.length !== 0) {
    throw 'Projects must have the same availability';
  }
};

// TODO: Add Comments
// TODO: This can be unit tested with mock data easily.
export const calculateProjectEnvironmentsTotalsToBill = environments => {
  const hits = environments.reduce(
    (acc, { type, hits: { total } }) =>
      type !== 'production' ? acc + total : acc + 0,
    0,
  );

  const storageDays = environments.reduce(
    (acc, { storage: { bytesUsed } }) =>
      bytesUsed === null ? acc + 0 : acc + parseInt(bytesUsed, 10),
    0,
  );

  const devHours = environments.reduce(
    (acc, { type, hours: { hours } }) =>
      type !== 'production' ? acc + hours : acc + 0,
    0,
  );

  const prodHours = environments.reduce(
    (acc, { type, hours: { hours } }) =>
      type === 'production' ? acc + hours : acc + 0,
    0,
  );

  return {
    hits,
    storageDays: storageDays / 1000 / 1000,
    prodHours,
    devHours,
  };
};

export const getProjectsCosts = (availability, currency, projects) => {
  const billingGroup = { projects, currency };
  const hitCost = hitsCost(billingGroup);
  const storage = storageCost(billingGroup);
  const prod = prodCost(billingGroup);
  const dev = devCost(billingGroup);

  const environmentCost = { environmentCost: { prod, dev } };
  return {
    [availability]: {
      hitCost,
      storageCost: storage,
      environmentCost,
      projects,
    },
  };
};

/**
 * Calculates the hit costs.
 *
 * @param {IBillingGroup} customer Customer object including:
 *
 * @return {Number} The hits cost in the currency provided
 */
export const hitsCost = ({ projects, currency }: IBillingGroup) => {
  uniformAvailabilityCheck(projects);
  const hits = projectsDataReducer(projects, 'hits');
  const availability = projects[0].availability;
  const tier = hitTier(hits);
  const hitsInTier = tier > 0 ? hits - HIT_TIERS[tier - 1].max : hits;
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
 * @param {IBillingGroup} customer Customer object including:
 *
 * @return {Number} The storage cost in the currency provided
 */
export const storageCost = ({ projects, currency }: IBillingGroup) => {
  const { storagePerDay } = CURRENCY_PRICING[currency];
  const storageDays = projectsDataReducer(projects, 'storageDays');
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
 * @param {IBillingGroup} customer Customer billing Currency
 *
 * @return {Number} The production environment cost in the currency provided
 */
export const prodCost = ({ currency, projects }: IBillingGroup) => {
  const { availability: currencyPricingAvailability } = CURRENCY_PRICING[
    currency
  ];

  const projectProdCosts = [];
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
 * @param {IBillingGroup} customer Customer billing object
 *
 * @return {Number} The development environment cost in the currency provided
 */
export const devCost = ({ currency, projects }: IBillingGroup) => {
  const { availability: currencyPricingAvailability } = CURRENCY_PRICING[
    currency
  ];

  // Each project gets two free environments per month.
  // hours in month x 2 x number of projects
  const freeDevHours = hoursInMonth(projects[0].month) * 2 * projects.length;

  // project.devHours is a sum of all development hours for each environment
  const devHours = projects.reduce((acc, project) => acc + project.devHours, 0);
  // TODO: Once availability is set per environment change below
  // const { devSitePerHour } = currencyPricingAvailability[availability];
  const { devSitePerHour } = currencyPricingAvailability[AVAILABILITY.STANDARD];
  const devToBill = Math.max(devHours - freeDevHours, 0);
  return Number((devToBill * devSitePerHour).toFixed(2));
};

// Hit Cost Helpers
export const hitTier = (hits: number) =>
  HIT_TIERS.findIndex(x => x.min <= hits && x.max >= hits);

// Calculate the hitBase tiers for a given currency minimum hitbase
const calculateHitBaseTiers = (hitBase, hitCosts) => {
  const hitBaseTiers = [Number(hitBase)];
  for (let i = 1; i < hitCosts.length; i++) {
    const previousHitTier = HIT_TIERS[i - 1];
    const hitBase = Number(
      (
        (previousHitTier.max + 1 - previousHitTier.min) * hitCosts[i - 1] +
        hitBaseTiers[i - 1]
      ).toFixed(2),
    );
    hitBaseTiers.push(hitBase);
  }
  return hitBaseTiers;
};

// HELPERS
export const hoursInMonth = (m: number) =>
  Number(daysInMonth(m, new Date(Date.now()).getFullYear()) * 24);

export const daysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();
