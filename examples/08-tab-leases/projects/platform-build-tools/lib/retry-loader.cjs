// Generate weak references before webpack parses dependencies. DefinePlugin
// string substitution would leave require.resolveWeak calls uncompiled.
const path = require('node:path');
module.exports = function retryLoader(source) {
  const { exposes } = this.getOptions();
  const references = Object.entries(exposes).map(([request, file]) => {
    // Webpack resolves this code relative to runtime/retry.cjs. Keeping the
    // request relative also keeps sourcesContent identical after relocation.
    let relative = path.relative(this.context, file).split(path.sep).join('/');
    if (!relative.startsWith('.')) relative = './' + relative;
    return `${JSON.stringify(request)}: require.resolveWeak(${JSON.stringify(relative)})`;
  });
  return source.replace('__MFE_RETRY_EXPOSES__', `{${references.join(',')}}`);
};
