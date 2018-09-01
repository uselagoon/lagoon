import React from 'react';
import Link from 'next/link';
import { color } from '../../variables';

export default () => (
  <div className='header'>
    <Link href="/"><a>Home</a></Link>
    <style jsx>{`
      .header {
        background: ${color.grey};
        padding: 10px 20px;
      }
  `}</style>
  </div>
);
