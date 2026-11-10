export default function compositionPlugin({ consumerId, dependencies, host }) {
  function publishShareScope(origin) {
    const scope = origin.shareScopeMap.default ||= {};
    globalThis.__MFE_SHARE_SCOPE__ = scope;
    globalThis.__MFE_RUNTIME__?.setShareScope(scope);
    globalThis.__MFE_INITIALIZE_SHARING__ = async () => {
      await Promise.all(origin.initializeSharing('default', { strategy: 'loaded-first' }));
      return origin.shareScopeMap.default;
    };
  }
  return {
    name: `mfe-composition-${consumerId}`,
    init({ origin }) {
      if (!host) return;
      publishShareScope(origin);
    },
    initContainerShareScopeMap({ origin, scopeName }) {
      // Vite replaces the initial provider map while initializing its host.
      // Consumers must receive that final map, rather than the earlier object.
      if (host && scopeName === 'default') publishShareScope(origin);
    },
    async loadEntry({ remoteInfo }) {
      const marker = new URL(remoteInfo.entry, globalThis.location.href);
      if (marker.hostname !== 'mfe.invalid') return;
      const parts = marker.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      if (parts[0] !== consumerId) throw new Error('Remote consumer mismatch');
      const alias = parts[1];
      const descriptor = dependencies[alias];
      const runtime = globalThis.__MFE_RUNTIME__;
      if (!runtime || !descriptor) throw new Error(`Unknown composition dependency: ${alias}`);
      if (alias === 'platform') return runtime.getContainer('platform');
      if (descriptor.mode === 'runtime') return runtime.getDependencyContainer(consumerId, alias);
      const target = runtime.registry.artifacts[descriptor.id];
      if (!target || target.name !== descriptor.name || target.entry !== descriptor.entry) throw new Error(`Pinned dependency mismatch: ${alias}`);
      return runtime.getArtifactContainer(target);
    },
  };
}
