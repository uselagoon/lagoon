import React from 'react';
import Link from 'next/link';
import getConfig from 'next/config';
import { AuthContext } from 'lib/Authenticator';
import { color } from 'lib/variables';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

const Header = () => (
  <div className='header'>
    <Link href="/">
      <a className="home">
        <img src={`data:image/svg+xml;utf8,${publicRuntimeConfig.LAGOON_UI_ICON}`} />
      </a>
    </Link>
    <AuthContext.Consumer>
      {auth => {
        if (auth.authenticated) {
          return <a className="logout" onClick={auth.logout}>{auth.user.username} - logout</a>;
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
          &.logout {
            align-items: center;
            border-left: 1px solid ${color.blue};
            cursor: pointer;
            display: flex;
          }
        }
      }
  `}</style>
  </div>
);

export default Header;
