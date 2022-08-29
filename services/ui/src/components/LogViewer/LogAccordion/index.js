import React, { useState, useEffect, useRef, forwardRef, Fragment } from "react";
import PropTypes from "prop-types";
import { bp, color, fontSize } from 'lib/variables';

const LogAccordion = forwardRef(({
  children,
  onToggle,
  header,
  className = "",
  defaultValue = false,
  metadata = "",
}, ref) => {
    const logsTopRef = useRef(null);
    const logsEndRef = useRef(null);
    const [visibility, setVisibility] = useState(defaultValue);
    const [scrollHidden, setScrollHidden] = useState(false);

    const scrollToTop = () => {
      logsTopRef.current.scrollIntoView({ behavior: "smooth" });
    };

    const scrollToBottom = () => {
      logsEndRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    useEffect(() => {
      if (ref && ref.current) {
        if (ref.current.clientHeight < 600) {
          setScrollHidden(true);
        }
      }
    }, [ref, visibility, scrollHidden]);

    return (
        <div className={className}>
            <div className={`accordion-heading`} onClick={(e) => {
                setVisibility(!visibility);
                if (onToggle) onToggle(!visibility);
            }}>
              <div key="1" className={ "log-header" + (visibility ? " visible" : "")} >{header} {metadata.length > 0 ? "(" + metadata + ")" : ""}</div>
            </div>
            <div ref={logsTopRef} />
            {visibility ?
              <>
                {!scrollHidden &&
                  <div className="scroll-wrapper bottom">
                    <button className={`scroll bottom`} onClick={() => scrollToBottom()}>↓</button>
                  </div>
                }
                <div ref={ref}>{children}</div>
                {!scrollHidden &&
                  <div className="scroll-wrapper top">
                    <button className={`scroll top`} onClick={() => scrollToTop()}>↑</button>
                  </div>
                }
              </>
              : null}
            <div ref={logsEndRef} />
            <style jsx>{`
                .row-heading {
                  position: relative;
                  overflow-y: hidden;
                }
                .accordion-meta-heading {
                    display: flex;
                    justify-content: flex-start;
                    background: ${color.lightestGrey};
                    padding: 5px 20px 5px 0;
                }
                .accordion-heading {
                    display: flex;
                    justify-content: space-between;
                    border: 1px solid ${color.lightestGrey};
                    background: ${color.white};
                    cursor: pointer;
                    word-break: break-word;

                    > div {
                      padding: 0 6px;
                    }
                }

                .scroll-wrapper {
                  position: absolute;
                  padding: 1em;
                  right: 0;

                  &.top {
                    bottom: 0;
                  }

                }
                button.scroll {
                  padding: 10px;
                  width: 44px;
                  color: #fff;
                  background: #3d3d3d;
                  border-radius: 50%;
                  border: none;
                  cursor: pointer;
                  line-height: 1em;
                  font-size: 1.5rem;
                  opacity: 0;

                  -webkit-transition: opacity 2s ease-in;
                  -moz-transition: opacity 2s ease-in;
                  -ms-transition: opacity 2s ease-in;
                  -o-transition: opacity 2s ease-in;
                  transition: opacity 2s ease-in;

                  &.hidden {
                    opacity: 0;
                  }
                  &.top, &.bottom {
                    opacity: 1;
                  }
                }

                //Log accordion content styling
                .accordion-heading {

                  color: black;
                  border-color: lightgrey;
                  .log-header {
                    ::before {
                      background-image: url('/static/images/logs-closed.png');
                      background-size: 8px 8px;
                      background-color: #497ffa;
                      content: " ";
                      background-position: center;
                      padding: 22px 16px;
                      background-repeat: no-repeat;
                      margin: 0 10px 0 0;
                    }
                    &.visible {
                      ::before {
                        background-image: url('/static/images/logs-opened.png');
                      }
                    }
                    margin: 20px 12px 20px 0;
                    padding: 0;
                  }
                }
                .data-row.log-error-state {
                  .accordion-heading {
                    .log-header {
                      ::before {
                        background-color: #e94a4a;
                      }
                    }
                  }
                }
            `}</style>
            <style jsx global>{`
                .log-text {
                  padding: 30px;
                }
            `}</style>
        </div>
    );
});

LogAccordion.propTypes = {
    children: PropTypes.any.isRequired,
    defaultValue: PropTypes.bool,
    className: PropTypes.string,
    onToggle: PropTypes.func,
    header: PropTypes.string,
};

export default LogAccordion;
