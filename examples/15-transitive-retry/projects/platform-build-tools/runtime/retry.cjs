// Compiled into each adopting container, so require.cache belongs to that build.
// Keep successful modules (including React, Context and mounted components) intact.
exports.protocol = 'failed-modules-v2';
exports.getFailedExposes = function getFailedExposes() {
  return Object.entries(__MFE_RETRY_EXPOSES__)
    .filter(([, id]) => require.cache[id]?.error !== undefined)
    .map(([request]) => request);
};
exports.resetFailedModules = function resetFailedModules() {
  const removed = [];
  for (const id of Object.keys(require.cache)) {
    if (require.cache[id].error !== undefined) {
      delete require.cache[id];
      removed.push(id);
    }
  }
  return removed;
};
