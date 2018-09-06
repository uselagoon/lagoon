import React from 'react';
import Link from 'next/link';
import { bp, color, fontSize } from '../../variables';

export default ({ environment, project }) => {
  const environmentLabel = environment.deployType === 'branch' ? environment.deployType : 'PR';
  return (
    <div className={`environment ${environment.deployType}`} >
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
          border: 1px solid ${color.grey};
          border-radius: 4px;
          margin-bottom: 48px;
          min-height: 120px;
          position: relative;
          transition: all 0.5s ease;
          width: 100%;
          &::after {
            box-shadow: 0px 12px 40px 0px rgba(0,0,0,0.14);
            bottom: 8px;
            content: '';
            display: block;
            height: 20px;
            left: calc(50% + 80%);
            margin-left: -120%;
            position: absolute;
            width: 80%;
          }
          &:hover {
            border: 1px solid ${color.brightBlue};
            &::after {
              box-shadow: 0px 12px 40px 0px rgba(73,127,250,0.5);
            }
          }
          @media ${bp.xs_smallUp} {
            min-width: calc(50% - 24px);
            width: calc(50% - 24px);
          }
          @media ${bp.tabletUp} {
            min-width: 100%;
            width: 100%;
          }
          @media ${bp.desktopUp} {
            min-width: calc(50% - 24px);
            width: calc(50% - 24px);
          }
          @media ${bp.extraWideUp} {
            min-width: calc((100% / 3) - 32px);
            width: calc((100% / 3) - 32px);
          }
          a {
            background-color: ${color.white};
            background-position: right 32px bottom -6px;
            background-repeat: no-repeat;
            background-size: 40px 50px;
            border-radius: 4px;
            display: block;
            height: 100%;
            overflow: hidden;
            padding: 16px 20px;
            position: relative;
            z-index: 10;
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
