import { t as __vitePreload } from "./vite-preload-helper-Bdil_hx7.js";
// \0virtual:mf:__mfe_internal__mf_d_2_0_0_a4251bae8bc7__mf_owner__1__P_S__pendingShares__P_S__.js
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
var __mfGetSharedCacheDescriptor = function createSharedCacheDescriptor(pkg, singleton, version, scope) {
	const scopeName = (Array.isArray(scope) ? scope[0] : scope) || "default";
	const id = singleton || !version ? pkg : pkg + "@" + version;
	const descriptor = { canonical: scopeName + ":" + id };
	if (scopeName === "default") descriptor.aliases = [id];
	return descriptor;
};
var __mfReadSharedCache = (cache, descriptor) => {
	const value = cache[descriptor.canonical];
	if (value !== void 0) return value;
	const aliases = descriptor.aliases || [];
	for (const alias of aliases) {
		if (!Object.prototype.hasOwnProperty.call(cache, alias)) continue;
		const aliasValue = cache[alias];
		if (aliasValue !== void 0) {
			cache[descriptor.canonical] = aliasValue;
			return aliasValue;
		}
	}
};
var __mfPendingShareImports = [];
async function preloadPendingShares() {
	if (__mfPendingShareImports.length === 0) return;
	const __mfRendererShare = "react-dom/client";
	const __mfRendererParent = "react-dom";
	const { usedShared } = await __vitePreload(async () => {
		const { usedShared } = await globalThis.__MFE_IMPORT__(new URL("./_virtual_mf-localSharedImportMap___mfe_internal__mf_d_2_0_0_a4251bae8bc7__mf_owner__1-CC1gJ7XN.js", import.meta.url).href);
		return { usedShared };
	}, void 0);
	await Promise.all(__mfPendingShareImports.map(async ([pkg, load]) => {
		const exactShare = usedShared[pkg];
		const share = exactShare ?? (pkg === __mfRendererShare ? usedShared[__mfRendererParent] : void 0);
		if (!share || share.treeShaking || share.shareConfig?.import === false) return;
		if (exactShare && exactShare.materialize === false && pkg !== __mfRendererShare) return;
		const cacheDescriptor = __mfGetSharedCacheDescriptor(pkg, share.shareConfig?.singleton, share.version, share.scope);
		if (__mfReadSharedCache(__mfModuleCache.share, cacheDescriptor) !== void 0) return;
		await load().catch((err) => console.warn("[module-federation] shared preload failed:", pkg, err));
	}));
}
export { preloadPendingShares };
