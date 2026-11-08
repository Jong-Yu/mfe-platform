/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.js"
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./runtime */ "./src/runtime.js");

async function start() {
  const bootURL = globalThis.__MFE_BOOT_URL__ || '/registry.json';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let registry;
  try {
    const response = await fetch(bootURL, {
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Registry unavailable: ${bootURL} (${response.status})`);
    registry = await response.json();
  } finally {
    clearTimeout(timeout);
  }
  if (registry?.shell?.id !== "shell_1_3_0_f806e49142bc") {
    throw new Error(`Shell snapshot mismatch: expected ${"shell_1_3_0_f806e49142bc"}, received ${registry?.shell?.id || 'none'}`);
  }
  if (globalThis.__MFE_RUNTIME__) throw new Error('A runtime snapshot is already installed for this page.');
  if (globalThis.__MFE_LEASE_REQUIRED__ && !globalThis.__MFE_TAB_GUARD__) throw new Error('탭 보호 기능을 불러오지 못했습니다. 새로고침해 주세요.');
  await globalThis.__MFE_TAB_GUARD__?.start(registry.compositionId);
  const runtime = (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.createRuntime)((0,_runtime__WEBPACK_IMPORTED_MODULE_0__.deepFreeze)(registry), {
    bootURL
  });
  Object.defineProperty(globalThis, '__MFE_RUNTIME__', {
    value: runtime,
    writable: false,
    configurable: false
  });
  await Promise.all(/*! import() */[__webpack_require__.e("webpack_sharing_consume_default_react_react"), __webpack_require__.e("src_bootstrap_jsx")]).then(() => (__webpack_require__(/*! ./bootstrap */ "./src/bootstrap.jsx")));
}
start().catch(error => {
  const root = document.getElementById('root');
  root.setAttribute('role', 'alert');
  root.textContent = `초기화 실패: ${error.message}`;
  console.error(error);
});

/***/ },

/***/ "./src/runtime.js"
/*!************************!*\
  !*** ./src/runtime.js ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createRuntime: () => (/* binding */ createRuntime),
/* harmony export */   deepFreeze: () => (/* binding */ deepFreeze)
/* harmony export */ });
function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
function validateArtifact(artifact) {
  if (!artifact || typeof artifact.id !== 'string' || !artifact.id || typeof artifact.name !== 'string' || !artifact.name || typeof artifact.entry !== 'string' || !artifact.entry) {
    throw new Error('Invalid remote artifact in the runtime snapshot.');
  }
}
function createRuntime(registry, {
  bootURL,
  timeoutMs = 15000
} = {}) {
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
      Promise.resolve(promise).then(value => {
        clearTimeout(timer);
        resolve(value);
      }, error => {
        clearTimeout(timer);
        reject(error);
      });
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
      const finish = error => {
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
      record = {
        id: artifact.id,
        name: artifact.name,
        entry: artifact.entry,
        status: 'unloaded',
        loadAttempts: 0,
        loadCount: 0,
        initCalls: 0,
        initCount: 0,
        lastError: null
      };
      records.set(artifact.id, record);
    }
    if (!containers.has(artifact.id)) {
      const pending = loadEntry(artifact, record).then(container => {
        if (typeof container?.get !== 'function' || typeof container?.init !== 'function') throw new Error(`Invalid MF container: ${artifact.name}`);
        record.status = 'loaded';
        let shareScope;
        let initialization;
        return Object.freeze({
          get(...args) {
            return withTimeout(Promise.resolve().then(() => {
              globalThis.__MFE_TAB_GUARD__?.ensureActive();
              return container.get(...args);
            }).then(factory => (...parameters) => {
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
              pendingInit.then(() => {
                record.initCount += 1;
                record.status = 'initialized';
                record.lastError = null;
              }, error => {
                if (initialization === pendingInit) initialization = undefined;
                record.status = 'init-failed';
                record.lastError = error.message;
              });
            }
            return initialization;
          }
        });
      });
      containers.set(artifact.id, pending);
      pending.catch(error => {
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
      const menu = consumerId === registry.shell.id && registry.shell.navigationProtocol === 'registered-menu-v1' ? registry.navigation?.find(item => `menu/${item.id}` === alias) : undefined;
      if (menu) {
        const target = registry.artifacts[menu.artifactId];
        if (!target || target.kind !== 'remote' || target.service === 'platform' || registry.runtimeBindings?.[consumerId]?.[alias] !== target.id) return Promise.reject(new Error('Invalid registered menu binding'));
        return getArtifactContainer(target);
      }
      const placement = consumerId === registry.shell.id && registry.shell.dashboardProtocol === 'registered-dashboard-v1' ? registry.dashboard?.find(item => `dashboard/${item.id}` === alias) : undefined;
      if (placement) {
        const target = registry.artifacts[placement.artifactId];
        if (!target?.widgets?.some(widget => widget.id === placement.widgetId && widget.contract === 'platform-widget-v1') || registry.runtimeBindings?.[consumerId]?.[alias] !== target.id) return Promise.reject(new Error('Invalid registered dashboard binding'));
        return getArtifactContainer(target);
      }
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
      const entries = [...records.values()].map(record => ({
        ...record
      }));
      return {
        compositionId: registry.compositionId,
        platformArtifactId: platform.id,
        runtimeBindings: registry.runtimeBindings,
        bootURL,
        containers: entries,
        loadedContainerIds: entries.filter(entry => ['loaded', 'initialized', 'init-failed'].includes(entry.status)).map(entry => entry.id)
      };
    }
  });
}

/***/ },

/***/ "webpack/container/reference/platform"
/*!************************************************************************!*\
  !*** external "globalThis.__MFE_RUNTIME__.getContainer(\"platform\")" ***!
  \************************************************************************/
(module) {

module.exports = globalThis.__MFE_RUNTIME__.getContainer("platform");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			if (cachedModule.error !== undefined) throw cachedModule.error;
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		try {
/******/ 			if (!(moduleId in __webpack_modules__)) {
/******/ 				delete __webpack_module_cache__[moduleId];
/******/ 				const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 				e.code = 'MODULE_NOT_FOUND';
/******/ 				throw e;
/******/ 			}
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 		} catch(e) {
/******/ 			module.error = e;
/******/ 			throw e;
/******/ 		}
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = (module) => {
/******/ 		const getter = module && module.__esModule ?
/******/ 			() => (module['default']) :
/******/ 			() => (module);
/******/ 		__webpack_require__.d(getter, { a: getter });
/******/ 		return getter;
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	// define getter/value functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	__webpack_require__.f = {};
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = (chunkId) => {
/******/ 		return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 			__webpack_require__.f[key](chunkId, promises);
/******/ 			return promises;
/******/ 		}, []));
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	// This function allow to reference async chunks
/******/ 	__webpack_require__.u = (chunkId) => (chunkId + "." + {"src_bootstrap_jsx":"b06695be69d48179a597","vendors-node_modules_react-dom_client_js":"ea4e7c2f18c3572ddb8e","vendors-node_modules_react-dom_index_js":"0c705a22810e44a0f202","vendors-node_modules_react_index_js":"5dfdf9e436f20f1c089b"}[chunkId] + ".js");
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	__webpack_require__.g = (function() {
/******/ 		if (typeof globalThis === 'object') return globalThis;
/******/ 		try {
/******/ 			return this || new Function('return this')();
/******/ 		} catch (e) {
/******/ 			if (typeof window === 'object') return window;
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop));
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		const inProgress = {};
/******/ 		const dataWebpackPrefix = "shell_1_3_0_f806e49142bc:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			let script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				const scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					const s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			const onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				const doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode?.removeChild(script);
/******/ 				doneFns?.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			const timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	__webpack_require__.nmd = (module) => {
/******/ 		module.paths = [];
/******/ 		if (!module.children) module.children = [];
/******/ 		return module;
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/remotes loading */
/******/ 	(() => {
/******/ 		const chunkMapping = {
/******/ 			"src_bootstrap_jsx": [
/******/ 				"webpack/container/remote/platform/sdk"
/******/ 			]
/******/ 		};
/******/ 		const idToExternalAndNameMapping = {
/******/ 			"webpack/container/remote/platform/sdk": [
/******/ 				"default",
/******/ 				"./sdk",
/******/ 				"webpack/container/reference/platform"
/******/ 			]
/******/ 		};
/******/ 		__webpack_require__.f.remotes = (chunkId, promises) => {
/******/ 			if(__webpack_require__.o(chunkMapping, chunkId)) {
/******/ 				chunkMapping[chunkId].forEach((id) => {
/******/ 					let getScope = __webpack_require__.R;
/******/ 					if(!getScope) getScope = [];
/******/ 					const data = idToExternalAndNameMapping[id];
/******/ 					if(getScope.indexOf(data) >= 0) return;
/******/ 					getScope.push(data);
/******/ 					if(data.p) return promises.push(data.p);
/******/ 					const onError = (error) => {
/******/ 						if(!error) error = new Error("Container missing");
/******/ 						if(typeof error.message === "string")
/******/ 							error.message += '\nwhile loading "' + data[1] + '" from ' + data[2];
/******/ 						__webpack_require__.m[id] = () => {
/******/ 							throw error;
/******/ 						}
/******/ 						data.p = 0;
/******/ 					};
/******/ 					const handleFunction = (fn, arg1, arg2, d, next, first) => {
/******/ 						try {
/******/ 							const promise = fn(arg1, arg2);
/******/ 							if(promise?.then) {
/******/ 								const p = promise.then((result) => (next(result, d)), onError);
/******/ 								if(first) promises.push(data.p = p); else return p;
/******/ 							} else {
/******/ 								return next(promise, d, first);
/******/ 							}
/******/ 						} catch(error) {
/******/ 							onError(error);
/******/ 						}
/******/ 					}
/******/ 					const onExternal = (external, _, first) => (external ? handleFunction(__webpack_require__.I, data[0], 0, external, onInitialized, first) : onError());
/******/ 					const onInitialized = (_, external, first) => (handleFunction(external.get, data[1], getScope, 0, onFactory, first));
/******/ 					const onFactory = (factory) => {
/******/ 						data.p = 1;
/******/ 						__webpack_require__.m[id] = (module) => {
/******/ 							module.exports = factory();
/******/ 						}
/******/ 					};
/******/ 					handleFunction(__webpack_require__, data[2], 0, 0, onExternal, 1);
/******/ 				});
/******/ 			}
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/sharing */
/******/ 	(() => {
/******/ 		__webpack_require__.S = {};
/******/ 		const initPromises = {};
/******/ 		const initTokens = {};
/******/ 		__webpack_require__.I = (name, initScope) => {
/******/ 			if(!initScope) initScope = [];
/******/ 			// handling circular init calls
/******/ 			let initToken = initTokens[name];
/******/ 			if(!initToken) initToken = initTokens[name] = {};
/******/ 			if(initScope.indexOf(initToken) >= 0) return;
/******/ 			initScope.push(initToken);
/******/ 			// only runs once
/******/ 			if(initPromises[name]) return initPromises[name];
/******/ 			// creates a new share scope if needed
/******/ 			if(!__webpack_require__.o(__webpack_require__.S, name)) __webpack_require__.S[name] = {};
/******/ 			// runs all init snippets from all modules reachable
/******/ 			const scope = __webpack_require__.S[name];
/******/ 			const warn = (msg) => {
/******/ 				if (typeof console !== "undefined" && console.warn) console.warn(msg);
/******/ 			};
/******/ 			const uniqueName = "shell_1_3_0_f806e49142bc";
/******/ 			const register = (name, version, factory, eager) => {
/******/ 				const versions = scope[name] = scope[name] || {};
/******/ 				const activeVersion = versions[version];
/******/ 				if(!activeVersion || (!activeVersion.loaded && (!eager != !activeVersion.eager ? eager : uniqueName > activeVersion.from))) versions[version] = { get: factory, from: uniqueName, eager: !!eager };
/******/ 			};
/******/ 			const initExternal = (id) => {
/******/ 				const handleError = (err) => (warn("Initialization of sharing external failed: " + err));
/******/ 				try {
/******/ 					const module = __webpack_require__(id);
/******/ 					if(!module) return;
/******/ 					const initFn = (module) => (module && module.init && module.init(__webpack_require__.S[name], initScope))
/******/ 					if(module.then) return promises.push(module.then(initFn, handleError));
/******/ 					const initResult = initFn(module);
/******/ 					if(initResult?.then) return promises.push(initResult['catch'](handleError));
/******/ 				} catch(err) { handleError(err); }
/******/ 			}
/******/ 			const promises = [];
/******/ 			switch(name) {
/******/ 				case "default": {
/******/ 					register("react-dom/client", "19.3.1", () => (Promise.all([__webpack_require__.e("vendors-node_modules_react-dom_client_js"), __webpack_require__.e("webpack_sharing_consume_default_react_react"), __webpack_require__.e("webpack_sharing_consume_default_react-dom_react-dom")]).then(() => (() => (__webpack_require__(/*! ./node_modules/react-dom/client.js */ "./node_modules/react-dom/client.js"))))));
/******/ 					register("react-dom", "19.3.1", () => (Promise.all([__webpack_require__.e("vendors-node_modules_react-dom_index_js"), __webpack_require__.e("webpack_sharing_consume_default_react_react")]).then(() => (() => (__webpack_require__(/*! ./node_modules/react-dom/index.js */ "./node_modules/react-dom/index.js"))))));
/******/ 					register("react", "19.3.1", () => (__webpack_require__.e("vendors-node_modules_react_index_js").then(() => (() => (__webpack_require__(/*! ./node_modules/react/index.js */ "./node_modules/react/index.js"))))));
/******/ 					initExternal("webpack/container/reference/platform");
/******/ 				}
/******/ 				break;
/******/ 			}
/******/ 			if(!promises.length) return initPromises[name] = 1;
/******/ 			return initPromises[name] = Promise.all(promises).then(() => (initPromises[name] = 1));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		let scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		const document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript?.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				const scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					let i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^https?:/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:|[?#].*$/g, "").replace(/\/[^/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/consumes */
/******/ 	(() => {
/******/ 		var parseVersion = (str) => {
/******/ 			// see webpack/lib/sharing/semver.js for original code
/******/ 			var p=p=>{return p.split(".").map(p=>{return+p==p?+p:p})},n=/^([^-+]+)?(?:-([^+]+))?(?:\+(.+))?$/.exec(str),r=n[1]?p(n[1]):[];return n[2]&&(r.length++,r.push.apply(r,p(n[2]))),n[3]&&(r.push([]),r.push.apply(r,p(n[3]))),r;
/******/ 		}
/******/ 		var versionLt = (a, b) => {
/******/ 			// see webpack/lib/sharing/semver.js for original code
/******/ 			a=parseVersion(a),b=parseVersion(b);for(var r=0;;){if(r>=a.length)return r<b.length&&"u"!=(typeof b[r])[0];var e=a[r],n=(typeof e)[0];if(r>=b.length)return"u"==n;var t=b[r],f=(typeof t)[0];if(n!=f)return"o"==n&&"n"==f||("s"==f||"u"==n);if("o"!=n&&"u"!=n&&e!=t)return e<t;r++}
/******/ 		}
/******/ 		var rangeToString = (range) => {
/******/ 			// see webpack/lib/sharing/semver.js for original code
/******/ 			var r=range[0],n="";if(1===range.length)return"*";if(r+.5){n+=0==r?">=":-1==r?"<":1==r?"^":2==r?"~":r>0?"=":"!=";for(var e=1,a=1;a<range.length;a++){e--,n+="u"==(typeof(t=range[a]))[0]?"-":(e>0?".":"")+(e=2,t)}return n}var g=[];for(a=1;a<range.length;a++){var t=range[a];g.push(0===t?"not("+o()+")":1===t?"("+o()+" || "+o()+")":2===t?g.pop()+" "+g.pop():rangeToString(t))}return o();function o(){return g.pop().replace(/^\((.+)\)$/,"$1")}
/******/ 		}
/******/ 		var satisfy = (range, version) => {
/******/ 			// see webpack/lib/sharing/semver.js for original code
/******/ 			if(0 in range){version=parseVersion(version);var e=range[0],r=e<0;r&&(e=-e-1);for(var n=0,i=1,a=!0;;i++,n++){var f,s,g=i<range.length?(typeof range[i])[0]:"";if(n>=version.length||"o"==(s=(typeof(f=version[n]))[0]))return!a||("u"==g?i>e&&!r:""==g!=r);if("u"==s){if(!a||"u"!=g)return!1}else if(a)if(g==s)if(i<=e){if(f!=range[i])return!1}else{if(r?f>range[i]:f<range[i])return!1;f!=range[i]&&(a=!1)}else if("s"!=g&&"n"!=g){if(r||i<=e)return!1;a=!1,i--}else{if(i<=e||s<g!=r)return!1;a=!1}else"s"!=g&&"n"!=g&&(a=!1,i--)}}var t=[],o=t.pop.bind(t);for(n=1;n<range.length;n++){var u=range[n];t.push(1==u?o()|o():2==u?o()&o():u?satisfy(u,version):!o())}return!!o();
/******/ 		}
/******/ 		const exists = (scope, key) => {
/******/ 			return scope && __webpack_require__.o(scope, key);
/******/ 		}
/******/ 		const get = (entry) => {
/******/ 			entry.loaded = 1;
/******/ 			return entry.get()
/******/ 		};
/******/ 		const eagerOnly = (versions) => {
/******/ 			return Object.keys(versions).reduce((filtered, version) => {
/******/ 					if (versions[version].eager) {
/******/ 						filtered[version] = versions[version];
/******/ 					}
/******/ 					return filtered;
/******/ 			}, {});
/******/ 		};
/******/ 		const findLatestVersion = (scope, key, eager) => {
/******/ 			const versions = eager ? eagerOnly(scope[key]) : scope[key];
/******/ 			var key = Object.keys(versions).reduce((a, b) => {
/******/ 				return !a || versionLt(a, b) ? b : a;
/******/ 			}, 0);
/******/ 			return key && versions[key];
/******/ 		};
/******/ 		const findSatisfyingVersion = (scope, key, requiredVersion, eager) => {
/******/ 			const versions = eager ? eagerOnly(scope[key]) : scope[key];
/******/ 			var key = Object.keys(versions).reduce((a, b) => {
/******/ 				if (!satisfy(requiredVersion, b)) return a;
/******/ 				return !a || versionLt(a, b) ? b : a;
/******/ 			}, 0);
/******/ 			return key && versions[key]
/******/ 		};
/******/ 		const findSingletonVersionKey = (scope, key, eager) => {
/******/ 			const versions = eager ? eagerOnly(scope[key]) : scope[key];
/******/ 			return Object.keys(versions).reduce((a, b) => {
/******/ 				return !a || (!versions[a].loaded && versionLt(a, b)) ? b : a;
/******/ 			}, 0);
/******/ 		};
/******/ 		const getInvalidSingletonVersionMessage = (scope, key, version, requiredVersion) => {
/******/ 			return "Unsatisfied version " + version + " from " + (version && scope[key][version].from) + " of shared singleton module " + key + " (required " + rangeToString(requiredVersion) + ")"
/******/ 		};
/******/ 		const getInvalidVersionMessage = (scope, scopeName, key, requiredVersion, eager) => {
/******/ 			const versions = scope[key];
/******/ 			return "No satisfying version (" + rangeToString(requiredVersion) + ")" + (eager ? " for eager consumption" : "") + " of shared module " + key + " found in shared scope " + scopeName + ".\n" +
/******/ 				"Available versions: " + Object.keys(versions).map((key) => {
/******/ 				return key + " from " + versions[key].from;
/******/ 			}).join(", ");
/******/ 		};
/******/ 		const fail = (msg) => {
/******/ 			throw new Error(msg);
/******/ 		}
/******/ 		const failAsNotExist = (scopeName, key) => {
/******/ 			return fail("Shared module " + key + " doesn't exist in shared scope " + scopeName);
/******/ 		}
/******/ 		const warn = /*#__PURE__*/ (msg) => {
/******/ 			if (typeof console !== "undefined" && console.warn) console.warn(msg);
/******/ 		};
/******/ 		const init = (fn) => (function(scopeName, key, eager, c, d) {
/******/ 			const promise = __webpack_require__.I(scopeName);
/******/ 			if (promise?.then && !eager) {
/******/ 				return promise.then(fn.bind(fn, scopeName, __webpack_require__.S[scopeName], key, false, c, d));
/******/ 			}
/******/ 			return fn(scopeName, __webpack_require__.S[scopeName], key, eager, c, d);
/******/ 		});
/******/ 		
/******/ 		const useFallback = (scopeName, key, fallback) => {
/******/ 			return fallback ? fallback() : failAsNotExist(scopeName, key);
/******/ 		}
/******/ 		const load = /*#__PURE__*/ init((scopeName, scope, key, eager, fallback) => {
/******/ 			if (!exists(scope, key)) return useFallback(scopeName, key, fallback);
/******/ 			return get(findLatestVersion(scope, key, eager));
/******/ 		});
/******/ 		const loadVersion = /*#__PURE__*/ init((scopeName, scope, key, eager, requiredVersion, fallback) => {
/******/ 			if (!exists(scope, key)) return useFallback(scopeName, key, fallback);
/******/ 			const satisfyingVersion = findSatisfyingVersion(scope, key, requiredVersion, eager);
/******/ 			if (satisfyingVersion) return get(satisfyingVersion);
/******/ 			warn(getInvalidVersionMessage(scope, scopeName, key, requiredVersion, eager))
/******/ 			return get(findLatestVersion(scope, key, eager));
/******/ 		});
/******/ 		const loadStrictVersion = /*#__PURE__*/ init((scopeName, scope, key, eager, requiredVersion, fallback) => {
/******/ 			if (!exists(scope, key)) return useFallback(scopeName, key, fallback);
/******/ 			const satisfyingVersion = findSatisfyingVersion(scope, key, requiredVersion, eager);
/******/ 			if (satisfyingVersion) return get(satisfyingVersion);
/******/ 			if (fallback) return fallback();
/******/ 			fail(getInvalidVersionMessage(scope, scopeName, key, requiredVersion, eager));
/******/ 		});
/******/ 		const loadSingleton = /*#__PURE__*/ init((scopeName, scope, key, eager, fallback) => {
/******/ 			if (!exists(scope, key)) return useFallback(scopeName, key, fallback);
/******/ 			const version = findSingletonVersionKey(scope, key, eager);
/******/ 			return get(scope[key][version]);
/******/ 		});
/******/ 		const loadSingletonVersion = /*#__PURE__*/ init((scopeName, scope, key, eager, requiredVersion, fallback) => {
/******/ 			if (!exists(scope, key)) return useFallback(scopeName, key, fallback);
/******/ 			const version = findSingletonVersionKey(scope, key, eager);
/******/ 			if (!satisfy(requiredVersion, version)) {
/******/ 				warn(getInvalidSingletonVersionMessage(scope, key, version, requiredVersion));
/******/ 			}
/******/ 			return get(scope[key][version]);
/******/ 		});
/******/ 		const loadStrictSingletonVersion = /*#__PURE__*/ init((scopeName, scope, key, eager, requiredVersion, fallback) => {
/******/ 			if (!exists(scope, key)) return useFallback(scopeName, key, fallback);
/******/ 			const version = findSingletonVersionKey(scope, key, eager);
/******/ 			if (!satisfy(requiredVersion, version)) {
/******/ 				fail(getInvalidSingletonVersionMessage(scope, key, version, requiredVersion));
/******/ 			}
/******/ 			return get(scope[key][version]);
/******/ 		});
/******/ 		const installedModules = {};
/******/ 		const moduleToHandlerMapping = {
/******/ 			"webpack/sharing/consume/default/react/react": () => (loadStrictSingletonVersion("default", "react", false, [4,19,3,1], () => (__webpack_require__.e("vendors-node_modules_react_index_js").then(() => (() => (__webpack_require__(/*! react */ "./node_modules/react/index.js"))))))),
/******/ 			"webpack/sharing/consume/default/react-dom/client/react-dom/client": () => (loadStrictSingletonVersion("default", "react-dom/client", false, [4,19,3,1], () => (Promise.all([__webpack_require__.e("vendors-node_modules_react-dom_client_js"), __webpack_require__.e("webpack_sharing_consume_default_react-dom_react-dom")]).then(() => (() => (__webpack_require__(/*! react-dom/client */ "./node_modules/react-dom/client.js"))))))),
/******/ 			"webpack/sharing/consume/default/react-dom/react-dom": () => (loadStrictSingletonVersion("default", "react-dom", false, [4,19,3,1], () => (__webpack_require__.e("vendors-node_modules_react-dom_index_js").then(() => (() => (__webpack_require__(/*! react-dom */ "./node_modules/react-dom/index.js")))))))
/******/ 		};
/******/ 		// no consumes in initial chunks
/******/ 		const chunkMapping = {
/******/ 			"webpack_sharing_consume_default_react_react": [
/******/ 				"webpack/sharing/consume/default/react/react"
/******/ 			],
/******/ 			"src_bootstrap_jsx": [
/******/ 				"webpack/sharing/consume/default/react-dom/client/react-dom/client"
/******/ 			],
/******/ 			"webpack_sharing_consume_default_react-dom_react-dom": [
/******/ 				"webpack/sharing/consume/default/react-dom/react-dom"
/******/ 			]
/******/ 		};
/******/ 		const startedInstallModules = {};
/******/ 		__webpack_require__.f.consumes = (chunkId, promises) => {
/******/ 			if(__webpack_require__.o(chunkMapping, chunkId)) {
/******/ 				chunkMapping[chunkId].forEach((id) => {
/******/ 					if(__webpack_require__.o(installedModules, id)) return promises.push(installedModules[id]);
/******/ 					if(!startedInstallModules[id]) {
/******/ 					const onFactory = (factory) => {
/******/ 						installedModules[id] = 0;
/******/ 						__webpack_require__.m[id] = (module) => {
/******/ 							delete __webpack_require__.c[id];
/******/ 							module.exports = factory();
/******/ 						}
/******/ 					};
/******/ 					startedInstallModules[id] = true;
/******/ 					const onError = (error) => {
/******/ 						delete installedModules[id];
/******/ 						__webpack_require__.m[id] = (module) => {
/******/ 							delete __webpack_require__.c[id];
/******/ 							throw error;
/******/ 						}
/******/ 					};
/******/ 					try {
/******/ 						const promise = moduleToHandlerMapping[id]();
/******/ 						if(promise.then) {
/******/ 							promises.push(installedModules[id] = promise.then(onFactory)['catch'](onError));
/******/ 						} else onFactory(promise);
/******/ 					} catch(e) { onError(e); }
/******/ 					}
/******/ 				});
/******/ 			}
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		const installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				let installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(!/^webpack_sharing_consume_default_react(\-dom_react\-dom|_react)$/.test(chunkId)) {
/******/ 							// setup Promise in chunk cache
/******/ 							const promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							const error = new Error();
/******/ 							const loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										const errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										const realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										error.event = event;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(__webpack_require__.p + __webpack_require__.u(chunkId), loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						} else installedChunks[chunkId] = 0;
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		const webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			let [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		const chunkLoadingGlobal = self["webpackChunkshell_1_3_0_f806e49142bc"] = self["webpackChunkshell_1_3_0_f806e49142bc"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	__webpack_require__.nc = undefined;
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	let __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=shell.js.map