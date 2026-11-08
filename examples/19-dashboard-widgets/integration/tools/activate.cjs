const { activate, rollback } = require('./store.cjs');
try {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === '--composition') {
    console.log(JSON.stringify(rollback(args[1]), null, 2));
  } else {
    const changes = {};
    const bindings = {};
    for (let i = 0; i < args.length; i += 2) {
      const role = args[i].replace(/^--/, '');
      if (role === 'bind') {
        const match = /^([A-Za-z0-9_.+-]+):([A-Za-z][A-Za-z0-9_/-]*)=([A-Za-z0-9_.+-]+)$/.exec(args[i + 1] || '');
        if (!match) throw new Error('Usage: --bind CONSUMER_ARTIFACT_ID:ALIAS=TARGET_ARTIFACT_ID');
        const [, owner, alias, target] = match;
        if (bindings[owner]?.[alias]) throw new Error(`Duplicate binding argument: ${owner}:${alias}`);
        (bindings[owner] ||= {})[alias] = target;
        continue;
      }
      if (!['platform', 'shell', 'A', 'C'].includes(role) || !args[i + 1]) throw new Error('Usage: --platform ID, --shell ID, --A ID, --C ID, --bind OWNER:ALIAS=TARGET, or --composition ID');
      changes[role] = args[i + 1];
    }
    if (!args.length) throw new Error('Choose at least one artifact or a rollback composition');
    const result = activate(changes, bindings);
    console.log(JSON.stringify({ compositionId: result.compositionId, platformVersion: result.platformVersion, selected: result.selected, runtimeBindings: result.runtimeBindings }, null, 2));
  }
} catch (error) { console.error(`Activation rejected: ${error.message}`); process.exitCode = 1; }
