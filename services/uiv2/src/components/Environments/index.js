import React from 'react';
import * as R from 'ramda';
import css from 'styled-jsx/css';
import EnvironmentLink from 'components/link/Environment';
import Box from 'components/Box';
import { bp, color, fontSize } from 'lib/variables';
import moment from 'moment';

import { getLastCompletedDeployment } from 'lib/util';

const bgImages = {
  branch: {
    normal: "url('/static/images/environment-branch.svg')",
    hover: "url('/static/images/environment-branch-hover.svg')"
  },
  pullrequest: {
    normal: "url('/static/images/environment-pull-request.svg')",
    hover: "url('/static/images/environment-pull-request-hover.svg')"
  },
  none: {
    normal: 'none',
    hover: 'none'
  }
};

const { className: boxClassName, styles: boxStyles } = css.resolve`
  .box {
    margin-bottom: 46px;

    .content {
      background-position: right 32px bottom -6px;
      background-repeat: no-repeat;
      background-size: 40px 50px;
      min-height: 150px;
      padding: 20px 20px;

      &.label {
        padding: 20px 40px 20px 20px;
      }

      &.detailed {
        min-height: 270px;
      }
    }
  }
`;

const Environments = ({ environments = [], display }) => {
  if (environments.length === 0) {
    return null;
  }

  return (
    <div className="environments">
      {environments.map(environment => {
        const bgImage = R.propOr(
          bgImages.none,
          environment.deployType,
          bgImages
        );
        const { className: bgClassName, styles: bgStyles } = css.resolve`
          .content {
            background-image: ${bgImage.normal};

            &:hover {
              background-image: ${bgImage.hover};
            }
          }
        `;
        const isProduction = environment.environmentType == 'production' && true || false;
        const isActive = (environment.project.productionEnvironment && environment.project.standbyProductionEnvironment && environment.project.productionEnvironment == environment.name) && true || false;
        const isStandby = (environment.project.productionEnvironment && environment.project.standbyProductionEnvironment && environment.project.standbyProductionEnvironment == environment.name) && true || false;
        const isPullRequest = (environment.deployType === 'pullrequest') && true;
        const hasLabel = isProduction || isActive || isStandby || false;

        return (
          <div className="environment" key={environment.id}>
            <EnvironmentLink
              environmentSlug={environment.openshiftProjectName}
              projectSlug={environment.project.name}
            >
              {display === 'list' && (
                <Box className={`${boxClassName} ${bgClassName} ${display} ${hasLabel ? 'label' : 'no-label'}`}>
                  {isProduction && (
                    <div className="productionLabel">
                      <span>Production</span>
                    </div>
                  )}
                  {isActive && (
                    <div className="activeLabel">
                      <span>Active</span>
                    </div>
                  )}
                  {isStandby && (
                    <div className="standbyLabel">
                      <span>Standby</span>
                    </div>
                  )}
                  <label>
                    {isPullRequest
                      ? 'PR'
                      : environment.deployType}
                  </label>
                  <h4>{environment.name}</h4>
                </Box>
              )}
              {display === 'detailed' && (
              <Box className={`${boxClassName} ${bgClassName} ${display} ${hasLabel ? 'label' : 'no-label'}`}>
                 {isProduction && (
                  <div className="productionLabel">
                    <span>Production</span>
                  </div>
                )}
                {isActive && (
                  <div className="activeLabel">
                    <span>Active</span>
                  </div>
                )}
                {isStandby && (
                  <div className="standbyLabel">
                    <span>Standby</span>
                  </div>
                )}
                <label>
                  {isPullRequest
                    ? 'PR'
                    : environment.deployType}
                </label>
                <h4>{environment.name}</h4>
                {environment.deployments.length !== 0 &&
                  <div className="last-deployed">
                    <div>Last deployed:</div>
                    {getLastCompletedDeployment(environment.deployments)}
                  </div>
                }
                {environment.facts && environment.facts.map((f, index) => {
                  if (f.keyFact) {
                   return (
                     <div key={`${f.name}-${index}`} className="fact">
                       <div className="fact-name">{f.name}</div>
                       <div className="fact-value">{f.value}</div>
                     </div>
                   )
                  }
                })}
              </Box>
              )}
            </EnvironmentLink>
            {bgStyles}
          </div>
        );
      })}
      <style jsx>{`
        .environments {
          display: block;
          @media ${bp.tinyUp} {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;

            &::after {
              content: '';
              flex: auto;
            }
          }
        }

        .environment {
          width: 100%;
          @media ${bp.xs_smallUp} {
            margin-left: 48px;
            min-width: calc(50% - 24px);
            width: calc(50% - 24px);
          }
          @media ${bp.xs_small} {
            &:nth-child(2n + 1) {
              margin-left: 0;
            }
          }
          @media ${bp.tabletUp} {
            margin-left: 0;
            min-width: 100%;
            width: 100%;
          }
          @media ${bp.desktopUp} {
            margin-left: 48px;
            min-width: calc(50% - 24px);
            width: calc(50% - 24px);
          }
          @media ${bp.desktop_extrawide} {
            &:nth-child(2n + 1) {
              margin-left: 0;
            }
          }
          @media ${bp.extraWideUp} {
            min-width: calc((100% / 3) - 32px);
            width: calc((100% / 3) - 32px);
            &:nth-child(3n + 1) {
              margin-left: 0;
            }
          }
        }

        .productionLabel {
          color: ${color.green};
          font-size: ${fontSize(13)};
          position: absolute;
          right: -38px;
          text-transform: uppercase;
          top: 50%;
          transform: translateY(-50%) rotate(-90deg);

          &::after {
            border-top: 1px solid ${color.grey};
            content: '';
            display: block;
            position: relative;
            right: 12px;
            top: -12px;
            width: calc(100% + 26px);
            z-index: -1;
          }

          span {
            background-color: ${color.white};
            padding: 0 16px;
            z-index: 0;
          }
        }

        .standbyLabel {
          color: ${color.blue};
          font-size: ${fontSize(13)};
          position: absolute;
          right: 0px;
          text-transform: uppercase;
          top: 50%;
          transform: translateY(-50%) rotate(-90deg);

          &::after {
            border-top: 1px solid ${color.grey};
            content: '';
            display: block;
            position: relative;
            right: 12px;
            top: -12px;
            width: calc(100% + 26px);
            z-index: -1;
          }

          span {
            background-color: ${color.white};
            padding: 0 16px;
            z-index: 0;
          }
        }

        .activeLabel {
          color: ${color.green};
          font-size: ${fontSize(13)};
          position: absolute;
          right: 0px;
          text-transform: uppercase;
          top: 50%;
          transform: translateY(-50%) rotate(-90deg);

          &::after {
            border-top: 1px solid ${color.grey};
            content: '';
            display: block;
            position: relative;
            right: 12px;
            top: -12px;
            width: calc(100% + 26px);
            z-index: -1;
          }

          span {
            background-color: ${color.white};
            padding: 0 16px;
            z-index: 0;
          }
        }

        .last-deployed, .fact {
          display: flex;
          font-size: 0.8em;
          justify-content: space-between;
        }

        label {
          background-color: ${color.lightestGrey};
          border-bottom-right-radius: 20px;
          border-top-right-radius: 20px;
          margin-left: -20px;
          padding: 3px 20px 2px;
        }
      `}</style>
      {boxStyles}
    </div>
  );
};

export default Environments;
