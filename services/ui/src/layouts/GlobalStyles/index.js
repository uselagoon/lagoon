import React from 'react';
import { bp, color, fontSize } from 'lib/variables';

/**
 * Applies styles globally to any component nested inside it.
 */
const GlobalStyles = ({ children }) => (
  <>
    { children }
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      html, body {
        scroll-behavior: smooth;
      }

      body {
        color: ${color.black};
        font-family: 'source-sans-pro', sans-serif;
        ${fontSize(16)};
        height: 100%;
        line-height: 1.25rem;
        overflow-x: hidden;
      }

      .content-wrapper {
        background-color: ${color.almostWhite};
        flex: 1 0 auto;
        width: 100%;
      }

      #__next {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      a {
        color: ${color.black};
        text-decoration: none;

        &.hover-state {
          position: relative;
          transition: all 0.2s ease-in-out;

          &::before,
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            width: 0;
            height: 1px;
            transition: all 0.2s ease-in-out;
            transition-duration: 0.75s;
            opacity: 0;
          }
          &::after {
            left: 0;
            background-color: ${color.linkBlue};
          }
          &:hover {
            &::before,
            &::after {
              width: 100%;
              opacity: 1;
            }
          }
        }
      }

      .bulk-label a:link { color: ${color.white}; }
      .bulk-label a:visited { color: ${color.white}; }
      .bulk-label a:hover { color: ${color.white}; }
      .bulk-label a:active { color: ${color.white}; }

      p {
        margin: 0 0 1.25rem;
      }

      p a {
        text-decoration: none;
        transition: background 0.3s ease-out;
      }

      strong {
        font-weight: normal;
      }

      em {
        font-style: normal;
      }

      h2 {
        ${fontSize(36, 42)};
        font-weight: normal;
        margin: 0 0 38px;
      }

      h3 {
        ${fontSize(30, 42)};
        font-weight: normal;
        margin: 0 0 36px;
      }

      h4 {
        ${fontSize(25, 38)};
        font-weight: normal;
        margin: 4px 0 0;
      }

      ul {
        list-style: none;
        margin: 0 0 1.25rem;
        padding-left: 0;

        li {
          background-size: 8px;
          margin-bottom: 1.25rem;
          padding-left: 20px;

          a {
            text-decoration: none;
          }
        }
      }

      ol {
        margin: 0 0 1.25rem;
        padding-left: 20px;

        li {
          margin-bottom: 1.25rem;

          a {
            text-decoration: none;
          }
        }
      }

      .field {
        line-height: 25px;

        a {
          color: ${color.linkBlue};
        }
      }

      button,
      input,
      optgroup,
      select,
      textarea {
        font-family: 'source-sans-pro', sans-serif;
        line-height: 1.25rem;
      }

      label {
        color: ${color.darkGrey};
        font-family: 'source-code-pro', sans-serif;
        ${fontSize(13)};
        text-transform: uppercase;
      }

      .field-wrapper {
        display: flex;
        margin-bottom: 18px;

        @media ${bp.xs_smallUp} {
          margin-bottom: 30px;
        }

        &::before {
          @media ${bp.xs_smallUp} {
            background-position: top 11px right 14px;
            background-repeat: no-repeat;
            background-size: 20px;
            border-right: 1px solid ${color.midGrey};
            content: '';
            display: block;
            height: 60px;
            left: 0;
            margin-left: calc(((100vw / 16) * 1.5) - 25px);
            margin-right: 14px;
            padding-right: 14px;
            position: absolute;
            width: 25px;
          }
        }

        & > div {
          @media ${bp.xs_smallUp} {
            margin-top: 8px;
          }
        }
      }
    `}</style>
  </>
);

export default GlobalStyles;
