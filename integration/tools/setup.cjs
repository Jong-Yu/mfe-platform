const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const projectsRoot = path.resolve(__dirname, '../../projects');
for (const name of fs.readdirSync(projectsRoot).sort()) {
  const cwd = path.join(projectsRoot, name);
  if (!fs.existsSync(path.join(cwd, 'package-lock.json'))) continue;
  const args = ['ci', '--ignore-scripts', '--no-audit', '--no-fund'];
  if (process.env.MFE_OFFLINE === '1') args.push('--offline');
  if (process.env.MFE_NPM_CACHE) args.push('--cache', process.env.MFE_NPM_CACHE);
  const result = spawnSync('npm', args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
