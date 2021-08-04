import React, { useState } from "react";

export const SITE_STATUSES = {
  operational: "OPERATIONAL",
  client_issues: "CLIENT_ISSUES",
  server_issues: "SERVER_ISSUES",
  redirect_issues: "REDIRECT_ISSUES",
  unknown: "UNKNOWN",
  unavailable: "UNAVAILABLE"
};

const getSiteStatusForEnvironment = (environment) => {
  const defaultStatus = SITE_STATUSES.operational;
  const [status, setStatus] = React.useState(defaultStatus);

  const siteStatus = React.useMemo(() => {
    if (!environment) {
      return setStatus(SITE_STATUSES.operational);
    }

    const facts = environment && environment.facts;

    if (facts) {
      facts.map(fact => {
        if (fact.name === 'site-code-status') {
          if (fact.value.startsWith("5")) {
            setStatus(SITE_STATUSES.server_issues);
          }

          if (fact.value.startsWith("4")) {
            setStatus(SITE_STATUSES.client_issues);
          }

          if (fact.value.startsWith("3")) {
            setStatus(SITE_STATUSES.redirect_issues);
          }

          if (fact.value.startsWith("2")) {
            setStatus(SITE_STATUSES.operational);
          }
        }
      })
    }

    return {
      name: environment.name,
      status: status ? status : defaultStatus
    };
  }, [status, defaultStatus]);

  return siteStatus;
};

export const getSiteStatusFromCode = (code) => {
  if (code.startsWith("5")) {
    return SITE_STATUSES.server_issues;
  }
  if (code.startsWith("4")) {
    return SITE_STATUSES.client_issues;
  }
  if (code.startsWith("3")) {
    return SITE_STATUSES.redirect_issues;
  }
  if (code.startsWith("2")) {
    return SITE_STATUSES.operational;
  }
}

export const mapStatusToIcon = (status) => {
  switch (status) {
    case SITE_STATUSES.operational:
      return "sun"
      break;

    case SITE_STATUSES.client_issues:
    case SITE_STATUSES.server_issues:
    case SITE_STATUSES.redirect_issues:
      return "moon"
      break;

    case SITE_STATUSES.unknown:
      return "warning sign"
      break;

    case SITE_STATUSES.unavailable:
      return "rain"
      break;

    default:
      return ""
      break;
  }
}


export default getSiteStatusForEnvironment;
