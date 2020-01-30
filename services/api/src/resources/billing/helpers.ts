import { projectEnvironmentsWithData } from '../../models/environment';
import { BillingModifier } from '../../models/billing';
import {
  calculateProjectEnvironmentsTotalsToBill,
  getProjectsCosts,
  BillingGroupCosts
} from './billingCalculations';


// helper function to split the input string
export const extractMonthYear = yearMonth => {
  const splits = yearMonth.split('-');
  return {
    month: splits[1],
    year: splits[0],
  };
};

/**
 * Creates a function to get all EnvironmentData and billing cost totals from a project.
 *   Used in map functions to iterate over a list of projects
 *
 * @param {string} yearMonth the environment id
 *
 * @return {Function} A function that takes a project and returns billing data for that month
 */
export const projectWithBillingDataFn = (
  yearMonth: string,
) => async project => {
  const { id } = project;
  const envs = await projectEnvironmentsWithData(id, yearMonth);
  const projectData = calculateProjectEnvironmentsTotalsToBill(envs);
  return { ...project, ...projectData, environments: envs };
};

/**
 * Get all billing data for the provided projects
 *
 * @param {[Project]} projects an array of project
 * @param {string} yearMonth The year month string passed in we want to get data for.
 *
 * @return {Promise<[Project]>} An array of projects with billing data
 */
export const getProjectsData = async (projects, yearMonth: string) => {
  const billingDataFn = projectWithBillingDataFn(yearMonth);
  const projectsWithData = projects.map(billingDataFn);
  return Promise.all(projectsWithData);
};

// Helper function to filter projects by availability
const availabilityFilterFn = filterKey => ({ availability }) =>
  availability === filterKey;

/**
 * Filter out High or Standard availability and calculate costs
 *
 * @param {[Project]} projects an array of projects
 * @param {string} availability High or Standard
 * @param {string} currency the currency
 *
 * @return {BillingGroupCosts} An object includeing all availability costs
 */
export const availabilityProjectsCosts = (
  projects,
  availability,
  currency,
  modifiers: BillingModifier[]
) => {
  const filteredProjects = projects.filter(availabilityFilterFn(availability));
  return (filteredProjects.length > 0
    ? getProjectsCosts(currency, filteredProjects, modifiers)
    : {}) as BillingGroupCosts;
};

export default {
  extractMonthYear,
  projectWithBillingDataFn,
  getProjectsData,
  availabilityProjectsCosts,
};
