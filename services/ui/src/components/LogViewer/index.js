import React from 'react';
import { bp } from 'lib/variables';

const LogViewer = ({ logs }) => (
  <React.Fragment>
    <div className="logs">
      <div className="log-viewer">{logs || 'Logs are not available.'}</div>
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
          min-height: 600px;
          margin: 0;
          overflow-wrap: break-word;
          overflow-x: scroll;
          padding: calc((100vw / 16) * 0.5) calc(100vw / 16);
          white-space: pre-wrap;
          will-change: initial;
          word-break: break-all;
          word-wrap: break-word;

          @media ${bp.xs_smallUp} {
            padding: 30px;
          }
        }
      }
    `}</style>
  </React.Fragment>
);


const logPreprocessor = (logs):String => {
  try {
    let tokens = logPreprocessorTokenize(logs);
  } catch (e) {
    // if there are any errors parsing and transforming, we just return the logs as is.
    return logs;
  }
}


const logPreprocessorRenderLogNode = (node) => {
  if (node.type === "logText") {
    return <div className="logText">{node.text}</div>;
  }
  if (node.type === "section") {
    return (
      <div className="section">
        <div className="sectionDetails">{node.details}</div>
        <div className="sectionDetails">
          {node.nodes.map((element) => {
            return renderLogNode(element);
          })}
        </div>
      </div>
    );
  }
  return <div></div>;
};

const logPreprocessorProcessASTToReact = (ast) {
  if(ast.type != "root") {
    throw "Expecting root node to be of type 'root'";
  }

  return (<div className="processedLogs">
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
      case("logText"):
        root.nodes.push(tokens[i]);
      break;
      case("sectionOpener"):
        //two cases here - either the next token is a logText and then a sectionCloser, or it's a sectionCloser
        let node = {type:"section", details: tokens[i].details, nodes: []};
        if(tokens[i + 1].type == "logText") {
          node.nodes.push(tokens[i+1]);
          i++; //increment `i` so that we're dealing with the _next_ token
        }
        if(tokens[i+1].type != "sectionCloser") { //something has gone wrong
          throw "Expected a 'sectionCloser'";
        }
        i++; //will bring us over the section closer
        root.nodes.push(node);
      break;
      case("sectionCloser"):
        //this should give us an error
        throw "A 'sectionCloser' should not appear here";
      break;
      default:
        throw "Unexpected type found in tokens";
      break;
    }
  }
  return root;
}

const logPreprocessorTokenize = (logs:string) => {
  // tokenize
  const regexp = /\<\<\<\<\< (SECTION):(.*) \<\<\<\<\</;

  // The regex above will split the logs into three separate token types
  // 1. standard blocks of text
  // 2. markers for section starts containing "SECTION" only
  // 3. section header details (the second capture in the regex above)
  let tokens = logs.split(regexp);
  // process

  let tokenizedLogs = [];
  let sectionIsOpen = false;
  for(let i = 0; i < tokens.length; i++) {
    if(tokens[i] == "SECTION") {
      let sectionDetails = tokens[i + 1]; //we're guaranteed to have this given the match criteria

      if(sectionIsOpen) { //we need to add a closing div for the last section
        tokenizedLogs.push({type:"sectionCloser"});
      }
      // let sectionOpening = `<div class="logsection"><div class="logsection-details>${sectionDetails}</div><pre>`;
      tokenizedLogs.push({type:"sectionOpener", details:sectionDetails})
      // tokenizedLogs.push(sectionCloser + sectionOpening);
      sectionIsOpen = true;

      //we also need to _skip_ the next token, since we've already used it, and continue on
      i++; continue;
    }
    tokenizedLogs.push({type:"logText", text: tokens[i].trim()});
  }

  // We need to close up any outstanding sections
  if(sectionIsOpen) {
    tokenizedLogs.push({type:"sectionCloser"});
  }

  return tokenizedLogs;
}

export default LogViewer;
