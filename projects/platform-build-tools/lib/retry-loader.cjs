// Generate weak references before webpack parses dependencies. DefinePlugin
// string substitution would leave require.resolveWeak calls uncompiled.
module.exports = function retryLoader(source) {
  const { exposes } = this.getOptions();
  const references = Object.entries(exposes).map(([request, file]) =>
    `${JSON.stringify(request)}: require.resolveWeak(${JSON.stringify(file)})`);
  return source.replace('__MFE_RETRY_EXPOSES__', `{${references.join(',')}}`);
};
