import React from 'react';
import Link from 'next/link';
import { color } from '../../variables';

export default () => (
  <div className='header'>
    <Link href="/"><a>Home</a></Link>
    <style jsx>{`
      .header {
        background: ${color.blue};
        padding: 14px 20px;
        a {
          color: ${color.white};
        }
      }
  `}</style>
  </div>
);
