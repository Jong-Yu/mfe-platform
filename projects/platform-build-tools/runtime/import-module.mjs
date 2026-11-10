// Retry failed network loads with a fresh URL, preserving successful ESM state.
if (!globalThis.__MFE_IMPORT__) {
  const loads = new Map();
  const failures = new Map();
  globalThis.__MFE_IMPORT__ = function importModule(request) {
    const url = new URL(request, globalThis.location?.href).href;
    if (!loads.has(url)) {
      const attempt = failures.get(url) || 0;
      const target = new URL(url);
      if (attempt) target.searchParams.set('mfe_retry', String(attempt));
      const pending = import(/* @vite-ignore */ target.href);
      loads.set(url, pending);
      pending.catch(error => {
        if (loads.get(url) === pending) loads.delete(url);
        if (/Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Failed to load module script/i.test(error?.message || '')) {
          failures.set(url, attempt + 1);
          error.code = 'MFE_CHUNK_LOAD';
        }
      });
    }
    return loads.get(url);
  };
}
