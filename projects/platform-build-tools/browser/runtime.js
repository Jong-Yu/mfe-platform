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
  const entryAttempts = new Map();
  let sharedScope = globalThis.__MFE_SHARE_SCOPE__ || {};
  let sharingInitialization;

  function setShareScope(scope) {
    if (!scope || typeof scope !== 'object') throw new Error('Invalid Module Federation share scope.');
    sharedScope = scope;
    return scope;
  }

  function getShareScope() {
    if (globalThis.__MFE_SHARE_SCOPE__) setShareScope(globalThis.__MFE_SHARE_SCOPE__);
    return sharedScope;
  }

  function initializeSharing() {
    if (!sharingInitialization) {
      const pending = Promise.resolve().then(async () => {
        const scope = await globalThis.__MFE_INITIALIZE_SHARING__?.();
        if (scope) setShareScope(scope);
        return getShareScope();
      });
      sharingInitialization = pending;
      pending.catch(() => { if (sharingInitialization === pending) sharingInitialization = undefined; });
    }
    return sharingInitialization;
  }

  function importEntry(entry) {
    const url = new URL(entry, document.baseURI).href;
    if (globalThis.__MFE_IMPORT__) return globalThis.__MFE_IMPORT__(url);
    const attempt = entryAttempts.get(url) || 0;
    const request = new URL(url);
    if (attempt) request.searchParams.set('mfe_retry', String(attempt));
    return import(/* @vite-ignore */ request.href).catch(error => {
      entryAttempts.set(url, attempt + 1);
      throw error;
    });
  }

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
    if (artifact.format === 'esm') {
      record.loadAttempts += 1;
      record.status = 'loading';
      return withTimeout(importEntry(artifact.entry), `Remote ${artifact.id}`).then(container => {
        record.loadCount += 1;
        record.status = 'loaded';
        record.lastError = null;
        return container;
      });
    }
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
    if (record && (record.name !== artifact.name || record.entry !== artifact.entry || record.format !== (artifact.format || 'var'))) throw new Error(`Conflicting descriptor for artifact ${artifact.id}`);
    if (!record) {
      record = { id: artifact.id, name: artifact.name, entry: artifact.entry, format: artifact.format || 'var', status: 'unloaded', loadAttempts: 0, loadCount: 0, initCalls: 0, initCount: 0, lastError: null };
      records.set(artifact.id, record);
    }
    if (!containers.has(artifact.id)) {
      const pending = loadEntry(artifact, record).then((container) => {
        if (typeof container?.get !== 'function' || typeof container?.init !== 'function') throw new Error(`Invalid MF container: ${artifact.name}`);
        record.status = 'loaded';
        let containerScope;
        let initialization;
        const factories = new Map();
        const failedExposes = new Set();
        const retryControls = Object.freeze({
          protocol: 'vite-preflight-v1',
          getFailedExposes: () => [...failedExposes],
          resetFailedModules() {
            // Vite's importer retries only rejected URLs. Browser ESM caches are
            // never deleted; successful modules and their identities stay intact.
            const requests = [...failedExposes];
            for (const request of requests) factories.delete(request);
            failedExposes.clear();
            return requests;
          },
        });
        const wrapper = Object.freeze({
          get(request, ...args) {
            globalThis.__MFE_TAB_GUARD__?.ensureActive();
            if (request === './__mfe_retry__' && artifact.retryProtocol === 'vite-preflight-v1') {
              return Promise.resolve(() => retryControls);
            }
            if (artifact.format !== 'esm') factories.delete(request);
            if (!factories.has(request)) {
              const pending = withTimeout(Promise.resolve().then(async () => {
                globalThis.__MFE_TAB_GUARD__?.ensureActive();
                if (!initialization) await wrapper.init(await initializeSharing());
                else await initialization;
                if (artifact.format === 'esm') {
                  // Resolve static remote imports before evaluating the parent's
                  // ESM chunk, so a failed child cannot poison that module graph.
                  for (const dependency of artifact.exposeImports?.[request] ?? artifact.federationImports ?? []) {
                    const child = dependency.alias === 'platform'
                      ? await getArtifactContainer(platform)
                      : await getDependencyContainer(artifact.id, dependency.alias);
                    await child.init(containerScope);
                    await child.get(dependency.exposedModule);
                  }
                }
                return container.get(request, ...args);
              }).then((factory) => {
                if (typeof factory !== 'function') throw new Error(`Invalid MF factory: ${artifact.id}:${request}`);
                return (...parameters) => {
                  globalThis.__MFE_TAB_GUARD__?.ensureActive();
                  try { return factory(...parameters); }
                  catch (error) { failedExposes.add(request); throw error; }
                };
              }), `Module ${artifact.id}:${request}`);
              factories.set(request, pending);
              pending.catch(() => {
                failedExposes.add(request);
                if (factories.get(request) === pending) factories.delete(request);
              });
            }
            return factories.get(request);
          },
          init(scope = getShareScope(), initScope) {
            globalThis.__MFE_TAB_GUARD__?.ensureActive();
            // Vite clones provider maps for each container. Always initialize
            // ESM remotes from this page's canonical host sharing contract.
            if (artifact.format === 'esm') scope = getShareScope();
            record.initCalls += 1;
            if (containerScope && containerScope !== scope) throw new Error(`Different share scope for ${artifact.id}`);
            containerScope = scope;
            if (!initialization) {
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
        return wrapper;
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

  function getDependencyContainer(consumerId, alias) {
      const menu = consumerId === registry.shell.id && registry.shell.navigationProtocol === 'registered-menu-v1'
        ? registry.navigation?.find(item => `menu/${item.id}` === alias) : undefined;
      if (menu) {
        const target = registry.artifacts[menu.artifactId];
        if (!target || target.kind !== 'remote' || target.service === 'platform'
          || registry.runtimeBindings?.[consumerId]?.[alias] !== target.id) return Promise.reject(new Error('Invalid registered menu binding'));
        return getArtifactContainer(target);
      }
      const placement = consumerId === registry.shell.id && registry.shell.dashboardProtocol === 'registered-dashboard-v1'
        ? registry.dashboard?.find(item => `dashboard/${item.id}` === alias) : undefined;
      if (placement) {
        const target = registry.artifacts[placement.artifactId];
        if (!target?.widgets?.some(widget => widget.id === placement.widgetId && widget.contract === 'platform-widget-v1')
          || registry.runtimeBindings?.[consumerId]?.[alias] !== target.id) return Promise.reject(new Error('Invalid registered dashboard binding'));
        return getArtifactContainer(target);
      }
      const consumer = consumerId === registry.shell.id ? registry.shell : registry.artifacts[consumerId];
      const requirement = consumer?.runtimeDependencies?.[alias];
      const pinnedId = consumer?.dependencies?.[alias];
      const targetId = pinnedId || registry.runtimeBindings?.[consumerId]?.[alias];
      const target = registry.artifacts[targetId];
      if ((!requirement && !pinnedId) || !target || (requirement && target.service !== requirement.service) || target.kind !== 'remote') {
        return Promise.reject(new Error(`Unresolved runtime dependency: ${consumerId}:${alias}`));
      }
      return getArtifactContainer(target);
    }

  return Object.freeze({
    registry,
    initializeSharing,
    getShareScope,
    setShareScope,
    getContainer(alias) {
      if (alias !== 'platform') return Promise.reject(new Error(`Unknown runtime dependency: ${alias}`));
      return getArtifactContainer(platform);
    },
    getDependencyContainer,
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
