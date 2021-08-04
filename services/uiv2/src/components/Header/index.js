import React from 'react';
import Link from 'next/link';
import getConfig from 'next/config';
import { AuthContext } from 'lib/Authenticator';
import { color } from 'lib/variables';
import lagoonLogo from '!svg-inline-loader?classPrefix!./lagoon.svg';

import { Grid, Button, Icon, Menu, Input, Dropdown } from 'semantic-ui-react';

const { publicRuntimeConfig } = getConfig();

/**
 * Displays the header using the provided logo.
 */
const Header = ({ logo }) => {
  return (
    <div className="header">
      <Grid columns={3} stretched verticalAlign='middle'>
        <Grid.Column className="no-padding-bottom" width={1}>
          <Link href="/">
            <a className="home">
              <img
                  alt="Home"
                  src={logo ? logo : `data:image/svg+xml;utf8,${
                    publicRuntimeConfig.LAGOON_UI_ICON
                      ? publicRuntimeConfig.LAGOON_UI_ICON
                      : encodeURIComponent(lagoonLogo)
                  }`}
                />
            </a>
          </Link>
        </Grid.Column>
        <Grid.Column className="no-padding-bottom" width={11}></Grid.Column>
        <Grid.Column className="no-padding-bottom" width={4}>
          <AuthContext.Consumer>
            {auth => {
              const trigger = (auth.authenticated &&
                <span>
                  <Icon name='user outline' /> Hello, {auth.user.username}
                </span>
              );

              const options = [
                {
                  key: 'user',
                  text: (
                    <span>
                      Signed in as <strong>{auth.authenticated && auth.user.username}</strong>
                    </span>
                  ),
                  disabled: true,
                },
                { key: 'logout', onClick: () => auth.logout(), text: 'Sign Out' },
              ];

              if (auth.authenticated) {
                return (
                  <Menu secondary>
                    <Menu.Item
                      name="settings"
                      className="settings"
                      href="/settings"
                      icon="cogs"
                    />
                    <Dropdown item trigger={trigger} options={options} />
                  </Menu>
                );
              }
              return null;
            }}
          </AuthContext.Consumer>
        </Grid.Column>
      </Grid>
      <style jsx>{`
        .header {
          position: fixed;
          z-index: 110;
          height: 50px;
          width: 100%;
          justify-content: space-between;

          background: ${color.white};
          border-bottom: 1px solid #D3DAE6;

          a {
            padding: 7px 0;
            margin: auto;

            &.home {
              position: relative;
              img {
                display: block;
                height: 36px;
                width: auto;
              }
            }
            &.settings, .logout {
              cursor: pointer;
            }
          }
        }
      `}</style>
    </div>
  );
};

export default Header;
