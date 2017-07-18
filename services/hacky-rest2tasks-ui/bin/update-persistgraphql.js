#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sha = require('jssha');
const ExtractGQL = require('@amazee/persistgraphql/lib/src/ExtractGQL').ExtractGQL;
const addTypenameTransformer = require('@amazee/persistgraphql/lib/src/queryTransformers').addTypenameTransformer;
const inputFilePath = path.resolve(process.cwd(), 'app');
const outputFilePath = path.resolve(process.cwd(), 'app', 'shared', 'queries.json');
const queryTransformers = [addTypenameTransformer];

const extractor = new ExtractGQL({
  queryTransformers,
  inputFilePath,
  outputFilePath,
  inJsCode: true,
  extension: 'js'
});

const args = process.argv.slice(2);
const host = args[0];
const upload = args.indexOf('--upload') !== -1;

// @TODO Find a way to generate the Drupal config yaml from this.
extractor.processInputPath(extractor.inputFilePath).then(outputMap => {
  extractor
    .writeOutputMap(outputMap, extractor.outputFilePath)
    .then(() => {
      console.log(`Wrote output file to ${extractor.outputFilePath}.`);
    })
    .catch(error => {
      console.log(`Unable to process path ${extractor.outputFilePath}. Error message: `);
      console.log(error.message);
      process.exit(1);
    })
    .then(() => {
      const output = fs.readFileSync(extractor.outputFilePath).toString();
      const shaObject = new sha('SHA-1', 'TEXT');
      shaObject.update(output);
      const hash = shaObject.getHash('HEX');

      // Write the API version hash to the .env.defaults file.
      const envDefaultsFile = path.resolve(process.cwd(), '.env.defaults');
      const envDefaults = fs.readFileSync(envDefaultsFile).toString();
      fs.writeFileSync(envDefaultsFile, envDefaults.replace(/API_VERSION=".*"/g, `API_VERSION="${hash}"`));
      
      if (upload) {
        const exec = require('child_process').exec;
        const cmd = `cat ${extractor.outputFilePath} | docker exec --user drupal -i ${host} bash -c 'drupal graphql:persist --identifier ${hash}'`;

        exec(cmd, (error, stdout, stderr) => {
          console.log(stdout);

          if (error != null) {
            process.exit(1);
          }
        });
      }
    })
    .catch(error => {
      console.log(`Error while updating environment file. Error message: `);
      console.log(error.message);
      process.exit(1);
    });
});
