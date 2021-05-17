import {ProblemsHarborConnectionError, ProblemsInvalidWebhookData} from "./harborExceptions"
import * as R from 'ramda';

const DEFAULT_REPO_DETAILS_REGEX = "^(?<lagoonProjectName>.+)\/(?<lagoonEnvironmentName>.+)\/(?<lagoonServiceName>.+)$";

const DEFAULT_REPO_DETAILS_MATCHER = {
  defaultProjectName: "",
  defaultEnvironmentName: "",
  defaultServiceName: "",
  regex: DEFAULT_REPO_DETAILS_REGEX,
};


/**
 * This function will take an incoming Harbor webhook and decompose it
 * into a more useable format
 *
 * @param harborScanPatternMatchers
 * @param {*} rawData
 */
 export const validateAndTransformIncomingWebhookdata = (harborScanPatternMatchers:Array<String>, rawData) => {
    let { resources, repository } = rawData.event_data;

    if (!repository.repo_full_name) {
      throw generateError(
        'InvalidHarborInput',
        'Unable to find repo_full_name in body.event_data.repository'
      );
    }

    // scan_overview is tricky because the property doesn't have an obvious name.
    // We convert it to an array of objects with the old property as a member
    let scanOverviewArray = R.toPairs(resources[0].scan_overview).map((e) => {
      let obj = e[1];
      obj.scan_key = e[0];
      return obj;
    });

    let {
      lagoonProjectName,
      lagoonEnvironmentName,
      lagoonServiceName,
     } = matchRepositoryAgainstPatterns(repository.repo_full_name, harborScanPatternMatchers);

    return {
      resources,
      repository,
      scanOverview: scanOverviewArray.pop(),
      lagoonProjectName,
      lagoonEnvironmentName,
      lagoonServiceName,
      harborScanId: repository.repo_full_name,
    };
  };


export const extractVulnerabilities = (harborScanResponse) => {
  for (let [key, value] of Object.entries(harborScanResponse)) {
    let potentialStore: any = value;
    if (potentialStore.hasOwnProperty('vulnerabilities')) {
      return potentialStore.vulnerabilities;
    }
  }
  throw new ProblemsHarborConnectionError(
    "Scan response from Harbor does not contain a 'vulnerabilities' key"
  );
};

export const matchRepositoryAgainstPatterns = (repoFullName, matchPatterns = []) => {
    const matchingRes = matchPatterns.filter((e) => generateRegex(e.regex).test(repoFullName));

    if(matchingRes.length > 1) {
      const stringifyMatchingRes = matchingRes.reduce((prevRetString, e) => `${e.regex},${prevRetString}`, '');
      throw generateError("InvalidHarborConfiguration",
        `We have multiple matching regexes for '${repoFullName}'`
      );
    } else if (matchingRes.length == 0 && !generateRegex(DEFAULT_REPO_DETAILS_MATCHER.regex).test(repoFullName)) {
      throw generateError("HarborError",
      `We have no matching regexes, including default, for '${repoFullName}'`
      );
    }

    const matchPatternDetails = matchingRes.pop() || DEFAULT_REPO_DETAILS_MATCHER;
    const {
      lagoonProjectName = matchPatternDetails.defaultLagoonProject,
      lagoonEnvironmentName = matchPatternDetails.defaultLagoonEnvironment,
      lagoonServiceName = matchPatternDetails.defaultLagoonService,
    } = extractRepositoryDetailsGivenRegex(repoFullName, matchPatternDetails.regex);

    return {lagoonProjectName, lagoonEnvironmentName, lagoonServiceName};
  }

const extractRepositoryDetailsGivenRegex = (repoFullName, pattern = DEFAULT_REPO_DETAILS_REGEX) => {
    const re = generateRegex(pattern);
    const match = re.exec(repoFullName);
    return match.groups || {};
  }

const generateRegex = R.memoizeWith(R.identity, re => new RegExp(re));


export const generateError = (name, message) => {
    let e = new Error(message);
    e.name = name;
    return e;
  };
