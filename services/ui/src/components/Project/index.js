import React from 'react';
import Environment from '../EnvironmentTeaser';
import { bp, color } from '../../variables';

export default ({ project }) => (
  <div className='content-wrapper'>
    <div className='details'>
      <div className='field-wrapper created'>
        <div>
          <label>Created</label>
          <div className='field'>{project.created}</div>
        </div>
      </div>
      <div className='field-wrapper origin'>
        <div>
          <label>Origin</label>
          <div className='field'><a href='#'>gitlab.com/amazeeio/lagoon/high-cottongitlab.com/amazeeio/lagoon/high-cotton</a></div>
        </div>
      </div>
      <div className='field-wrapper giturl'>
        <div>
          <label>Git URL</label>
          <div className='field'>{project.gitUrl}</div>
        </div>
      </div>
      <div className='field-wrapper branches'>
        <div>
          <label>Branches enabled</label>
          <div className='field'>{project.branches}</div>
        </div>
      </div>
      <div className='field-wrapper prs'>
        <div>
          <label>Pull requests enabled</label>
          <div className='field'>{project.pullrequests}</div>
        </div>
      </div>
    </div>
    <div className="environments-wrapper">
      <h3>Environments</h3>
      <div className="environments">
        {!project.environments.length && `No Environments`}
        {project.environments.map(environment =>
          <Environment
            key={environment.id}
            environment={environment}
            project={project.name}
          />)}
      </div>
    </div>
    <style jsx>{`
      .content-wrapper {
        @media ${bp.tabletUp} {
          display: flex;
          justify-content: space-between;
        }
        .details {
          background-color: ${color.lightestGrey};
          border-bottom: 1px solid ${color.midGrey};
          border-right: 1px solid ${color.midGrey};
          padding: 32px calc((100% / 16) * 1);
          @media ${bp.xs_smallUp} {
            padding-left: calc(((100% / 16) * 2.5) - 15px);
          }
          @media ${bp.tabletUp} {
            min-width:50%;
            padding: 56px calc((100% / 16) * 1) 56px calc((100% / 16) * 1.5);
            width: 50%;
          }
          @media ${bp.desktopUp} {
            min-width:40%;
            padding: 56px calc((100% / 16) * 1);
            width:40%;
          }
          @media ${bp.wideUp} {
            min-width:33.33%;
            min-width: calc((100% / 16) * 5);
            width:33.33%;
            width: calc((100% / 16) * 5);
          }
          .field-wrapper {
            display: flex;
            margin-bottom: 18px;
            overflow: hidden;
            white-space: nowrap;
            @media ${bp.xs_smallUp} {
              margin-bottom: 38px;
            }
            &::before {
              @media ${bp.xs_smallUp} {
                background-position: top right 14px;
                background-repeat: no-repeat;
                background-size: 20px;
                border-right: 1px solid ${color.midGrey};
                content: '';
                display: block;
                height: 60px;
                left: 0;
                margin-right: 14px;
                min-width: calc((100% / 16) * 1.5);
                padding-right: 14px;
                position: absolute;
                width: calc((100% / 16) * 1.5);
              }
              @media ${bp.tabletUp} {
                min-width: calc((100% / 16) * 1);
                width: calc((100% / 16) * 1);
              }
              @media ${bp.desktopUp} {
                min-width: calc(((100% / 16) * 1) - 30px);
                width: calc(((100% / 16) * 1) - 30px);
              }
            }
            &.created {
              &::before {
                background-image: url('/static/images/calendar.png');
                background-size: 16px 17px;
              }
            }
            &.origin {
              &::before {
                background-image: url('/static/images/origin.png');
                background-size: 20px 20px;
              }
            }
            &.giturl {
              margin-bottom: 24px;
              @media ${bp.tinyUp} {
                margin-bottom: 74px;
              }
              &::before {
                background-image: url('/static/images/giturl.png');
                background-size: 20px 20px;
                height: 72px;
              }
              .field {
                background-color: ${color.white};
                margin-top: 6px;
                padding: 6px 15px 7px;
                @media ${bp.tinyUp} {
                  margin-left: -12px;
                  position: absolute;
                }
                @media ${bp.desktopUp} {
                  margin-left: -14px;
                }
              }
            }
            &.branches {
              &::before {
                background-image: url('/static/images/branches.png');
                background-size: 15px 20px;
              }
            }
            &.prs {
              &::before {
                background-image: url('/static/images/prs.png');
                background-size: 15px 20px;
              }
            }
          }
        }
        .environments-wrapper {
          flex-grow: 1;
          padding: 40px calc((100% / 16) * 1);
          .environments {
            display: block;
            @media ${bp.tinyUp} {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
            }
          }
        }
      }
    `}</style>
  </div>
);
