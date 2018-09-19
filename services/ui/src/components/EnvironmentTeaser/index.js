import React from 'react';
import Link from 'next/link';
import { bp, color, fontSize } from '../../variables';

export default ({ environment, project }) => {
  const environmentLabel = environment.deployType === 'branch' ? environment.deployType : 'PR';
  return (
    <div className={`environment box ${environment.deployType}`} >
      <Link
        href={{ pathname: '/environment', query: { name: environment.openshiftProjectName } }}
      >
        <a>
          {environment.environmentType == 'production' ? <div className='productionLabel'><span>Production</span></div> : ''}
          <label>{environmentLabel}</label>
          <h4>{environment.name}</h4>
        </a>
      </Link>
      <style jsx>{`
        .environment {
          margin-bottom: 48px;
          min-height: 120px;
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
          a {
            background-position: right 32px bottom -6px;
            background-repeat: no-repeat;
            background-size: 40px 50px;
          }
          &.branch {
            a {
              background-image: url('/static/images/branch.png');
              &:hover {
                background-image: url('/static/images/branch-hover.png');
              }
            }
          }
          &.pullrequest {
            a {
              background-image: url('/static/images/pr.png');
              &:hover {
                background-image: url('/static/images/pr-hover.png');
              }
            }
          }
          .productionLabel {
            color: ${color.green};
            ${fontSize(13)};
            position: absolute;
            right: -38px;
            text-transform: uppercase;
            top: 50%;
            transform: translateY(-50%) rotate(-90deg);
            span {
              background-color: ${color.white};
              padding: 0 16px;
              z-index: 0;
            }
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
          }
          label {
            background-color: ${color.lightestGrey};
            border-bottom-right-radius: 20px;
            border-top-right-radius: 20px;
            margin-left: -20px;
            padding: 3px 20px 2px;
          }
        }
      `}</style>
    </div>
  );
};
