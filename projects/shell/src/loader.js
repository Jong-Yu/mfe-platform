const modules = new Map();

export function loadRemote(artifact, exposedModule) {
  const key = `${artifact.id}:${exposedModule}`;
  if (!modules.has(key)) {
    const pending = (async () => {
      const runtime = globalThis.__MFE_RUNTIME__;
      const scope = await runtime.initializeSharing();
      const container = await runtime.getArtifactContainer(artifact);
      await container.init(scope);
      const factory = await container.get(exposedModule);
      return factory();
    })();
    modules.set(key, pending);
    pending.catch(() => { if (modules.get(key) === pending) modules.delete(key); });
  }
  return modules.get(key);
}
