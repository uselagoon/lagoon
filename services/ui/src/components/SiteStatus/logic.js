import React, { useState } from "react";

export const SITE_STATUSES = {
  operational: "OPERATIONAL",
  client_issues: "CLIENT_ISSUES",
  server_issues: "SERVER_ISSUES",
  unknown: "UNKNOWN",
  unavailable: "UNAVAILABLE"
};

const getSiteStatusForEnvironment = (environment) => {
  const defaultStatus = SITE_STATUSES.operational;
  const [status, setStatus] = React.useState(defaultStatus);

  const siteStatus = React.useMemo(() => {
    let { facts } = environment;

    if (facts) {
      facts.map(fact => {
        if (fact.name === 'site-code-status') {
          console.log(fact.name, fact);

          switch (fact.value) {
            case "500":
              setStatus(SITE_STATUSES.server_issues);
            case "403":
              setStatus(SITE_STATUSES.client_issues);
            break;
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

export default getSiteStatusForEnvironment;
