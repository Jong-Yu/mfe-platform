import { r as __exportAll } from "./rolldown-runtime-DQp2zzRu.js";
import { t as __vitePreload } from "./vite-preload-helper-MNh0XIOp.js";
// \0virtual:mf:__mfe_internal__mf_b_2_1_0_479272f66af5__loadRemote__platform_mf_1_sdk__mf_owner__1__loadRemote__.js
var _virtual_mf___mfe_internal__mf_b_2_1_0_479272f66af5__loadRemote__platform_mf_1_sdk__mf_owner__1__loadRemote___exports = /* @__PURE__ */ __exportAll({ __mf_remote_pending: () => __mf_remote_pending });
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
var __mfHostInitPromise = () => __vitePreload(() => globalThis.__MFE_IMPORT__(new URL("./hostInit-GZpl63UA.js", import.meta.url).href).then((mod) => mod.hostInitPromise), void 0);
function __mfStartRemoteLoad() {
	const remoteCacheKey = "virtual:mf:__mfe_internal__mf_b_2_1_0_479272f66af5__mf_owner__123185571438837__mf_v__runtimeInit__mf_v__.js::platform/sdk";
	const pendingKey = "__mf_pending__" + remoteCacheKey;
	if (!__mfModuleCache.remote[pendingKey]) {
		const pending = __mfHostInitPromise().then((runtime) => {
			runtime.registerRemotes([{
				"entryGlobalName": "platform",
				"name": "__mfe_internal__mf_b_2_1_0_479272f66af5__mf_owner__123185571438837__platform",
				"alias": "platform",
				"type": "module",
				"entry": "https://mfe.invalid/b_2_1_0_479272f66af5/platform/remoteEntry.js",
				"shareScope": "default"
			}]);
			const moduleCacheKey = Symbol.for("module-federation.vite-module-cache");
			const shareScopes = runtime.shareScopeMap || {};
			for (const scope of Object.values(shareScopes)) if (scope && typeof scope === "object") scope[moduleCacheKey] = __mfModuleCache;
			shareScopes[moduleCacheKey] = __mfModuleCache;
			return runtime.loadRemote("__mfe_internal__mf_b_2_1_0_479272f66af5__mf_owner__123185571438837__platform/sdk");
		}).then((mod) => Promise.resolve(mod?.__mf_remote_dependency_pending).then(() => mod)).then((mod) => {
			__mfModuleCache.remote[remoteCacheKey] = mod;
			delete __mfModuleCache.remote[pendingKey];
			return mod;
		}).catch((error) => {
			if (__mfModuleCache.remote[pendingKey] === pending) delete __mfModuleCache.remote[pendingKey];
			throw error;
		});
		__mfModuleCache.remote[pendingKey] = pending;
	}
	return __mfModuleCache.remote[pendingKey];
}
function __mfCreateDeferredRemoteProxy() {
	let pendingPromise;
	const ensurePending = () => {
		if (!pendingPromise) {
			pendingPromise = __mfStartRemoteLoad();
			pendingPromise.then(void 0, () => {
				pendingPromise = void 0;
			});
		}
		return pendingPromise;
	};
	const getModule = () => __mfModuleCache.remote["virtual:mf:__mfe_internal__mf_b_2_1_0_479272f66af5__mf_owner__123185571438837__mf_v__runtimeInit__mf_v__.js::platform/sdk"];
	const proxyTarget = function(...args) {
		ensurePending();
		const mod = getModule();
		const fn = mod && (mod.default ?? mod);
		if (fn !== void 0 && fn !== null) return fn.apply(this, args);
		return null;
	};
	return new Proxy(proxyTarget, {
		get(_target, prop) {
			if (prop === "__mf_is_remote_proxy") return true;
			if (prop === "__esModule") return true;
			if (prop === "then") return void 0;
			if (prop === Symbol.toPrimitive || prop === "toString") return () => "[MF remote: pending]";
			const mod = getModule();
			if (mod) return prop in mod ? mod[prop] : mod.default?.[prop];
			ensurePending();
			if (prop === "default") return proxyTarget;
			throw ensurePending();
		},
		has(_target, prop) {
			const mod = getModule();
			if (mod) return prop in mod;
			return prop === "default" || prop === "__esModule" || prop === "__mf_is_remote_proxy";
		},
		ownKeys() {
			const mod = getModule();
			const keys = new Set(mod ? Reflect.ownKeys(mod) : []);
			for (const k of Reflect.ownKeys(proxyTarget)) {
				const d = Object.getOwnPropertyDescriptor(proxyTarget, k);
				if (d && !d.configurable) keys.add(k);
			}
			return Array.from(keys);
		},
		getOwnPropertyDescriptor(_target, prop) {
			const targetDesc = Object.getOwnPropertyDescriptor(proxyTarget, prop);
			if (targetDesc && !targetDesc.configurable) return targetDesc;
			const mod = getModule();
			if (!mod) return void 0;
			return Object.getOwnPropertyDescriptor(mod, prop) || {
				configurable: true,
				enumerable: true,
				value: mod[prop]
			};
		},
		apply(target, thisArg, args) {
			return target.apply(thisArg, args);
		}
	});
}
function __mfUnwrapRemoteDefault(mod) {
	let value = mod;
	const seen = /* @__PURE__ */ new Set();
	while (value != null && typeof value === "object" && !seen.has(value)) {
		seen.add(value);
		if (value.__esModule && value.default != null) {
			value = value.default;
			continue;
		}
		if (!value.__esModule && value.default != null) {
			value = value.default;
			continue;
		}
		break;
	}
	return value;
}
function __mfSyncDefaultExport() {
	exportModule?.__mf_is_remote_proxy || __mfUnwrapRemoteDefault(exportModule);
}
function __mfAssignRemoteModule(mod) {
	if (mod !== void 0) exportModule = mod;
	__mfSyncDefaultExport();
	return exportModule;
}
var __mfRemotePending;
var exportModule = __mfModuleCache.remote["virtual:mf:__mfe_internal__mf_b_2_1_0_479272f66af5__mf_owner__123185571438837__mf_v__runtimeInit__mf_v__.js::platform/sdk"];
if (exportModule === void 0) exportModule = __mfCreateDeferredRemoteProxy();
__mfSyncDefaultExport();
__mfRemotePending?.then(__mfSyncDefaultExport, () => {});
function __mfResetFailedRemotePending(pending) {
	pending.then(void 0, () => {
		if (__mfRemotePending === pending) __mfRemotePending = void 0;
	});
}
if (__mfRemotePending) __mfResetFailedRemotePending(__mfRemotePending);
var __mf_remote_pending = { then(onFulfilled, onRejected) {
	if (!__mfRemotePending) {
		__mfRemotePending = __mfStartRemoteLoad().then(__mfAssignRemoteModule);
		__mfResetFailedRemotePending(__mfRemotePending);
	}
	return __mfRemotePending.then(onFulfilled, onRejected);
} };
export { _virtual_mf___mfe_internal__mf_b_2_1_0_479272f66af5__loadRemote__platform_mf_1_sdk__mf_owner__1__loadRemote___exports as n, exportModule as r, __mf_remote_pending as t };
