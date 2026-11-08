// Each runtime has an immutable composition; consumer aliases are local to it.
const moduleCaches = new WeakMap();
const recoveryLog = [];
const retryProtocols = new Set(['failed-modules-v1', 'failed-modules-v2']);
export function getRemoteRecoveryLog() {
  return recoveryLog.map((entry) => ({ ...entry, removed: [...entry.removed], prepared: [...entry.prepared] }));
}

async function resetFailedBranch(runtime, artifact, scope, context, visited = new Set()) {
  if (visited.has(artifact.id) || artifact.service === 'platform') return;
  visited.add(artifact.id);
  const registry = runtime.registry;
  const children = [
    ...Object.values(artifact.dependencies || {}),
    ...Object.values(registry.runtimeBindings[artifact.id] || {}),
  ];
  for (const id of children) await resetFailedBranch(runtime, registry.artifacts[id], scope, context, visited);
  if (!retryProtocols.has(artifact.retryProtocol)) return;
  const container = await runtime.getArtifactContainer(artifact);
  await container.init(scope);
  const controls = (await container.get('./__mfe_retry__'))();
  if (controls.protocol !== artifact.retryProtocol) throw new Error('Unsupported remote retry protocol');
  const failedExposes = controls.protocol === 'failed-modules-v2' ? controls.getFailedExposes() : [];
  const removed = controls.resetFailedModules();
  const record = { ...context, artifactId: artifact.id, removed, prepared: [] };
  recoveryLog.push(record);
  if (recoveryLog.length > 50) recoveryLog.shift();
  // A parent's successful get may still hold this child's factory even when
  // evaluating that factory failed. Re-run chunk/dependency loading first;
  // do not evaluate the factory or mount anything during preparation.
  for (const request of failedExposes) {
    await container.get(request);
    record.prepared.push(request);
  }
}

export async function loadRemoteDependency(consumerId, alias, exposedModule, retry) {
  if (![consumerId, alias, exposedModule].every((value) => typeof value === 'string' && value.length > 0)) {
    throw new Error('RemoteRegion requires a consumerId, alias and exposedModule.');
  }
  const runtime = globalThis.__MFE_RUNTIME__;
  if (!runtime) throw new Error('RemoteRegion requires an initialized platform runtime.');
  let modules = moduleCaches.get(runtime);
  if (!modules) { modules = new Map(); moduleCaches.set(runtime, modules); }
  const key = JSON.stringify([consumerId, alias, exposedModule]);
  if (!modules.has(key)) {
    const pending = (async () => {
      // The caller's ID must be supplied by the service. This SDK's build ID
      // is not the consumer of the requested remote.
      await __webpack_init_sharing__('default');
      const container = await runtime.getDependencyContainer(consumerId, alias);
      await container.init(__webpack_share_scopes__.default);
      if (retry) {
        const target = runtime.registry.artifacts[runtime.registry.runtimeBindings[consumerId][alias]];
        if (!retryProtocols.has(target.retryProtocol)) throw new Error('This remote build does not support local retry');
        await resetFailedBranch(runtime, target, __webpack_share_scopes__.default, { consumerId, alias, exposedModule });
      }
      const factory = await container.get(exposedModule);
      const module = factory();
      if (!module.default) throw new Error(`Missing default component: ${alias}/${exposedModule}`);
      return module;
    })();
    modules.set(key, pending);
    pending.catch(() => { if (modules.get(key) === pending) modules.delete(key); });
  }
  return modules.get(key);
}

