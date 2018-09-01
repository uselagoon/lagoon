import React from 'react';
import Link from 'next/link';
import { color } from '../../variables';

export default ({ breadcrumbs}) => (
  <div className='breadcrumbs-wrapper'>
    <div className='breadcrumbs'>
      {breadcrumbs.map(breadcrumb =>
        <div key={breadcrumb.title} className='breadcrumb'>
          <Link href={breadcrumb.query ? {pathname: breadcrumb.pathname, query: breadcrumb.query} : {pathname: breadcrumb.pathname}}>
            <a>
              <div>
                <h4>{breadcrumb.header}</h4>
                <h2>{breadcrumb.title}</h2>
              </div>
            </a>
          </Link>
        </div>)}
    </div>
    <style jsx>{`
      .breadcrumbs-wrapper {
        border-bottom: 1px solid ${color.midGrey};
      }
      .breadcrumbs {
        display:flex;
        margin: 0 auto;
        max-width: 1400px;
      }
      .breadcrumb {
        border-left: 1px solid ${color.midGrey};
        a {
          display: block;
          padding: 20px 40px;
        }
        &:first-child {
          border-left: none;
          a {
            padding-left: 20px;
          }
        }
      }
  `}</style>
  </div>
);
