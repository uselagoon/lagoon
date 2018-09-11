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
                <label>{breadcrumb.header}</label>
                <h2>{breadcrumb.title}</h2>
              </div>
            </a>
          </Link>
        </div>)}
    </div>
    <style jsx>{`
      .breadcrumbs-wrapper {
        background-color: ${color.white};
        border-bottom: 1px solid ${color.midGrey};
      }
      .breadcrumbs {
        display:flex;
        margin: 0 calc((100% / 16) * 1);
      }
      .breadcrumb {
        border-left: 1px solid ${color.midGrey};
        a {
          display: block;
          padding: 42px 20px 0;
        }
        &:first-child {
          border-left: none;
          a {
            padding-left: 0;
          }
        }
      }
  `}</style>
  </div>
);
