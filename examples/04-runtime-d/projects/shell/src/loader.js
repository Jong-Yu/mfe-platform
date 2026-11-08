const modules = new Map();

export function loadRemote(artifact, exposedModule) {
  const key = `${artifact.id}:${exposedModule}`;
  if (!modules.has(key)) {
    const pending = (async () => {
      await __webpack_init_sharing__('default');
      const container = await globalThis.__MFE_RUNTIME__.getArtifactContainer(artifact);
      await container.init(__webpack_share_scopes__.default);
      const factory = await container.get(exposedModule);
      return factory();
    })();
    modules.set(key, pending);
    pending.catch(() => { if (modules.get(key) === pending) modules.delete(key); });
  }
  return modules.get(key);
}
