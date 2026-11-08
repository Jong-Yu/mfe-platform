const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { publish, selectAdmin } = require('./store.cjs');
const directory = path.resolve(__dirname, '../../projects/platform-admin');
const result = spawnSync('npm', ['run', 'build'], { cwd: directory, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
const artifact = publish(directory);
selectAdmin(artifact.id);
console.log(`Management UI published: ${artifact.id}. Application composition unchanged.`);
