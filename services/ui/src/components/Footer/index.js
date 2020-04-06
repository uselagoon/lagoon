import React from 'react';
import { color } from 'lib/variables';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

const Footer = () => (
  <footer>
  <span className="version">Lagoon {`${publicRuntimeConfig.LAGOON_VERSION}`}</span>
    <style jsx>{`
      footer {
        background: ${color.brightBlue} ${color.lightBlue};
        background: ${color.lightBlue};
        background: -moz-linear-gradient(left, ${color.brightBlue} 0%, ${color.lightBlue} 25%);
        background: -webkit-linear-gradient(left, ${color.brightBlue} 0%,${color.lightBlue} 25%);
        background: linear-gradient(to right, ${color.brightBlue} 0%,${color.lightBlue} 25%);
        filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='${color.brightBlue}', endColorstr='${color.lightBlue}',GradientType=1 );
        display: flex;
        justify-content: space-between;

        span {
          color: ${color.almostWhite};
          padding: 10px 20px;
          &.version {
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
        }
      }
  `}</style>
  </footer>
);

export default Footer;
