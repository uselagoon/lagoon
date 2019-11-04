import { MariaClient } from 'mariasql';
import { Project } from '../../models/project';
import { projectEnvironmentsWithData } from '../../models/environment';
import {
  calculateProjectEnvironmentsTotalsToBill,
  getProjectsCosts,
} from './billingCalculations';

// helper function to split the input string
const getYearMonthFromString = yearMonth => {
  const splits = yearMonth.split('-');
  return {
    month: splits[1],
    year: splits[0],
  };
};

/**
 * Creates a function to reduce a project to only the fields needed for billing costs
 *   Used in map functions to iterate over a list of projects
 *
 * @param {string} yearMonth the environment id
 *
 * @return {Function} A function that takes an environment and returns billing data
 */
export const projectSimplifiedWithMonthYear = (yearMonth: string) => ({
  id,
  name,
  availability,
}: Project) => {
  const { year, month } = getYearMonthFromString(yearMonth);
  return {
    id,
    name,
    availability,
    month,
    year,
  };
};

/**
 * Creates a function to get all EnvironmentData and billing cost totals from a project.
 *   Used in map functions to iterate over a list of projects
 *
 * @param {string} yearMonth the environment id
 * @param {MariaClient} sqlClient the sqlClient
 *
 * @return {Function} A function that takes a project and returns billing data for that month
 */
export const projectWithBillingDataFn = (
  yearMonth: string,
  sqlClient: MariaClient,
) => async project => {
  const { id } = project;
  const envs = await projectEnvironmentsWithData(id, yearMonth, sqlClient);
  const projectData = calculateProjectEnvironmentsTotalsToBill(envs);
  return { ...project, ...projectData, environments: envs };
};

/**
 * Get all billing data for the provided projects
 *
 * @param {[Project]} projects an array of project
 * @param {string} yearMonth The year month string passed in we want to get data for.
 * @param {MariaClient} sqlClient the sqlClient
 *
 * @return {Promise<[Project]>} An array of projects with billing data
 */
export const getProjectsData = async (
  projects,
  yearMonth: string,
  sqlClient,
) => {
  const billingDataFn = projectWithBillingDataFn(yearMonth, sqlClient);
  const projectsWithData = projects.map(billingDataFn);
  return Promise.all(projectsWithData);
};

// helper function to filter projects by availability
const availabilityFilterFn = filterKey => ({ availability }) =>
  availability === filterKey;

/**
 * Filter out High or Standard availability and calculate costs
 *
 * @param {[Project]} projects an array of projects
 * @param {string} availability High or Standard
 * @param {string} currency the currency
 *
 * @return {object} An object includeing all availability costs
 */
export const availabiltyProjectsCosts = (projects, availability, currency) => {
  const filteredProjects = projects.filter(availabilityFilterFn(availability));
  return filteredProjects.length > 0
    ? getProjectsCosts(availability, currency, filteredProjects)
    : {};
};
