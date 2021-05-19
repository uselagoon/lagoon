import React from 'react';
import { bp, color, fontSize } from 'lib/variables';
import getSiteStatusForEnvironment from 'components/SiteStatus/logic';



const SiteStatus = ({ environment }) => {

    const site_status = getSiteStatusForEnvironment(environment);

    return (
    <>
        <div className="sitestatus-wrapper">
        {site_status &&
            <div className={`status ${site_status.status.toLowerCase()}`}>
                <label>{site_status.name}:</label><i className="status-icon"></i>
                <span className="status-text">({site_status.status})</span>
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
          
          .status {
            color: #222222;
            font-size: 0.7em;
          }
          .status-icon {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              display: inline-block;
              margin: 0 5px;
              
              .operational & {
                background: mediumseagreen;
              }
              .client_issues &, .server_issues & {
                background: orange;
              }
              .unavailable & {
                background: indianred;
              }
              .unknown & {
                background: gray;
              }
            }
          .operational {
            color: mediumseagreen;
          }
          .client_issues &, .server_issues & {
              color: orange;
          }
          .unavailable {
          color: indianred;
          }
          .unknown {
            color: gray;
          }
        `}
        </style>
    </>
    );
};

export default SiteStatus;
