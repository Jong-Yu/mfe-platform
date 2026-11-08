export function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function validateArtifact(artifact) {
  if (!artifact || typeof artifact.id !== 'string' || !artifact.id || typeof artifact.name !== 'string' || !artifact.name || typeof artifact.entry !== 'string' || !artifact.entry) {
    throw new Error('Invalid remote artifact in the runtime snapshot.');
  }
}

export function createRuntime(registry, { bootURL, timeoutMs = 15000 } = {}) {
  const platform = registry?.artifacts?.platform;
  validateArtifact(platform);
  if (typeof registry.compositionId !== 'string' || !registry.compositionId) throw new Error('The registry requires a compositionId.');
  if (platform.service !== 'platform' || platform.version !== registry.platformVersion) throw new Error('The registry platform selection is inconsistent.');
  if (registry.selected?.platform !== platform.id) throw new Error('The registry does not select the advertised platform SDK.');
  const containers = new Map();
  const records = new Map();

  function withTimeout(promise, label) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
      Promise.resolve(promise).then(
        (value) => { clearTimeout(timer); resolve(value); },
        (error) => { clearTimeout(timer); reject(error); },
      );
    });
  }

  function loadEntry(artifact, record) {
    const existing = globalThis[artifact.name];
    if (existing) return Promise.resolve(existing);
    record.loadAttempts += 1;
    record.status = 'loading';
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = artifact.entry;
      script.async = true;
      script.dataset.artifact = artifact.id;
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.onload = null;
        script.onerror = null;
        if (error) {
          record.status = 'failed';
          record.lastError = error.message;
          script.remove();
          reject(error);
        } else {
          record.loadCount += 1;
          record.status = 'loaded';
          record.lastError = null;
          resolve(globalThis[artifact.name]);
        }
      };
      const timer = setTimeout(() => finish(new Error(`Remote timed out: ${artifact.entry}`)), timeoutMs);
      script.onload = () => finish(globalThis[artifact.name] ? null : new Error(`Missing container: ${artifact.name}`));
      script.onerror = () => finish(new Error(`Remote unavailable: ${artifact.entry}`));
      document.head.appendChild(script);
    });
  }

  function getArtifactContainer(artifact) {
    globalThis.__MFE_TAB_GUARD__?.ensureActive();
    validateArtifact(artifact);
    if (artifact.service === 'platform' && artifact.id !== platform.id) throw new Error('A page cannot load a second platform SDK selection.');
    let record = records.get(artifact.id);
    if (record && (record.name !== artifact.name || record.entry !== artifact.entry)) throw new Error(`Conflicting descriptor for artifact ${artifact.id}`);
    if (!record) {
      record = { id: artifact.id, name: artifact.name, entry: artifact.entry, status: 'unloaded', loadAttempts: 0, loadCount: 0, initCalls: 0, initCount: 0, lastError: null };
      records.set(artifact.id, record);
    }
    if (!containers.has(artifact.id)) {
      const pending = loadEntry(artifact, record).then((container) => {
        if (typeof container?.get !== 'function' || typeof container?.init !== 'function') throw new Error(`Invalid MF container: ${artifact.name}`);
        record.status = 'loaded';
        let shareScope;
        let initialization;
        return Object.freeze({
          get(...args) {
            return withTimeout(Promise.resolve().then(() => {
              globalThis.__MFE_TAB_GUARD__?.ensureActive();
              return container.get(...args);
            }).then((factory) => (...parameters) => {
              globalThis.__MFE_TAB_GUARD__?.ensureActive();
              return factory(...parameters);
            }), `Module ${artifact.id}:${args[0]}`);
          },
          init(scope, initScope) {
            globalThis.__MFE_TAB_GUARD__?.ensureActive();
            record.initCalls += 1;
            if (shareScope && shareScope !== scope) throw new Error(`Different share scope for ${artifact.id}`);
            shareScope = scope;
            if (!initialization) {
              // Loading the entry above never initializes sharing. Webpack owns this
              // call, avoiding a recursive __webpack_init_sharing__ wait.
              const pendingInit = withTimeout(Promise.resolve().then(() => container.init(scope, initScope)), `Initialization ${artifact.id}`);
              initialization = pendingInit;
              pendingInit.then(
                () => { record.initCount += 1; record.status = 'initialized'; record.lastError = null; },
                (error) => {
                  if (initialization === pendingInit) initialization = undefined;
                  record.status = 'init-failed';
                  record.lastError = error.message;
                },
              );
            }
            return initialization;
          },
        });
      });
      containers.set(artifact.id, pending);
      pending.catch((error) => {
        if (containers.get(artifact.id) === pending) containers.delete(artifact.id);
        record.status = 'failed';
        record.lastError = error.message;
      });
    }
    return containers.get(artifact.id);
  }

  return Object.freeze({
    registry,
    getContainer(alias) {
      if (alias !== 'platform') return Promise.reject(new Error(`Unknown runtime dependency: ${alias}`));
      return getArtifactContainer(platform);
    },
    getDependencyContainer(consumerId, alias) {
      const consumer = consumerId === registry.shell.id ? registry.shell : registry.artifacts[consumerId];
      const requirement = consumer?.runtimeDependencies?.[alias];
      const targetId = registry.runtimeBindings?.[consumerId]?.[alias];
      const target = registry.artifacts[targetId];
      if (!requirement || !target || target.service !== requirement.service || target.kind !== 'remote') {
        return Promise.reject(new Error(`Unresolved runtime dependency: ${consumerId}:${alias}`));
      }
      return getArtifactContainer(target);
    },
    getArtifactContainer,
    getDiagnostics() {
      const entries = [...records.values()].map((record) => ({ ...record }));
      return {
        compositionId: registry.compositionId,
        platformArtifactId: platform.id,
        runtimeBindings: registry.runtimeBindings,
        bootURL,
        containers: entries,
        loadedContainerIds: entries.filter((entry) => ['loaded', 'initialized', 'init-failed'].includes(entry.status)).map((entry) => entry.id),
      };
    },
  });
}
