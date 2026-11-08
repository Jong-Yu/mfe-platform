"use strict";
(self["webpackChunkplatform_1_4_0_837cf2de56e4"] = self["webpackChunkplatform_1_4_0_837cf2de56e4"] || []).push([["src_sdk_jsx"],{

/***/ "./src/RemoteRegion.jsx"
/*!******************************!*\
  !*** ./src/RemoteRegion.jsx ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ RemoteRegion)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _remote_loader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./remote-loader */ "./src/remote-loader.js");
/* harmony import */ var _RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./RemoteRegion.module.css */ "./src/RemoteRegion.module.css");
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
;


function Unavailable({
  instanceId,
  label,
  onRetry
}) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_2__["default"].unavailable,
    role: "alert",
    "data-testid": `remote-error-${instanceId}`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, label, " \uC601\uC5ED\uC744 \uD45C\uC2DC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uB2E4\uB978 \uC601\uC5ED\uC740 \uACC4\uC18D \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    "data-testid": `retry-${instanceId}`,
    onClick: onRetry
  }, label, " \uC601\uC5ED \uB2E4\uC2DC \uC2DC\uB3C4"));
}
class RenderBoundary extends (react__WEBPACK_IMPORTED_MODULE_0___default().Component) {
  state = {
    failed: false
  };
  static getDerivedStateFromError() {
    return {
      failed: true
    };
  }
  componentDidCatch(error) {
    console.error('RemoteRegion render failed:', error);
  }
  render() {
    return this.state.failed ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Unavailable, {
      instanceId: this.props.instanceId,
      label: this.props.label,
      onRetry: this.props.onRetry
    }) : this.props.children;
  }
}
function LoadingRegion({
  consumerId,
  alias,
  exposedModule,
  instanceId,
  label,
  componentProps,
  retry,
  onRetry
}) {
  const [result, setResult] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    let active = true;
    (0,_remote_loader__WEBPACK_IMPORTED_MODULE_1__.loadRemoteDependency)(consumerId, alias, exposedModule, retry).then(module => {
      if (active) setResult({
        Component: module.default
      });
    }, error => {
      if (!active) return;
      console.error('RemoteRegion load failed:', error);
      setResult({
        error
      });
    });
    // Shared network work may finish after this particular region is removed.
    return () => {
      active = false;
    };
  }, [consumerId, alias, exposedModule, retry]);
  if (!result) return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_2__["default"].loading,
    role: "status",
    "data-testid": `remote-loading-${instanceId}`
  }, retry ? `${label} 영역을 다시 시도하는 중입니다. 일시적인 연결 오류는 한 번 더 시도합니다.` : `${label} 영역을 불러오는 중입니다.`);
  if (result.error) return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Unavailable, {
    instanceId: instanceId,
    label: label,
    onRetry: onRetry
  });
  const Component = result.Component;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RenderBoundary, {
    instanceId: instanceId,
    label: label,
    onRetry: onRetry
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Component, componentProps));
}
function Region(props) {
  const [attempt, setAttempt] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(LoadingRegion, _extends({
    key: attempt
  }, props, {
    retry: attempt > 0,
    onRetry: () => setAttempt(value => value + 1)
  }));
}
function RemoteRegion({
  consumerId,
  alias,
  exposedModule = './Widget',
  instanceId,
  label = '서비스',
  componentProps
}) {
  // A different consumer or module starts a fresh region; labels and component
  // props can update without discarding a mounted remote's local state.
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Region, {
    key: JSON.stringify([consumerId, alias, exposedModule, instanceId]),
    consumerId: consumerId,
    alias: alias,
    exposedModule: exposedModule,
    instanceId: instanceId,
    label: label,
    componentProps: componentProps
  });
}

/***/ },

/***/ "./src/remote-loader.js"
/*!******************************!*\
  !*** ./src/remote-loader.js ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRemoteRecoveryLog: () => (/* binding */ getRemoteRecoveryLog),
/* harmony export */   loadRemoteDependency: () => (/* binding */ loadRemoteDependency)
/* harmony export */ });
// Each runtime has an immutable composition; consumer aliases are local to it.
const moduleCaches = new WeakMap();
const recoveryLog = [];
const retryProtocols = new Set(['failed-modules-v1', 'failed-modules-v2']);
const retryDelayMs = 500;
function isTransientLoadError(error) {
  // These are the actual error contracts of this platform loader and webpack.
  // Invalid bindings, missing exposes, render failures and application errors
  // are not automatically retried.
  return error?.name === 'ChunkLoadError' || /^Remote (unavailable|timed out): /.test(error?.message || '') || /^(Module |Initialization ).+ timed out$/.test(error?.message || '');
}
function getRemoteRecoveryLog() {
  return recoveryLog.map(entry => ({
    ...entry,
    removed: [...entry.removed],
    prepared: [...entry.prepared]
  }));
}
async function resetFailedBranch(runtime, artifact, scope, context, preparedFactories, visited = new Set()) {
  if (visited.has(artifact.id) || artifact.service === 'platform') return;
  visited.add(artifact.id);
  const registry = runtime.registry;
  const children = [...Object.values(artifact.dependencies || {}), ...Object.values(registry.runtimeBindings[artifact.id] || {})];
  for (const id of children) await resetFailedBranch(runtime, registry.artifacts[id], scope, context, preparedFactories, visited);
  if (!retryProtocols.has(artifact.retryProtocol)) return;
  const container = await runtime.getArtifactContainer(artifact);
  await container.init(scope);
  const controls = (await container.get('./__mfe_retry__'))();
  if (controls.protocol !== artifact.retryProtocol) throw new Error('Unsupported remote retry protocol');
  const failedExposes = controls.protocol === 'failed-modules-v2' ? controls.getFailedExposes() : [];
  const removed = controls.resetFailedModules();
  const record = {
    ...context,
    artifactId: artifact.id,
    removed,
    prepared: []
  };
  recoveryLog.push(record);
  if (recoveryLog.length > 50) recoveryLog.shift();
  // A parent's successful get may still hold this child's factory even when
  // evaluating that factory failed. Re-run chunk/dependency loading first;
  // do not evaluate the factory or mount anything during preparation.
  for (const request of failedExposes) {
    const factory = await container.get(request);
    preparedFactories.set(JSON.stringify([artifact.id, request]), factory);
    record.prepared.push(request);
  }
}
async function loadRemoteDependency(consumerId, alias, exposedModule, retry) {
  if (![consumerId, alias, exposedModule].every(value => typeof value === 'string' && value.length > 0)) {
    throw new Error('RemoteRegion requires a consumerId, alias and exposedModule.');
  }
  const runtime = globalThis.__MFE_RUNTIME__;
  if (!runtime) throw new Error('RemoteRegion requires an initialized platform runtime.');
  let modules = moduleCaches.get(runtime);
  if (!modules) {
    modules = new Map();
    moduleCaches.set(runtime, modules);
  }
  const key = JSON.stringify([consumerId, alias, exposedModule]);
  if (!modules.has(key)) {
    const loadOnce = async attempt => {
      // The caller's ID must be supplied by the service. This SDK's build ID
      // is not the consumer of the requested remote.
      await __webpack_require__.I('default');
      const container = await runtime.getDependencyContainer(consumerId, alias);
      await container.init(__webpack_require__.S.default);
      let factory;
      if (retry) {
        const target = runtime.registry.artifacts[runtime.registry.runtimeBindings[consumerId][alias]];
        if (!retryProtocols.has(target.retryProtocol)) throw new Error('This remote build does not support local retry');
        const preparedFactories = new Map();
        await resetFailedBranch(runtime, target, __webpack_require__.S.default, {
          consumerId,
          alias,
          exposedModule,
          attempt
        }, preparedFactories);
        // Preparing the root may already have obtained its factory. Calling
        // get again could silently retry a failed child before our delay.
        factory = preparedFactories.get(JSON.stringify([target.id, exposedModule]));
      }
      if (!factory) factory = await container.get(exposedModule);
      const module = factory();
      if (!module.default) throw new Error(`Missing default component: ${alias}/${exposedModule}`);
      return module;
    };
    // The whole retry operation, including its delay, is shared by duplicate
    // regions. Initial loading is unchanged; one manual click gets at most two
    // attempts, and only a transient loading failure triggers the second one.
    const pending = (async () => {
      try {
        return await loadOnce(1);
      } catch (error) {
        if (!retry || !isTransientLoadError(error)) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        return loadOnce(2);
      }
    })();
    modules.set(key, pending);
    pending.catch(() => {
      if (modules.get(key) === pending) modules.delete(key);
    });
  }
  return modules.get(key);
}

/***/ },

/***/ "./src/sdk.jsx"
/*!*********************!*\
  !*** ./src/sdk.jsx ***!
  \*********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DevLayout: () => (/* binding */ DevLayout),
/* harmony export */   PageContainer: () => (/* binding */ PageContainer),
/* harmony export */   PlatformContext: () => (/* binding */ PlatformContext),
/* harmony export */   PlatformProvider: () => (/* binding */ PlatformProvider),
/* harmony export */   ReactIdentity: () => (/* binding */ ReactIdentity),
/* harmony export */   RemoteRegion: () => (/* reexport safe */ _RemoteRegion__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   WidgetBoundary: () => (/* binding */ WidgetBoundary),
/* harmony export */   emitDemoEvent: () => (/* binding */ emitDemoEvent),
/* harmony export */   getRemoteRecoveryLog: () => (/* reexport safe */ _remote_loader__WEBPACK_IMPORTED_MODULE_3__.getRemoteRecoveryLog),
/* harmony export */   getRuntimeSnapshot: () => (/* binding */ getRuntimeSnapshot),
/* harmony export */   usePlatform: () => (/* binding */ usePlatform),
/* harmony export */   useWidgetScope: () => (/* binding */ useWidgetScope)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Layout.module.css */ "./src/Layout.module.css");
/* harmony import */ var _RemoteRegion__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./RemoteRegion */ "./src/RemoteRegion.jsx");
/* harmony import */ var _remote_loader__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./remote-loader */ "./src/remote-loader.js");


const ReactIdentity = (react__WEBPACK_IMPORTED_MODULE_0___default());
const PlatformContext = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(null);
const PLATFORM_VERSION = "1.4.0";
const WidgetScopeContext = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(null);
const activeScopes = new Set();
const defaultUser = Object.freeze({
  name: '김개발',
  id: 'demo'
});
function PlatformProvider({
  children,
  user = defaultUser,
  theme = 'light'
}) {
  const value = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => ({
    platformVersion: PLATFORM_VERSION,
    user,
    theme
  }), [user, theme]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(PlatformContext.Provider, {
    value: value
  }, children);
}
function PageContainer({
  title,
  description,
  actions,
  children,
  width = 'standard'
}) {
  const titleId = (0,react__WEBPACK_IMPORTED_MODULE_0__.useId)();
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: `${_Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].page} ${width === 'wide' ? _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].wide : ''}`,
    "aria-labelledby": title ? titleId : undefined,
    "data-page-container": true
  }, (title || description || actions) && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("header", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].pageHeader
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, title && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", {
    id: titleId,
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].title
  }, title), description && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].description
  }, description)), actions && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].actions
  }, actions)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].content
  }, children));
}

// A development-only shell lookalike. Production navigation stays with the Shell.
function DevLayout({
  serviceName,
  children,
  tools
}) {
  const platform = usePlatform();
  const contentId = (0,react__WEBPACK_IMPORTED_MODULE_0__.useId)();
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].layout,
    "data-dev-layout": true,
    "data-theme": platform.theme
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].skip,
    href: `#${contentId}`
  }, "\uCF58\uD150\uCE20\uB85C \uC774\uB3D9"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("aside", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].sidebar,
    "aria-label": "\uAC1C\uBC1C \uD658\uACBD"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].brand
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].mark
  }, "M"), " Platform Dev"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].label
  }, "LOCAL WORKSPACE"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].selected
  }, serviceName), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].note
  }, "\uC11C\uBE44\uC2A4 \uB2E8\uB3C5 \uAC1C\uBC1C", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "SDK ", platform.platformVersion, " \xB7 MF")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].workspace
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("header", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].header
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uAC1C\uBC1C \uBBF8\uB9AC\uBCF4\uAE30 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, serviceName)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, platform.user.name)), tools && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__["default"].tools
  }, tools), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("main", {
    id: contentId,
    tabIndex: -1
  }, children)));
}
function usePlatform() {
  const platform = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(PlatformContext);
  if (!platform) {
    throw new Error('usePlatform requires PlatformProvider.');
  }
  return platform;
}
function WidgetBoundary({
  instanceId,
  artifactId,
  children
}) {
  const [count, setCount] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [eventCount, setEventCount] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [portalRoot, setPortalRoot] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [runtime] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(() => ({
    instanceId,
    artifactId,
    count: 0,
    eventCount: 0,
    cache: new Map(),
    subscriptions: new Set(),
    incrementEventCount() {
      this.eventCount += 1;
      setEventCount(this.eventCount);
    }
  }));
  const subscribe = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(handler => {
    if (typeof handler !== 'function') {
      throw new TypeError('subscribe requires a function.');
    }
    const subscription = {
      handler
    };
    runtime.subscriptions.add(subscription);
    return () => {
      runtime.subscriptions.delete(subscription);
    };
  }, [runtime]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect)(() => {
    runtime.instanceId = instanceId;
    runtime.artifactId = artifactId;
    runtime.count = count;
  }, [runtime, instanceId, artifactId, count]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    activeScopes.add(runtime);
    return () => {
      activeScopes.delete(runtime);
      runtime.subscriptions.clear();
    };
  }, [runtime]);
  const scope = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => ({
    instanceId,
    artifactId,
    count,
    setCount,
    eventCount,
    cache: runtime.cache,
    portalRoot,
    subscribe
  }), [instanceId, artifactId, count, eventCount, runtime, portalRoot, subscribe]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(WidgetScopeContext.Provider, {
    value: scope
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    "data-widget-scope": instanceId
  }, children, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    "data-portal-scope": instanceId,
    ref: setPortalRoot
  })));
}
function useWidgetScope() {
  const scope = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(WidgetScopeContext);
  if (!scope) {
    throw new Error('useWidgetScope requires WidgetBoundary.');
  }
  return scope;
}
function getRuntimeSnapshot() {
  const instances = [...activeScopes];
  return {
    activeInstances: instances.map(scope => ({
      instanceId: scope.instanceId,
      artifactId: scope.artifactId,
      count: scope.count,
      eventCount: scope.eventCount,
      cacheSize: scope.cache.size
    })),
    activeSubscriptions: instances.reduce((total, scope) => total + scope.subscriptions.size, 0),
    eventCounts: Object.fromEntries(instances.map(scope => [scope.instanceId, scope.eventCount])),
    platformVersion: PLATFORM_VERSION
  };
}
function emitDemoEvent() {
  let notified = 0;
  for (const scope of [...activeScopes]) {
    if (!activeScopes.has(scope) || scope.subscriptions.size === 0) continue;
    scope.incrementEventCount();
    const event = {
      type: 'demo',
      instanceId: scope.instanceId,
      artifactId: scope.artifactId
    };
    for (const subscription of [...scope.subscriptions]) {
      if (!scope.subscriptions.has(subscription)) continue;
      subscription.handler(event);
      notified += 1;
    }
  }
  return notified;
}



/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./src/Layout.module.css"
/*!*************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./src/Layout.module.css ***!
  \*************************************************************************************************/
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.platform_1_4_0_837cf2de56e4__layout__ucikXg { display: grid; grid-template-columns: 228px minmax(0, 1fr); min-height: 100vh; background: #f4f6fb; color: #18283f; font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", system-ui, sans-serif; line-height: 1.6; }
.platform_1_4_0_837cf2de56e4__layout__ucikXg *, .platform_1_4_0_837cf2de56e4__page__pI5BWd * { box-sizing: border-box; }
.platform_1_4_0_837cf2de56e4__sidebar__pn2IGX { display: flex; flex-direction: column; padding: 28px 20px; background: #14223a; color: #dae6fa; }
.platform_1_4_0_837cf2de56e4__brand__EUDn0r { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; margin-bottom: 48px; }
.platform_1_4_0_837cf2de56e4__mark__OuGGve { display: grid; place-items: center; width: 32px; height: 32px; background: #6387fa; border-radius: 9px; color: white; }
.platform_1_4_0_837cf2de56e4__label__JCmfZp { color: #9fb1ce; font-size: 11px; letter-spacing: .1em; }
.platform_1_4_0_837cf2de56e4__selected__roYcn1 { margin-top: 12px; padding: 12px; background: #253b5c; border-radius: 8px; overflow-wrap: anywhere; }
.platform_1_4_0_837cf2de56e4__note__ikOFvC { margin-top: auto; padding-top: 32px; font-size: 12px; color: #aabbd5; }
.platform_1_4_0_837cf2de56e4__workspace__NNJRyi { min-width: 0; }
.platform_1_4_0_837cf2de56e4__header__kbJwZM { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px 30px; background: white; border-bottom: 1px solid #dbe3ee; font-size: 14px; }
.platform_1_4_0_837cf2de56e4__header__kbJwZM strong { margin-left: 12px; }
.platform_1_4_0_837cf2de56e4__tools__WI4q5_ { padding: 14px 30px; background: #eaf0fd; }
.platform_1_4_0_837cf2de56e4__page__pI5BWd { box-sizing: border-box; width: 100%; max-width: 1120px; margin-inline: auto; padding: 32px; min-width: 0; color: inherit; }
.platform_1_4_0_837cf2de56e4__wide__TvHE8x { max-width: 1480px; }
.platform_1_4_0_837cf2de56e4__pageHeader__af8DE8 { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
.platform_1_4_0_837cf2de56e4__title___XFsqF { margin: 0; font-size: clamp(24px, 3vw, 34px); line-height: 1.35; overflow-wrap: anywhere; }
.platform_1_4_0_837cf2de56e4__description__N0Ky6x { color: #54657d; margin: 10px 0 0; }
.platform_1_4_0_837cf2de56e4__actions__M4w7qm { display: flex; flex-wrap: wrap; gap: 8px; }
.platform_1_4_0_837cf2de56e4__content__jq9Xmn { min-width: 0; }
.platform_1_4_0_837cf2de56e4__skip__AzvB0U { position: absolute; left: 16px; top: -100px; padding: 10px; background: white; color: #1843a3; z-index: 10; }
.platform_1_4_0_837cf2de56e4__skip__AzvB0U:focus { top: 12px; }
.platform_1_4_0_837cf2de56e4__layout__ucikXg[data-theme="dark"] { background: #15233a; color: #e4ecff; }
.platform_1_4_0_837cf2de56e4__layout__ucikXg[data-theme="dark"] .platform_1_4_0_837cf2de56e4__header__kbJwZM { background: #20324e; border-color: #385070; }
.platform_1_4_0_837cf2de56e4__layout__ucikXg[data-theme="dark"] .platform_1_4_0_837cf2de56e4__tools__WI4q5_ { background: #253b5c; }
.platform_1_4_0_837cf2de56e4__layout__ucikXg[data-theme="dark"] .platform_1_4_0_837cf2de56e4__description__N0Ky6x { color: #b7c7e2; }
@media (max-width: 760px) { .platform_1_4_0_837cf2de56e4__layout__ucikXg { grid-template-columns: 1fr; } .platform_1_4_0_837cf2de56e4__sidebar__pn2IGX { padding: 15px 20px; } .platform_1_4_0_837cf2de56e4__brand__EUDn0r { margin: 0; } .platform_1_4_0_837cf2de56e4__label__JCmfZp, .platform_1_4_0_837cf2de56e4__selected__roYcn1, .platform_1_4_0_837cf2de56e4__note__ikOFvC { display: none; } .platform_1_4_0_837cf2de56e4__header__kbJwZM, .platform_1_4_0_837cf2de56e4__tools__WI4q5_ { padding: 14px 20px; } .platform_1_4_0_837cf2de56e4__page__pI5BWd { padding: 24px 16px; } }
`, "",{"version":3,"sources":["webpack://./src/Layout.module.css"],"names":[],"mappings":"AAAA,+CAAU,aAAa,EAAE,2CAA2C,EAAE,iBAAiB,EAAE,mBAAmB,EAAE,cAAc,EAAE,4FAA4F,EAAE,gBAAgB,EAAE;AAC9O,+FAAqB,sBAAsB,EAAE;AAC7C,gDAAW,aAAa,EAAE,sBAAsB,EAAE,kBAAkB,EAAE,mBAAmB,EAAE,cAAc,EAAE;AAC3G,8CAAS,aAAa,EAAE,mBAAmB,EAAE,SAAS,EAAE,eAAe,EAAE,gBAAgB,EAAE,mBAAmB,EAAE;AAChH,6CAAQ,aAAa,EAAE,mBAAmB,EAAE,WAAW,EAAE,YAAY,EAAE,mBAAmB,EAAE,kBAAkB,EAAE,YAAY,EAAE;AAC9H,8CAAS,cAAc,EAAE,eAAe,EAAE,oBAAoB,EAAE;AAChE,iDAAY,gBAAgB,EAAE,aAAa,EAAE,mBAAmB,EAAE,kBAAkB,EAAE,uBAAuB,EAAE;AAC/G,6CAAQ,gBAAgB,EAAE,iBAAiB,EAAE,eAAe,EAAE,cAAc,EAAE;AAC9E,kDAAa,YAAY,EAAE;AAC3B,+CAAU,aAAa,EAAE,8BAA8B,EAAE,eAAe,EAAE,SAAS,EAAE,kBAAkB,EAAE,iBAAiB,EAAE,gCAAgC,EAAE,eAAe,EAAE;AAC/K,sDAAiB,iBAAiB,EAAE;AACpC,8CAAS,kBAAkB,EAAE,mBAAmB,EAAE;AAClD,6CAAQ,sBAAsB,EAAE,WAAW,EAAE,iBAAiB,EAAE,mBAAmB,EAAE,aAAa,EAAE,YAAY,EAAE,cAAc,EAAE;AAClI,6CAAQ,iBAAiB,EAAE;AAC3B,mDAAc,aAAa,EAAE,eAAe,EAAE,8BAA8B,EAAE,uBAAuB,EAAE,SAAS,EAAE,mBAAmB,EAAE;AACvI,8CAAS,SAAS,EAAE,iCAAiC,EAAE,iBAAiB,EAAE,uBAAuB,EAAE;AACnG,oDAAe,cAAc,EAAE,gBAAgB,EAAE;AACjD,gDAAW,aAAa,EAAE,eAAe,EAAE,QAAQ,EAAE;AACrD,gDAAW,YAAY,EAAE;AACzB,6CAAQ,kBAAkB,EAAE,UAAU,EAAE,WAAW,EAAE,aAAa,EAAE,iBAAiB,EAAE,cAAc,EAAE,WAAW,EAAE;AACpH,mDAAc,SAAS,EAAE;AACzB,kEAA6B,mBAAmB,EAAE,cAAc,EAAE;AAClE,+GAAqC,mBAAmB,EAAE,qBAAqB,EAAE;AACjF,8GAAoC,mBAAmB,EAAE;AACzD,oHAA0C,cAAc,EAAE;AAC1D,4BAA4B,+CAAU,0BAA0B,EAAE,EAAE,gDAAW,kBAAkB,EAAE,EAAE,8CAAS,SAAS,EAAE,EAAE,0IAA2B,aAAa,EAAE,EAAE,4FAAkB,kBAAkB,EAAE,EAAE,6CAAQ,kBAAkB,EAAE,EAAE","sourcesContent":[".layout { display: grid; grid-template-columns: 228px minmax(0, 1fr); min-height: 100vh; background: #f4f6fb; color: #18283f; font-family: -apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", system-ui, sans-serif; line-height: 1.6; }\n.layout *, .page * { box-sizing: border-box; }\n.sidebar { display: flex; flex-direction: column; padding: 28px 20px; background: #14223a; color: #dae6fa; }\n.brand { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; margin-bottom: 48px; }\n.mark { display: grid; place-items: center; width: 32px; height: 32px; background: #6387fa; border-radius: 9px; color: white; }\n.label { color: #9fb1ce; font-size: 11px; letter-spacing: .1em; }\n.selected { margin-top: 12px; padding: 12px; background: #253b5c; border-radius: 8px; overflow-wrap: anywhere; }\n.note { margin-top: auto; padding-top: 32px; font-size: 12px; color: #aabbd5; }\n.workspace { min-width: 0; }\n.header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px 30px; background: white; border-bottom: 1px solid #dbe3ee; font-size: 14px; }\n.header strong { margin-left: 12px; }\n.tools { padding: 14px 30px; background: #eaf0fd; }\n.page { box-sizing: border-box; width: 100%; max-width: 1120px; margin-inline: auto; padding: 32px; min-width: 0; color: inherit; }\n.wide { max-width: 1480px; }\n.pageHeader { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }\n.title { margin: 0; font-size: clamp(24px, 3vw, 34px); line-height: 1.35; overflow-wrap: anywhere; }\n.description { color: #54657d; margin: 10px 0 0; }\n.actions { display: flex; flex-wrap: wrap; gap: 8px; }\n.content { min-width: 0; }\n.skip { position: absolute; left: 16px; top: -100px; padding: 10px; background: white; color: #1843a3; z-index: 10; }\n.skip:focus { top: 12px; }\n.layout[data-theme=\"dark\"] { background: #15233a; color: #e4ecff; }\n.layout[data-theme=\"dark\"] .header { background: #20324e; border-color: #385070; }\n.layout[data-theme=\"dark\"] .tools { background: #253b5c; }\n.layout[data-theme=\"dark\"] .description { color: #b7c7e2; }\n@media (max-width: 760px) { .layout { grid-template-columns: 1fr; } .sidebar { padding: 15px 20px; } .brand { margin: 0; } .label, .selected, .note { display: none; } .header, .tools { padding: 14px 20px; } .page { padding: 24px 16px; } }\n"],"sourceRoot":""}]);
// Exports
___CSS_LOADER_EXPORT___.locals = {
	"layout": `platform_1_4_0_837cf2de56e4__layout__ucikXg`,
	"page": `platform_1_4_0_837cf2de56e4__page__pI5BWd`,
	"sidebar": `platform_1_4_0_837cf2de56e4__sidebar__pn2IGX`,
	"brand": `platform_1_4_0_837cf2de56e4__brand__EUDn0r`,
	"mark": `platform_1_4_0_837cf2de56e4__mark__OuGGve`,
	"label": `platform_1_4_0_837cf2de56e4__label__JCmfZp`,
	"selected": `platform_1_4_0_837cf2de56e4__selected__roYcn1`,
	"note": `platform_1_4_0_837cf2de56e4__note__ikOFvC`,
	"workspace": `platform_1_4_0_837cf2de56e4__workspace__NNJRyi`,
	"header": `platform_1_4_0_837cf2de56e4__header__kbJwZM`,
	"tools": `platform_1_4_0_837cf2de56e4__tools__WI4q5_`,
	"wide": `platform_1_4_0_837cf2de56e4__wide__TvHE8x`,
	"pageHeader": `platform_1_4_0_837cf2de56e4__pageHeader__af8DE8`,
	"title": `platform_1_4_0_837cf2de56e4__title___XFsqF`,
	"description": `platform_1_4_0_837cf2de56e4__description__N0Ky6x`,
	"actions": `platform_1_4_0_837cf2de56e4__actions__M4w7qm`,
	"content": `platform_1_4_0_837cf2de56e4__content__jq9Xmn`,
	"skip": `platform_1_4_0_837cf2de56e4__skip__AzvB0U`
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./src/RemoteRegion.module.css"
/*!*******************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./src/RemoteRegion.module.css ***!
  \*******************************************************************************************************/
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.platform_1_4_0_837cf2de56e4__loading__WYr5CH, .platform_1_4_0_837cf2de56e4__unavailable__hvVyIG { padding: 18px; border-radius: 12px; border: 1px solid #ccd6e4; background: white; color: #33445c; }
.platform_1_4_0_837cf2de56e4__unavailable__hvVyIG { border-color: #d4b086; background: #fff8ee; color: #6b451e; }
.platform_1_4_0_837cf2de56e4__unavailable__hvVyIG p { margin: 8px 0 0; }
.platform_1_4_0_837cf2de56e4__unavailable__hvVyIG button { margin-top: 12px; padding: 9px 12px; border: 1px solid #996a34; border-radius: 7px; background: white; color: #6b451e; cursor: pointer; }
.platform_1_4_0_837cf2de56e4__unavailable__hvVyIG button:focus-visible { outline: 3px solid #3454dc; outline-offset: 3px; }
`, "",{"version":3,"sources":["webpack://./src/RemoteRegion.module.css"],"names":[],"mappings":"AAAA,mGAAyB,aAAa,EAAE,mBAAmB,EAAE,yBAAyB,EAAE,iBAAiB,EAAE,cAAc,EAAE;AAC3H,oDAAe,qBAAqB,EAAE,mBAAmB,EAAE,cAAc,EAAE;AAC3E,sDAAiB,eAAe,EAAE;AAClC,2DAAsB,gBAAgB,EAAE,iBAAiB,EAAE,yBAAyB,EAAE,kBAAkB,EAAE,iBAAiB,EAAE,cAAc,EAAE,eAAe,EAAE;AAC9J,yEAAoC,0BAA0B,EAAE,mBAAmB,EAAE","sourcesContent":[".loading, .unavailable { padding: 18px; border-radius: 12px; border: 1px solid #ccd6e4; background: white; color: #33445c; }\n.unavailable { border-color: #d4b086; background: #fff8ee; color: #6b451e; }\n.unavailable p { margin: 8px 0 0; }\n.unavailable button { margin-top: 12px; padding: 9px 12px; border: 1px solid #996a34; border-radius: 7px; background: white; color: #6b451e; cursor: pointer; }\n.unavailable button:focus-visible { outline: 3px solid #3454dc; outline-offset: 3px; }\n"],"sourceRoot":""}]);
// Exports
___CSS_LOADER_EXPORT___.locals = {
	"loading": `platform_1_4_0_837cf2de56e4__loading__WYr5CH`,
	"unavailable": `platform_1_4_0_837cf2de56e4__unavailable__hvVyIG`
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ },

/***/ "./node_modules/css-loader/dist/runtime/api.js"
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
(module) {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ },

/***/ "./node_modules/css-loader/dist/runtime/sourceMaps.js"
/*!************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \************************************************************/
(module) {



module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];
  if (!cssMapping) {
    return content;
  }
  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    return [content].concat([sourceMapping]).join("\n");
  }
  return [content].join("\n");
};

/***/ },

/***/ "./src/Layout.module.css"
/*!*******************************!*\
  !*** ./src/Layout.module.css ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Layout_module_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./Layout.module.css */ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./src/Layout.module.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Layout_module_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Layout_module_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Layout_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Layout_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ },

/***/ "./src/RemoteRegion.module.css"
/*!*************************************!*\
  !*** ./src/RemoteRegion.module.css ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./RemoteRegion.module.css */ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./src/RemoteRegion.module.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ },

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
(module) {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js"
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
(module) {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js"
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
(module) {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js"
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js"
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
(module) {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js"
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
(module) {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }

}]);
//# sourceMappingURL=src_sdk_jsx.d9705db060b5f8d5750b.js.map