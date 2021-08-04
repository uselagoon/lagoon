import React from 'react';
import { bp, color, fontSize } from 'lib/variables';
import { Icon, Label } from 'semantic-ui-react';

import getSiteStatusForEnvironment, { mapStatusToIcon } from 'components/SiteStatus/logic';

const SiteStatus = ({ environment, iconOnly = false }) => {

    const site_status = getSiteStatusForEnvironment(environment);

    return (
    <>
        <div className="sitestatus-wrapper">
        {site_status &&
          <div className={`status ${site_status.status.toLowerCase()}`}>
            {iconOnly &&
              <><Icon name={mapStatusToIcon(site_status.status)}/></>
            }
            {!iconOnly &&
              <Label>
                <Icon name={mapStatusToIcon(site_status.status)}/> {site_status.name}
              </Label>
            }
          </div>
        }
        </div>
        <style jsx>{`
          .sitestatus-wrapper {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            //padding: 20px;
            //background: ${color.lightestGrey};
          }
        `}
        </style>
    </>
    );
};

export default SiteStatus;
