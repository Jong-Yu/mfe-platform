const path = require('node:path');
const { publish, activate } = require('./store.cjs');
const [project, target] = process.argv.slice(2);
if (!project || (target && !['A', 'C', 'shell'].includes(target))) {
  console.error('Usage: npm run publish -- /path/to/project [A|C|shell]');
  process.exit(1);
}
const artifact = publish(path.resolve(project));
if (target) activate({ [target]: artifact.id });
console.log(JSON.stringify({ published: artifact.id, activatedAs: target || null, entry: artifact.entry }, null, 2));
