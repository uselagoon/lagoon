import React from 'react';
import Link from 'next/link';
import getConfig from 'next/config';
import { AuthContext } from 'lib/Authenticator';
import { color } from 'lib/variables';
import lagoonLogo from '!svg-inline-loader?classPrefix!./lagoon.svg';

const { publicRuntimeConfig } = getConfig();

/**
 * Displays the header using the provided logo.
 */
const Header = ({ logo }) => (
  <div className='header'>
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
    <AuthContext.Consumer>
      {auth => {
        if (auth.authenticated) {
          return (<div className="authContainer"><a className="settings" href="/settings">settings</a> <a className="logout" onClick={auth.logout}>{auth.user.username} - logout</a></div>);
        }

        return null;
      }}
    </AuthContext.Consumer>
    <style jsx>{`
      .header {
        background: ${color.brightBlue} ${color.lightBlue};
        background: ${color.lightBlue};
        background: -moz-linear-gradient(left, ${color.brightBlue} 0%, ${color.lightBlue} 25%);
        background: -webkit-linear-gradient(left, ${color.brightBlue} 0%,${color.lightBlue} 25%);
        background: linear-gradient(to right, ${color.brightBlue} 0%,${color.lightBlue} 25%);
        filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='${color.brightBlue}', endColorstr='${color.lightBlue}',GradientType=1 );
        display: flex;
        justify-content: space-between;

        .authContainer {
          display: flex;
        }

        a {
          color: ${color.almostWhite};
          padding: 10px 20px;
          &.home {
            background: ${color.blue};
            position: relative;
            img {
              display: block;
              height: 28px;
              width: auto;
            }
            &::after {
              background: ${color.blue};
              clip-path: polygon(0 0,100% 0,0 105%,0 100%);
              content: '';
              display: block;
              height: 100%;
              position: absolute;
              right: -13px;
              top: 0;
              width: 14px;
            }
          }
          &.settings {
            align-items: center;
            border-left: 1px solid ${color.blue};
            cursor: pointer;
            display: flex;
            &::before {
              background-position: center center;
              background-repeat: no-repeat;
              content: '';
              display: block;
              height: 35px;
              transition: all 0.3s ease-in-out;
              width: 35px;
              background-image: url('/static/images/cog.svg');
              background-size: 18px;
            }
          }
          &.logout {
            align-items: center;
            cursor: pointer;
            display: flex;
          }
        }
      }
    `}</style>
  </div>
);

export default Header;
