import { HIT_TIERS, CURRENCY_PRICING, AVAILABILITY } from './pricing';
import { BillingModifier } from '../../models/billing';

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

export interface BillingGroupCosts {
  hitCost?: number;
  hitCostDescription?: any;
  storageCost?: number;
  storageCostDescription?: any;
  environmentCost?: { prod: number; dev: number; };
  environmentCostDescription?: any;
  total?: number;
  modifiers?: [BillingModifier];
  projects?: [any];
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
export const calculateProjectEnvironmentsTotalsToBill = environments => {
  const hits = environments.reduce(
    (acc, { type, hits: { total } }) =>
      type === 'production' ? acc + total : acc + 0,
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

export const getProjectsCosts = (currency, projects, modifiers: BillingModifier[] = []) => {
  const billingGroup = { projects, currency };
  const hitCost = hitsCost(billingGroup);
  const storage = storageCost(billingGroup);
  const prod = prodCost(billingGroup);
  const dev = devCost(billingGroup);

  const environmentCost = { prod: prod.cost, dev: dev.cost };
  const environmentCostDescription = {prod: {...prod }, dev: {...dev} };

  const hitCostDescription = { ...hitCost };
  const storageCostDescription = { ...storage };

  // Apply Modifiers
  const modifiersSortFn = (a:BillingModifier, b:BillingModifier) => a.weight < b.weight? -1 : 1
  const reducerFn: (previousValue: number, currentValue: BillingModifier) => number =
  (total, modifier) => {
    const { discountFixed, extraFixed, discountPercentage, extraPercentage } = modifier;
    total = discountFixed ? total - discountFixed : total;
    total = extraFixed ? total + extraFixed : total;
    total = discountPercentage ? total - (total * (discountPercentage / 100)) : total;
    total = extraPercentage ? total + (total * (extraPercentage / 100)) : total;
    return total;
  }
  const subTotal = hitCost.cost + storage.cost + prod.cost + dev.cost;
  const total = Math.max(0, modifiers.sort(modifiersSortFn).reduce(reducerFn, subTotal));

  return ({
    hitCost: hitCost.cost,
    hitCostDescription,
    storageCost: storage.cost,
    storageCostDescription,
    environmentCost,
    environmentCostDescription,
    total,
    modifiers,
    projects,
  }) as BillingGroupCosts;
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
  const availability = projects[0].availability === AVAILABILITY.POLYSITE ? AVAILABILITY.STANDARD : projects[0].availability;
  const tier = hitTier(hits);
  const hitsInTier = tier > 0 ? hits - HIT_TIERS[tier - 1].max : hits;
  const { availability: currencyPricingAvailability } = CURRENCY_PRICING[
    currency
  ];
  const { hitCosts, hitBase } = currencyPricingAvailability[availability];
  const hitBaseTiers = calculateHitBaseTiers(hitBase, hitCosts);

  const description = {
    projects: projects.map(({name, hits}) => ({name, hits})),
    total: hits
  }

  return tier > 0
    ? {
        cost: Number((hitBaseTiers[tier] + hitsInTier * hitCosts[tier]).toFixed(2)),
        description,
        unitPrice:  hitCosts[tier],
      }
    : {
        cost: hitBaseTiers[0],
        description,
        unitPrice:  hitCosts[tier],
      };
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
  const availability = projects[0].availability;
  const freeGBDays = availability === AVAILABILITY.POLYSITE
    ? Math.max(Math.round(projects.length / 10), 1) * (5 * days)
    : projects.length * (5 * days);
  const storageToBill = Math.max(storageDays - freeGBDays, 0);
  const averageGBsPerDay = storageDays / days;

  const description = {
    projects: projects.map(({name, storageDays}) => ({name, storage: storageDays/days})),
    included: freeGBDays/days,
    additional: storageToBill/days
  }

  return storageDays > freeGBDays
    ? {
        cost: Number((storageToBill * storagePerDay).toFixed(2)),
        description,
        unitPrice: storagePerDay,
        quantity: averageGBsPerDay
      }
    : {
        cost: 0,
        description,
        unitPrice: storagePerDay,
        quantity: averageGBsPerDay
      };
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
  const availability = projects[0].availability;
  const { prodSitePerHour } = currencyPricingAvailability[availability === AVAILABILITY.POLYSITE ? AVAILABILITY.STANDARD : availability];
  const averageProdHours = projects.reduce((acc, proj) => acc + proj.prodHours, 0) / projects.length;
  const reducerFn = ({qty, cost}, { prodHours}) => ({qty: qty + prodHours, cost: prodHours * prodSitePerHour + cost });
  const standardHighCosts = projects.reduce(reducerFn, {qty: 0, cost: 0});

  const polySiteCosts = {
    qty: averageProdHours,
    cost: Math.max(Math.round(projects.length / 10), 1) * averageProdHours * prodSitePerHour
  }

  const description = { projects: projects.map(({name, prodHours: hours}) => ({name, hours})) };

  const {cost, qty} = availability === AVAILABILITY.POLYSITE ? polySiteCosts : standardHighCosts;

  // TODO - HANDLE MORE THAN 1 PROD ENV FOR A PROJECT
  return {
    cost: Number(cost.toFixed(2)),
    description,
    unitPrice : prodSitePerHour,
    quantity: qty
  };
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
  // TODO: Once availability is set per environment change below
  // const { devSitePerHour } = currencyPricingAvailability[availability];
  const availability = projects[0].availability;
  const { devSitePerHour } = currencyPricingAvailability[AVAILABILITY.STANDARD];

  const averageDevHours = projects.reduce((acc, proj) => acc + proj.prodHours, 0) / projects.length;

  const standardHighReducerFn = (acc, project) => ({
    cost:  acc.cost + Math.max((project.devHours - (project.prodHours * 2)) * devSitePerHour, 0),
    description: [
      ...acc.description,
      {
        name: project.name,
        hours: project.devHours,
        included: project.prodHours * 2,
        additional: Math.max((project.devHours - (project.prodHours * 2)), 0)
      }
    ],
    quantity: acc.quantity + Math.max((project.devHours - (project.prodHours * 2)), 0)
  });

  const polyReducerFn = (acc, project) => ({
    cost:  Math.max(Math.round(projects.length / 10), 1) * averageDevHours * devSitePerHour,
    description: [
      ...acc.description,
      {
        name: project.name,
        hours: project.devHours,
        included: 0,
        additional: project.devHours
      }
    ],
    quantity: acc.quantity + project.devHours
  });

  const reducerFn =  availability === AVAILABILITY.POLYSITE ? polyReducerFn : standardHighReducerFn;

  const {cost, description, quantity} = projects.reduce(reducerFn, { cost: 0, description: [], quantity: 0});

  return {
    cost: Number(cost.toFixed(2)),
    description: { projects: description },
    unitPrice: devSitePerHour,
    quantity
  };
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
