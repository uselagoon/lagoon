import React from 'react';
import Router from 'next/router';
import { bp, color, fontSize } from 'lib/variables';

const Breadcrumb = ({ header, title, urlObject, asPath }) => (
  <>
    <a
      href={asPath}
      onClick={e => {
        e.preventDefault();
        Router.push(urlObject, asPath);
      }}
    >
      <div className="breadcrumb">
        <div>
          <label>{header}</label>
          <h2>{title}</h2>
        </div>
      </div>
    </a>
    <style jsx>{`
      .breadcrumb {
        height: 100%;
        padding: 32px 16px 0 46px;
        position: relative;
        @media ${bp.tabletUp} {
          padding: 42px 76px 0 96px;
        }

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

        h2 {
          font-size: ${fontSize(28)};
          margin-bottom: 24px;
          @media ${bp.tabletUp} {
            font-size: ${fontSize(36)};
            margin-bottom: 38px;
          }
        }
      }

      a:first-child {
        .breadcrumb {
          padding-left: 0;

          &::after {
            content: none;
          }
        }
      }
    `}</style>
  </>
);

export default Breadcrumb;
