import React from 'react';
import Link from 'next/link';
import { AuthContext } from '../../lib/withAuth';
import { color } from '../../variables';

export default () => (
  <div className='header'>
    <Link href="/"><a>Home</a></Link>
    <div className="io"></div>
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
        background: ${color.blue};
        display: flex;
        a {
          color: ${color.almostWhite};
          padding: 14px 20px;
        }
        a.logout {
          background: ${color.lightBlue};
          cursor: pointer;
        }
        .io {
          background: url('/static/images/header.png') left center no-repeat ${color.lightBlue};
          background-size: auto 48px;
          flex-grow: 1;
        }
      }
  `}</style>
  </div>
);
