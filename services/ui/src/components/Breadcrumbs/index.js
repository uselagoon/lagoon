import React from 'react';
import Link from 'next/link';
import { bp, color, fontSize } from '../../variables';

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
        margin: 0 calc((100vw / 16) * 1);
      }
      .breadcrumb {
        position: relative;
        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 30px;
          width: 1px;
          height: 100%;
          background: ${color.midGrey};
          transform-origin: 100% 0;
          transform: skew(-12deg);
        }
        a {
          display: block;
          padding: 32px 16px 0 46px;
          @media ${bp.tabletUp} {
            padding: 42px 76px 0 96px;
          }
        }
        h2 {
          ${fontSize(28)};
          margin-bottom: 24px;
          @media ${bp.tabletUp} {
            ${fontSize(36)};
            margin-bottom: 38px;
          }
        }
        &:first-child {
          &::after {
            content: none;
          }
          a {
            padding-left: 0;
          }
        }
      }
  `}</style>
  </div>
);
