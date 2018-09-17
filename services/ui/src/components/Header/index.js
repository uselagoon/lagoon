import React from 'react';
import Link from 'next/link';
import { color } from '../../variables';

export default () => (
  <div className='header'>
    <Link href="/"><a>Home</a></Link>
    <div className="io"></div>
    <style jsx>{`
      .header {
        background: ${color.blue};
        display: flex;
        a {
          color: ${color.blue};
          padding: 14px 20px;
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
