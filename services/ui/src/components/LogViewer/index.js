import React from 'react';
import { bp } from 'lib/variables';
import LogAccordion from 'components/LogViewer/LogAccordion';

const LogViewer = ({ logs }) => (
  <React.Fragment>
    <div className="logs">
      <div className="log-viewer">{logPreprocessor(logs) || 'Logs are not available.'}</div>
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
    {/* <style jsx global>{`
        .accordion-heading {
          color: black;
          border-color: lightgrey !important;
        }
        .log-text {
          padding: 30px;
        }
    `}</style> */}
  </React.Fragment>
);


const logPreprocessor = (logs) => {
  let ret = null;
  try {
    let tokens = logPreprocessorTokenize(logs);
    let AST = logPreprocessorProcessParse(tokens);
    return logPreprocessorProcessASTToReact(AST);
  } catch (e) {
    // if there are any errors parsing and transforming, we just return the logs as is.
    console.log("Error processing logs for display: " + e);
    return (<div className="processed-logs"><div key='logerror' className="log-text">{logs}</div></div>);
  }
}


const logPreprocessorRenderLogNode = (node) => {
  if (node.type === "log-text") {
    return <div key={node.key} className="log-text">{node.text}</div>;
  }
  if (node.type === "section") {
    return (
      <LogAccordion key={node.key} minified={true} header={node.details} className="data-row row-heading">
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

const logPreprocessorProcessASTToReact = (ast) => {
  if(ast.type != "root") {
    throw "Expecting root node to be of type 'root'";
  }

  return (<div className="processed-logs">
  {ast.nodes.map((element) => {
    return logPreprocessorRenderLogNode(element);
  })}
  </div>);
}

// Produce relatively flat AST from tokens
const logPreprocessorProcessParse = (tokens) => {
  let root = {type: "root", nodes: []};

  for(let i = 0; i < tokens.length; i++) {
    switch(tokens[i].type) {
      case("log-text"):
        root.nodes.push(tokens[i]);
      break;
      case("section-opener"):
        let node = {type:"section", key: tokens[i].key, details: tokens[i].details, nodes: []};
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

const logPreprocessorTokenize = (logs) => {
  // tokenize
  const regexp = /<<<<< (SECTION):([\w\-\s]+)<<<<</;
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
    if(tokens[i] == "SECTION") {
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
