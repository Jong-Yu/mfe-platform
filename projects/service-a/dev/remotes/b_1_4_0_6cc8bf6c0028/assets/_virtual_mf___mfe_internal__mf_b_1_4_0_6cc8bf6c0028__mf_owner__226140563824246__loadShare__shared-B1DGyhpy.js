import { r as __exportAll } from "./rolldown-runtime-DQp2zzRu.js";
import { t as __vitePreload } from "./vite-preload-helper-BVDCNeEa.js";
// \0virtual:mf:__mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__mf_v__loadShareHelpers__mf_v__.js
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
var __mfSharedCacheListenersKey = Symbol.for("module-federation.shared-cache-listeners");
var __mfGetSharedCacheListeners = (cache) => {
	let listeners = cache[__mfSharedCacheListenersKey];
	if (listeners === void 0) {
		listeners = Object.create(null);
		Object.defineProperty(cache, __mfSharedCacheListenersKey, {
			value: listeners,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}
	return listeners;
};
var __mfSubscribeSharedCache = (cache, descriptor, listener) => {
	const listeners = __mfGetSharedCacheListeners(cache);
	(listeners[descriptor.canonical] ||= /* @__PURE__ */ new Set()).add(listener);
};
var __mfSharedCacheOwnersKey = Symbol.for("module-federation.shared-cache-owners");
var __mfGetSharedCacheOwners = (cache) => {
	let owners = cache[__mfSharedCacheOwnersKey];
	if (owners === void 0) {
		owners = Object.create(null);
		Object.defineProperty(cache, __mfSharedCacheOwnersKey, {
			value: owners,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}
	return owners;
};
var __mfGetSharedModuleIdentity = (value) => {
	const candidates = [value, value?.default];
	for (const candidate of candidates) {
		if (!candidate || typeof candidate !== "object") continue;
		for (const key of [
			"__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
			"__TEST_INTERNALS",
			"__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED"
		]) {
			const internals = candidate[key];
			if (internals && typeof internals === "object") return { internals };
		}
		if (typeof candidate.useState === "function") return { hook: candidate.useState };
	}
};
var __mfIsSameSharedModule = (current, next) => {
	if (current === next) return true;
	const currentIdentity = __mfGetSharedModuleIdentity(current);
	const nextIdentity = __mfGetSharedModuleIdentity(next);
	if (!currentIdentity || !nextIdentity) return false;
	const currentInternals = currentIdentity.internals;
	const nextInternals = nextIdentity.internals;
	if (currentInternals !== void 0 || nextInternals !== void 0) return currentInternals !== void 0 && currentInternals === nextInternals;
	return typeof currentIdentity.hook === "function" && currentIdentity.hook === nextIdentity.hook;
};
var __mfWriteSharedCache = (cache, descriptor, value, owner) => {
	const current = __mfReadSharedCache(cache, descriptor);
	if (current !== void 0 && __mfIsSameSharedModule(current, value)) return value;
	cache[descriptor.canonical] = value;
	const aliases = descriptor.aliases || [];
	for (const alias of aliases) Object.defineProperty(cache, alias, {
		value,
		enumerable: true,
		configurable: true,
		writable: true
	});
	const owners = cache[__mfSharedCacheOwnersKey];
	if (owner === void 0) {
		if (owners) delete owners[descriptor.canonical];
	} else __mfGetSharedCacheOwners(cache)[descriptor.canonical] = owner;
	const listeners = cache[__mfSharedCacheListenersKey]?.[descriptor.canonical];
	if (listeners) for (const listener of listeners) listener(value);
	return value;
};
// \0virtual:mf:__mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__react_mf_2_dom__loadShare__.js
var _virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__react_mf_2_dom__loadShare___exports = /* @__PURE__ */ __exportAll({
	__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: () => __mf_0$1,
	__moduleExports: () => exportModule$1,
	browser: () => __mf_1$1,
	createPortal: () => __mf_2$1,
	default: () => __mf_default$1,
	flushSync: () => __mf_3,
	preconnect: () => __mf_4,
	prefetchDNS: () => __mf_5,
	preinit: () => __mf_6,
	preinitModule: () => __mf_7,
	preload: () => __mf_8,
	preloadModule: () => __mf_9,
	requestFormReset: () => __mf_10,
	unstable_batchedUpdates: () => __mf_11,
	useFormState: () => __mf_12,
	useFormStatus: () => __mf_13,
	version: () => __mf_14
});
var __mfPromiseGlobalKey$1 = "__mf_init__virtual:mf:__mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__mf_v__runtimeInit__mf_v__.js__";
var __mfPromiseState$1 = globalThis[__mfPromiseGlobalKey$1];
if (!__mfPromiseState$1) {
	let initResolve, initReject;
	const initPromise = new Promise((re, rj) => {
		initResolve = re;
		initReject = rj;
	});
	__mfPromiseState$1 = globalThis[__mfPromiseGlobalKey$1] = {
		initPromise,
		initResolve,
		initReject
	};
}
var initPromise$1 = __mfPromiseState$1.initPromise;
var __mfCacheGlobalKey$1 = "__mf_module_cache__";
globalThis[__mfCacheGlobalKey$1] ||= {
	share: {},
	remote: {}
};
globalThis[__mfCacheGlobalKey$1].share ||= {};
globalThis[__mfCacheGlobalKey$1].remote ||= {};
var __mfModuleCache$1 = globalThis[__mfCacheGlobalKey$1];
var __mfTrackPendingShareLoad$1 = (promise) => {
	const pendingShareLoads = __mfModuleCache$1.pendingShareLoads ||= [];
	pendingShareLoads.push(promise);
	const cleanup = () => {
		const index = pendingShareLoads.indexOf(promise);
		if (index !== -1) pendingShareLoads.splice(index, 1);
	};
	promise.then(cleanup, cleanup);
	return promise;
};
for (const __mfShareKey of Object.keys(__mfModuleCache$1.share)) if (__mfShareKey.startsWith("default:")) {
	const __mfLegacyShareKey = __mfShareKey.slice(8);
	if (__mfModuleCache$1.share[__mfLegacyShareKey] === void 0) __mfModuleCache$1.share[__mfLegacyShareKey] = __mfModuleCache$1.share[__mfShareKey];
} else if (!__mfShareKey.includes(":")) {
	const __mfDefaultShareKey = "default:" + __mfShareKey;
	if (__mfModuleCache$1.share[__mfDefaultShareKey] === void 0) __mfModuleCache$1.share[__mfDefaultShareKey] = __mfModuleCache$1.share[__mfShareKey];
}
var __mfNormalizeShareModule$1 = (mod) => {
	const normalized = (() => {
		let current = mod;
		for (let i = 0; i < 5; i++) {
			const defaultExport = current?.default;
			if (!defaultExport || typeof defaultExport !== "object") break;
			const namedValues = Object.keys(current).filter((key) => key !== "default").map((key) => current[key]);
			if (namedValues.length > 0 && namedValues.some((value) => value !== void 0)) break;
			current = defaultExport;
		}
		return current;
	})();
	return normalized && Object.getPrototypeOf(normalized) === null ? Object.assign({}, normalized) : normalized;
};
var __mf_default$1;
var __mf_0$1;
var __mf_1$1;
var __mf_2$1;
var __mf_3;
var __mf_4;
var __mf_5;
var __mf_6;
var __mf_7;
var __mf_8;
var __mf_9;
var __mf_10;
var __mf_11;
var __mf_12;
var __mf_13;
var __mf_14;
var __mfApplyLazyShareExports$1 = (mod) => {
	exportModule$1 = mod;
	__mf_0$1 = mod["__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE"];
	__mf_1$1 = mod["browser"];
	__mf_2$1 = mod["createPortal"];
	__mf_3 = mod["flushSync"];
	__mf_4 = mod["preconnect"];
	__mf_5 = mod["prefetchDNS"];
	__mf_6 = mod["preinit"];
	__mf_7 = mod["preinitModule"];
	__mf_8 = mod["preload"];
	__mf_9 = mod["preloadModule"];
	__mf_10 = mod["requestFormReset"];
	__mf_11 = mod["unstable_batchedUpdates"];
	__mf_12 = mod["useFormState"];
	__mf_13 = mod["useFormStatus"];
	__mf_14 = mod["version"];
	__mf_default$1 = mod.default ?? mod;
};
__mfSubscribeSharedCache(__mfModuleCache$1.share, {
	"canonical": "default:react-dom",
	"aliases": ["react-dom"]
}, __mfApplyLazyShareExports$1);
var exportModule$1 = __mfReadSharedCache(__mfModuleCache$1.share, {
	"canonical": "default:react-dom",
	"aliases": ["react-dom"]
});
if (exportModule$1 === void 0) __mfTrackPendingShareLoad$1(Promise.race([initPromise$1.then(() => __mfReadSharedCache(__mfModuleCache$1.share, {
	"canonical": "default:react-dom",
	"aliases": ["react-dom"]
})), new Promise((resolve) => {
	const current = __mfReadSharedCache(__mfModuleCache$1.share, {
		"canonical": "default:react-dom",
		"aliases": ["react-dom"]
	});
	if (current !== void 0) resolve(current);
	else __mfSubscribeSharedCache(__mfModuleCache$1.share, {
		"canonical": "default:react-dom",
		"aliases": ["react-dom"]
	}, resolve);
})]).then((cached) => {
	exportModule$1 = cached;
	if (exportModule$1 !== void 0) {
		__mfApplyLazyShareExports$1(exportModule$1);
		return;
	}
	return __vitePreload(() => globalThis.__MFE_IMPORT__(new URL("./_virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__prebuild__react_mf_2_dom__prebuild__-C-IYZClh.js", import.meta.url).href).then((mod) => {
		exportModule$1 = __mfNormalizeShareModule$1(mod);
		__mfWriteSharedCache(__mfModuleCache$1.share, {
			"canonical": "default:react-dom",
			"aliases": ["react-dom"]
		}, exportModule$1, "mf_b_1_4_0_6cc8bf6c0028");
	}), void 0);
}));
else __mfApplyLazyShareExports$1(exportModule$1);
// \0virtual:mf:__mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__react_mf_2_dom_mf_1_client__loadShare__.js
var _virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__react_mf_2_dom_mf_1_client__loadShare___exports = /* @__PURE__ */ __exportAll({
	__moduleExports: () => exportModule,
	createRoot: () => __mf_0,
	default: () => __mf_default,
	hydrateRoot: () => __mf_1,
	version: () => __mf_2
});
var __mfPromiseGlobalKey = "__mf_init__virtual:mf:__mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__mf_v__runtimeInit__mf_v__.js__";
var __mfPromiseState = globalThis[__mfPromiseGlobalKey];
if (!__mfPromiseState) {
	let initResolve, initReject;
	const initPromise = new Promise((re, rj) => {
		initResolve = re;
		initReject = rj;
	});
	__mfPromiseState = globalThis[__mfPromiseGlobalKey] = {
		initPromise,
		initResolve,
		initReject
	};
}
var initPromise = __mfPromiseState.initPromise;
var __mfCacheGlobalKey = "__mf_module_cache__";
globalThis[__mfCacheGlobalKey] ||= {
	share: {},
	remote: {}
};
globalThis[__mfCacheGlobalKey].share ||= {};
globalThis[__mfCacheGlobalKey].remote ||= {};
var __mfModuleCache = globalThis[__mfCacheGlobalKey];
var __mfTrackPendingShareLoad = (promise) => {
	const pendingShareLoads = __mfModuleCache.pendingShareLoads ||= [];
	pendingShareLoads.push(promise);
	const cleanup = () => {
		const index = pendingShareLoads.indexOf(promise);
		if (index !== -1) pendingShareLoads.splice(index, 1);
	};
	promise.then(cleanup, cleanup);
	return promise;
};
for (const __mfShareKey of Object.keys(__mfModuleCache.share)) if (__mfShareKey.startsWith("default:")) {
	const __mfLegacyShareKey = __mfShareKey.slice(8);
	if (__mfModuleCache.share[__mfLegacyShareKey] === void 0) __mfModuleCache.share[__mfLegacyShareKey] = __mfModuleCache.share[__mfShareKey];
} else if (!__mfShareKey.includes(":")) {
	const __mfDefaultShareKey = "default:" + __mfShareKey;
	if (__mfModuleCache.share[__mfDefaultShareKey] === void 0) __mfModuleCache.share[__mfDefaultShareKey] = __mfModuleCache.share[__mfShareKey];
}
var __mfNormalizeShareModule = (mod) => {
	const normalized = (() => {
		let current = mod;
		for (let i = 0; i < 5; i++) {
			const defaultExport = current?.default;
			if (!defaultExport || typeof defaultExport !== "object") break;
			const namedValues = Object.keys(current).filter((key) => key !== "default").map((key) => current[key]);
			if (namedValues.length > 0 && namedValues.some((value) => value !== void 0)) break;
			current = defaultExport;
		}
		return current;
	})();
	return normalized && Object.getPrototypeOf(normalized) === null ? Object.assign({}, normalized) : normalized;
};
var __mf_default;
var __mf_0;
var __mf_1;
var __mf_2;
var __mfApplyLazyShareExports = (mod) => {
	exportModule = mod;
	__mf_0 = mod["createRoot"];
	__mf_1 = mod["hydrateRoot"];
	__mf_2 = mod["version"];
	__mf_default = mod.default ?? mod;
};
__mfSubscribeSharedCache(__mfModuleCache.share, {
	"canonical": "default:react-dom/client",
	"aliases": ["react-dom/client"]
}, __mfApplyLazyShareExports);
var exportModule = __mfReadSharedCache(__mfModuleCache.share, {
	"canonical": "default:react-dom/client",
	"aliases": ["react-dom/client"]
});
if (exportModule === void 0) __mfTrackPendingShareLoad(Promise.race([initPromise.then(() => __mfReadSharedCache(__mfModuleCache.share, {
	"canonical": "default:react-dom/client",
	"aliases": ["react-dom/client"]
})), new Promise((resolve) => {
	const current = __mfReadSharedCache(__mfModuleCache.share, {
		"canonical": "default:react-dom/client",
		"aliases": ["react-dom/client"]
	});
	if (current !== void 0) resolve(current);
	else __mfSubscribeSharedCache(__mfModuleCache.share, {
		"canonical": "default:react-dom/client",
		"aliases": ["react-dom/client"]
	}, resolve);
})]).then((cached) => {
	exportModule = cached;
	if (exportModule !== void 0) {
		__mfApplyLazyShareExports(exportModule);
		return;
	}
	return __vitePreload(() => globalThis.__MFE_IMPORT__(new URL("./_virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__prebuild__react_mf_2_dom_mf_1_client__prebuild__-CIQW_MBc.js", import.meta.url).href).then((mod) => {
		exportModule = __mfNormalizeShareModule(mod);
		__mfWriteSharedCache(__mfModuleCache.share, {
			"canonical": "default:react-dom/client",
			"aliases": ["react-dom/client"]
		}, exportModule, "mf_b_1_4_0_6cc8bf6c0028");
	}), void 0);
}));
else __mfApplyLazyShareExports(exportModule);
export { __mf_2$1 as n, _virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__react_mf_2_dom__loadShare___exports as r, _virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__react_mf_2_dom_mf_1_client__loadShare___exports as t };
