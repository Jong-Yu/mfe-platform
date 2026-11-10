import { t as __vitePreload } from "./vite-preload-helper-BVDCNeEa.js";
// \0virtual:mf:__mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__1__H_A_I__hostAutoInit__H_A_I__.js
var __mfCacheGlobalKey = "__mf_module_cache__";
globalThis[__mfCacheGlobalKey] ||= {
	share: {},
	remote: {}
};
globalThis[__mfCacheGlobalKey].share ||= {};
globalThis[__mfCacheGlobalKey].remote ||= {};
var __mfModuleCache = globalThis[__mfCacheGlobalKey];
for (const __mfShareKey of Object.keys(__mfModuleCache.share)) if (__mfShareKey.startsWith("default:")) {
	const __mfLegacyShareKey = __mfShareKey.slice(8);
	if (__mfModuleCache.share[__mfLegacyShareKey] === void 0) __mfModuleCache.share[__mfLegacyShareKey] = __mfModuleCache.share[__mfShareKey];
} else if (!__mfShareKey.includes(":")) {
	const __mfDefaultShareKey = "default:" + __mfShareKey;
	if (__mfModuleCache.share[__mfDefaultShareKey] === void 0) __mfModuleCache.share[__mfDefaultShareKey] = __mfModuleCache.share[__mfShareKey];
}
var hostInitPromise;
async function initHost() {
	if (!hostInitPromise) hostInitPromise = (async () => {
		const __mfGetSharedCacheDescriptor = function createSharedCacheDescriptor(pkg, singleton, version, scope) {
			const scopeName = (Array.isArray(scope) ? scope[0] : scope) || "default";
			const id = singleton || !version ? pkg : pkg + "@" + version;
			const descriptor = { canonical: scopeName + ":" + id };
			if (scopeName === "default") descriptor.aliases = [id];
			return descriptor;
		};
		const __mfSharedCacheOwnersKey = Symbol.for("module-federation.shared-cache-owners");
		const __mfReadSharedCacheOwner = (cache, descriptor) => cache[__mfSharedCacheOwnersKey]?.[descriptor.canonical];
		const runtime = await (await __vitePreload(() => globalThis.__MFE_IMPORT__(new URL("../remoteEntry.js", import.meta.url).href), void 0)).init();
		const { usedShared } = await __vitePreload(async () => {
			const { usedShared } = await globalThis.__MFE_IMPORT__(new URL("./_virtual_mf-localSharedImportMap___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__1-BaCESpgK.js", import.meta.url).href);
			return { usedShared };
		}, void 0);
		for (const [pkg, share] of Object.entries(usedShared)) {
			if (!share.lib || share.treeShaking || share.shareConfig?.import === false) continue;
			const cacheDescriptor = __mfGetSharedCacheDescriptor(pkg, share.shareConfig?.singleton, share.version, share.scope);
			if (__mfReadSharedCacheOwner(__mfModuleCache.share, cacheDescriptor) !== "mf_b_1_4_0_6cc8bf6c0028") continue;
			for (const scopeName of Array.isArray(share.scope) ? share.scope : [share.scope || "default"]) {
				const versions = runtime.shareScopeMap?.[scopeName]?.[pkg];
				const provider = versions?.[share.version];
				if (!provider || provider.get !== share.get || provider.lib) continue;
				if (Object.values(versions).some((other) => other !== provider && (other?.lib || other?.loaded))) continue;
				provider.lib = share.lib;
				provider.loaded = true;
			}
		}
		return runtime;
	})();
	return hostInitPromise;
}
hostInitPromise = initHost();
export { hostInitPromise, initHost };
