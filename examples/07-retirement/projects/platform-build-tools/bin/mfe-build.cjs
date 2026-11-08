#!/usr/bin/env node
const { buildProject } = require('../lib/build.cjs');
buildProject().catch((error) => { console.error(`mfe-build: ${error.message}`); process.exitCode = 1; });
