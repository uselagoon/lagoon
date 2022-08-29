import React, { useRef, useState } from 'react';
import { bp } from 'lib/variables';
import LogAccordion from 'components/LogViewer/LogAccordion';

const LogViewer = ({ logs, status = "NA" }) => (
  <React.Fragment>
    <div className="logs">
      <div className="log-viewer">{ logs !== null ? logPreprocessor(logs, status) : 'Logs are not available.'}</div>
    </div>
    <style jsx>{`
      .logs {
        padding: 0 calc(100vw / 16) 48px;
        width: 100%;
        .log-viewer {
          background-color: #222222;
          color: #d6d6d6;
          font-family: 'Monaco', monospace;
          font-size: 12px;
          font-weight: 400;
          margin: 0;
          overflow-wrap: break-word;
          overflow-x: scroll;
          white-space: pre-wrap;
          will-change: initial;
          word-break: break-all;
          word-wrap: break-word;
        }
      }
    `}</style>
  </React.Fragment>
);


const shouldLastSectionBeOpen = (status) => {
  const openstates = ["RUNNING", "ERROR", "FAILED"];
  return openstates.includes(status.toUpperCase());
}

const isLogStateBad = (status) => {
  const badstates = ["ERROR", "FAILED"];
  return badstates.includes(status.toUpperCase());
}

/**
 *
 * @param {*} logs the actual logs we're processing
 * @param {*} status a status for the build - if not complete, we open the very last item
 * @returns
 */
const logPreprocessor = (logs, status) => {
  let ret = null;
  let statusBad = isLogStateBad(status);
  let openLastSection = shouldLastSectionBeOpen(status);

  try {
    let tokens = logPreprocessorTokenize(logs);
    let sectionMetadata = logPreprocessorExtractSectionEndDetails(logs);
    let AST = logPreprocessorProcessParse(tokens, sectionMetadata);
    return logPreprocessorProcessASTToReact(AST, openLastSection, statusBad );
  } catch (e) {
    // if there are any errors parsing and transforming, we just return the logs as is.
    console.log("Error processing logs for display: " + e);
    return (<div className="processed-logs"><div key='logerror' className="log-text">{logs}</div></div>);
  }
}


const logPreprocessorRenderLogNode = (node, visible = false, errorState = false) => {
  const logsContentRef = useRef(null);

  if (node.type === "log-text") {
    return <div key={node.key} ref={logsContentRef} className="log-text">{node.text}</div>;
  }
  if (node.type === "section") {
    let classes = ["data-row","row-heading"];
    if (errorState) {
      classes.push("log-error-state");
    }
    return (
      <LogAccordion
        key={node.key}
        ref={logsContentRef}
        minified={true}
        header={node.details}
        metadata={node.metadata}
        className={classes.join(" ")}
        defaultValue={visible}
      >
        <div key={node.key + "section"} className="section-details">
          {node.nodes.map((element) => {
            return logPreprocessorRenderLogNode(element);
          })}
        </div>
      </LogAccordion>
    );
  }
  return <div></div>;
};

const logPreprocessorProcessASTToReact = (ast, lastOpen, errorState) => {
  if(ast.type != "root") {
    throw "Expecting root node to be of type 'root'";
  }
  let lastElement = ast.nodes.length - 1;
  return (<div className="processed-logs">
  {ast.nodes.map((element, i) => {
    if (i != lastElement) {
      return logPreprocessorRenderLogNode(element);
    } else {
      return logPreprocessorRenderLogNode(element, lastOpen, errorState);
    }
  })}
  </div>);
}

// Produce relatively flat AST from tokens
const logPreprocessorProcessParse = (tokens, sectionMetadata) => {
  let root = {type: "root", nodes: []};

  for(let i = 0; i < tokens.length; i++) {
    switch(tokens[i].type) {
      case("log-text"):
        root.nodes.push(tokens[i]);
      break;
      case("section-opener"):
        let metadataForSection = sectionMetadata.get(tokens[i].details.trim());
        if(metadataForSection == undefined) {
          metadataForSection = "";
        }

        let node = {type:"section", key: tokens[i].key, details: tokens[i].details, metadata: metadataForSection, nodes: []};
        if(tokens[i + 1].type == "log-text") {
          node.nodes.push(tokens[i+1]);
          i++; //increment `i` so that we're dealing with the _next_ token
        }
        root.nodes.push(node);
      break;
      default:
        throw "Unexpected type found in tokens";
      break;
    }
  }
  return root;
}


// Rather than parsing section end details into their own tokens, we'll simply extract the metadata
// from the logs as a whole, and use it to enhance the 'section' type
const logPreprocessorExtractSectionEndDetails = (logs) => {
  let ret = new Map();
  // STEP Initial Environment Setup: Completed at 2022-08-29 08:00:07 (UTC) Duration 00:00:02 Elapsed 00:00:02
  const regexp = /##############################################\n(STEP) (.+): (.+)\n##############################################/;
  const durationRegexp = /.* Duration (\d\d:\d\d:\d\d) .*/;
  let tokens = logs.split(regexp);
  for(let i = 0; i < tokens.length; i++) {
    if(tokens[i] == 'STEP') {
      // ret.set(tokens[])
      i++; let stepName = tokens[i].trim();
      i++; let stepDetails = tokens[i].trim();

      if(stepName != "" && stepDetails != "") {

        let durationArray = stepDetails.match(durationRegexp)
        if(durationArray.length == 2) {
          ret.set(stepName, `Duration: ${durationArray[1]}`);
        }
      }
    }
  }
  return ret;
}

const logPreprocessorTokenize = (logs) => {
  // tokenize
  const regexp = /##############################################\n(BEGIN) (.+)\n##############################################/;
  const beginningSectionDefaultDetails = "Logs begin";

  // The regex above will split the logs into three separate token types
  // 1. standard blocks of text
  // 2. markers for section starts containing "SECTION" only
  // 3. section header details (the second capture in the regex above)
  let tokens = logs.split(regexp);

  // if the first element is an empty string, we can discard it because
  // it's an artifact of the split
  if(tokens.length > 0 && tokens[0].length == 0) {
    tokens.shift();
  }

  let tokenizedLogs = [];
  let sectionIsOpen = false;
  for(let i = 0; i < tokens.length; i++) {
    if(tokens[i] == "BEGIN") {
      let sectionDetails = tokens[i + 1]; //we're guaranteed to have this given the match criteria

      // let sectionOpening = `<div class="logsection"><div class="logsection-details>${sectionDetails}</div><pre>`;
      tokenizedLogs.push({type:"section-opener", key:i, details:sectionDetails})
      // tokenizedLogs.push(sectionCloser + sectionOpening);
      sectionIsOpen = true;

      //we also need to _skip_ the next token, since we've already used it, and continue on
      i++; continue;
    }
    tokenizedLogs.push({type:"log-text", text: tokens[i].trim(), key: i});
  }


  // if the first element is an empty log-text, we add a section to it
  // this will ensure that everything is eventually wrapped in a section
  // even if there's one massive log
  if(tokenizedLogs.length > 0 && tokenizedLogs[0].type == "log-text") {
    tokenizedLogs.unshift({type:"section-opener", key:-1, details: beginningSectionDefaultDetails})
  }

  return tokenizedLogs;
}

export default LogViewer;
