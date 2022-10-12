import React from 'react';
import css from 'styled-jsx/css';
import EnvironmentLink from 'components/link/Environment';
import BackupsLink from 'components/link/Backups';
import OrgGroupsLink from 'components/link/OrgGroups';
import OrgProjectsLink from 'components/link/OrgProjects';
import ProblemsLink from 'components/link/Problems';
import FactsLink from 'components/link/Facts';
import { bp, color } from 'lib/variables';
import problems from '../../pages/problems';
import OrganizationLink from '../link/Organization';
import OrgNewProjectLink from '../link/OrgNewProject';
import OrgNotificationsLink from '../link/OrgNotifications';

const { className: aClassName, styles: aStyles } = css.resolve`
  a {
    color: ${color.darkGrey};
    display: block;
    padding: 20px 20px 19px 60px;
    @media ${bp.wideUp} {
      padding-left: calc((100vw / 16) * 1);
    }
  }

  .active a {
    color: ${color.black};
  }
`;

const OrgNavTabs = ({ activeTab, organization }) => (
  <ul className="navigation">
    <li
      className={`overview ${
        activeTab == 'overview' ? 'active' : ''
      } ${aClassName}`}
    >
      <OrganizationLink
        organizationSlug={organization.id}
        className={aClassName}
      >
        Overview
      </OrganizationLink>
    </li>
    <li
      className={`groups ${
        activeTab == 'groups' ? 'active' : ''
      } ${aClassName}`}
    >
      <OrgGroupsLink
        organizationSlug={organization.id}
        organizationName={organization.name}
        className={aClassName}
      >
        Groups
      </OrgGroupsLink>
    </li>
    <li
      className={`projects ${
        activeTab == 'projects' ? 'active' : ''
      } ${aClassName}`}
    >
      <OrgProjectsLink
        organizationSlug={organization.id}
        organizationName={organization.name}
        className={aClassName}
      >
        Projects
      </OrgProjectsLink>
    </li>
    <li
      className={`notifications ${
        activeTab == 'notifications' ? 'active' : ''
      } ${aClassName}`}
    >
      <OrgNotificationsLink
        organizationSlug={organization.id}
        organizationName={organization.name}
        className={aClassName}
      >
        Notifications
      </OrgNotificationsLink>
    </li>
    <li
      className={`newproject ${
        activeTab == 'newproject' ? 'active' : ''
      } ${aClassName}`}
    >
      <OrgNewProjectLink
        organizationSlug={organization.id}
        organizationName={organization.name}
        className={aClassName}
      >
        New Project
      </OrgNewProjectLink>
    </li>
    <style jsx>{`
      .navigation {
        background: ${color.lightestGrey};
        border-right: 1px solid ${color.midGrey};
        margin: 0;
        z-index: 10;
        @media ${bp.tabletUp} {
          min-width: 30%;
          padding-bottom: 60px;
        }
        @media ${bp.wideUp} {
          min-width: 25%;
        }

        li {
          border-bottom: 1px solid ${color.midGrey};
          margin: 0;
          padding: 0;
          position: relative;

          &:hover {
            background-color: ${color.white};
          }

          &::before {
            background-color: ${color.linkBlue};
            background-position: center center;
            background-repeat: no-repeat;
            content: '';
            display: block;
            height: 59px;
            left: 0;
            position: absolute;
            top: 0;
            transition: all 0.3s ease-in-out;
            width: 45px;
          }

          a {
            color: ${color.darkGrey};
            display: block;
            padding: 20px 20px 19px 60px;
            @media ${bp.wideUp} {
              padding-left: calc((100vw / 16) * 1);
            }
          }

          &.active {
            &::before {
              background-color: ${color.almostWhite};
            }

            background-color: ${color.almostWhite};
            border-right: 1px solid ${color.almostWhite};
            width: calc(100% + 1px);

            a {
              color: ${color.black};
            }
          }

          &.overview {
            &::before {
              background-image: url('/static/images/overview.svg');
              background-size: 21px 16px;
            }

            &.active::before {
              background-image: url('/static/images/overview-active.svg');
            }
          }

          &.groups {
            &::before {
              background-image: url('/static/images/tasks.svg');
              background-size: 21px 16px;
            }

            &.active::before {
              background-image: url('/static/images/tasks-active.svg');
            }
          }

          &.projects {
            &::before {
              background-image: url('/static/images/tasks.svg');
              background-size: 21px 16px;
            }

            &.active::before {
              background-image: url('/static/images/tasks-active.svg');
            }
          }

          &.notifications {
            &::before {
              background-image: url('/static/images/tasks.svg');
              background-size: 21px 16px;
            }

            &.active::before {
              background-image: url('/static/images/tasks-active.svg');
            }
          }

          &.newproject {
            &::before {
              background-image: url('/static/images/tasks.svg');
              background-size: 21px 16px;
            }

            &.active::before {
              background-image: url('/static/images/tasks-active.svg');
            }
          }
        }
      }
    `}</style>
    {aStyles}
  </ul>
);

export default OrgNavTabs;
