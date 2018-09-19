#!/usr/bin/env node

const importLocal = require('import-local');

// Try using locally installed version and fall back to global version
const localImportFailed = !importLocal(__filename);

if (localImportFailed) {
  require('../build').run();
}
