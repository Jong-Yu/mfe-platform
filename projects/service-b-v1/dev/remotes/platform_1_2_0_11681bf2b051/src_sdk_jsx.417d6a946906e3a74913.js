"use strict";
(self["webpackChunkplatform_1_2_0_11681bf2b051"] = self["webpackChunkplatform_1_2_0_11681bf2b051"] || []).push([["src_sdk_jsx"],{

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
/* harmony export */   WidgetBoundary: () => (/* binding */ WidgetBoundary),
/* harmony export */   emitDemoEvent: () => (/* binding */ emitDemoEvent),
/* harmony export */   getRuntimeSnapshot: () => (/* binding */ getRuntimeSnapshot),
/* harmony export */   usePlatform: () => (/* binding */ usePlatform),
/* harmony export */   useWidgetScope: () => (/* binding */ useWidgetScope)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Layout_module_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Layout.module.css */ "./src/Layout.module.css");


const ReactIdentity = (react__WEBPACK_IMPORTED_MODULE_0___default());
const PlatformContext = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(null);
const PLATFORM_VERSION = "1.2.0";
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
___CSS_LOADER_EXPORT___.push([module.id, `.platform_1_2_0_11681bf2b051__layout__cMFUHe { display: grid; grid-template-columns: 228px minmax(0, 1fr); min-height: 100vh; background: #f4f6fb; color: #18283f; font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", system-ui, sans-serif; line-height: 1.6; }
.platform_1_2_0_11681bf2b051__layout__cMFUHe *, .platform_1_2_0_11681bf2b051__page__zmHzQ5 * { box-sizing: border-box; }
.platform_1_2_0_11681bf2b051__sidebar__wup9VK { display: flex; flex-direction: column; padding: 28px 20px; background: #14223a; color: #dae6fa; }
.platform_1_2_0_11681bf2b051__brand__fBRvUh { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; margin-bottom: 48px; }
.platform_1_2_0_11681bf2b051__mark__KaLxFI { display: grid; place-items: center; width: 32px; height: 32px; background: #6387fa; border-radius: 9px; color: white; }
.platform_1_2_0_11681bf2b051__label__YZTpnq { color: #9fb1ce; font-size: 11px; letter-spacing: .1em; }
.platform_1_2_0_11681bf2b051__selected__gMitvG { margin-top: 12px; padding: 12px; background: #253b5c; border-radius: 8px; overflow-wrap: anywhere; }
.platform_1_2_0_11681bf2b051__note__Zm1U9i { margin-top: auto; padding-top: 32px; font-size: 12px; color: #aabbd5; }
.platform_1_2_0_11681bf2b051__workspace__vi3ooc { min-width: 0; }
.platform_1_2_0_11681bf2b051__header__WllTyK { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px 30px; background: white; border-bottom: 1px solid #dbe3ee; font-size: 14px; }
.platform_1_2_0_11681bf2b051__header__WllTyK strong { margin-left: 12px; }
.platform_1_2_0_11681bf2b051__tools__EKR0Bl { padding: 14px 30px; background: #eaf0fd; }
.platform_1_2_0_11681bf2b051__page__zmHzQ5 { box-sizing: border-box; width: 100%; max-width: 1120px; margin-inline: auto; padding: 32px; min-width: 0; color: inherit; }
.platform_1_2_0_11681bf2b051__wide__ruZzgz { max-width: 1480px; }
.platform_1_2_0_11681bf2b051__pageHeader__ynrCr8 { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
.platform_1_2_0_11681bf2b051__title__HrG3gs { margin: 0; font-size: clamp(24px, 3vw, 34px); line-height: 1.35; overflow-wrap: anywhere; }
.platform_1_2_0_11681bf2b051__description__uPLkwA { color: #54657d; margin: 10px 0 0; }
.platform_1_2_0_11681bf2b051__actions__GkelTS { display: flex; flex-wrap: wrap; gap: 8px; }
.platform_1_2_0_11681bf2b051__content__ghLruY { min-width: 0; }
.platform_1_2_0_11681bf2b051__skip__YNJAXq { position: absolute; left: 16px; top: -100px; padding: 10px; background: white; color: #1843a3; z-index: 10; }
.platform_1_2_0_11681bf2b051__skip__YNJAXq:focus { top: 12px; }
.platform_1_2_0_11681bf2b051__layout__cMFUHe[data-theme="dark"] { background: #15233a; color: #e4ecff; }
.platform_1_2_0_11681bf2b051__layout__cMFUHe[data-theme="dark"] .platform_1_2_0_11681bf2b051__header__WllTyK { background: #20324e; border-color: #385070; }
.platform_1_2_0_11681bf2b051__layout__cMFUHe[data-theme="dark"] .platform_1_2_0_11681bf2b051__tools__EKR0Bl { background: #253b5c; }
.platform_1_2_0_11681bf2b051__layout__cMFUHe[data-theme="dark"] .platform_1_2_0_11681bf2b051__description__uPLkwA { color: #b7c7e2; }
@media (max-width: 760px) { .platform_1_2_0_11681bf2b051__layout__cMFUHe { grid-template-columns: 1fr; } .platform_1_2_0_11681bf2b051__sidebar__wup9VK { padding: 15px 20px; } .platform_1_2_0_11681bf2b051__brand__fBRvUh { margin: 0; } .platform_1_2_0_11681bf2b051__label__YZTpnq, .platform_1_2_0_11681bf2b051__selected__gMitvG, .platform_1_2_0_11681bf2b051__note__Zm1U9i { display: none; } .platform_1_2_0_11681bf2b051__header__WllTyK, .platform_1_2_0_11681bf2b051__tools__EKR0Bl { padding: 14px 20px; } .platform_1_2_0_11681bf2b051__page__zmHzQ5 { padding: 24px 16px; } }
`, "",{"version":3,"sources":["webpack://./src/Layout.module.css"],"names":[],"mappings":"AAAA,+CAAU,aAAa,EAAE,2CAA2C,EAAE,iBAAiB,EAAE,mBAAmB,EAAE,cAAc,EAAE,4FAA4F,EAAE,gBAAgB,EAAE;AAC9O,+FAAqB,sBAAsB,EAAE;AAC7C,gDAAW,aAAa,EAAE,sBAAsB,EAAE,kBAAkB,EAAE,mBAAmB,EAAE,cAAc,EAAE;AAC3G,8CAAS,aAAa,EAAE,mBAAmB,EAAE,SAAS,EAAE,eAAe,EAAE,gBAAgB,EAAE,mBAAmB,EAAE;AAChH,6CAAQ,aAAa,EAAE,mBAAmB,EAAE,WAAW,EAAE,YAAY,EAAE,mBAAmB,EAAE,kBAAkB,EAAE,YAAY,EAAE;AAC9H,8CAAS,cAAc,EAAE,eAAe,EAAE,oBAAoB,EAAE;AAChE,iDAAY,gBAAgB,EAAE,aAAa,EAAE,mBAAmB,EAAE,kBAAkB,EAAE,uBAAuB,EAAE;AAC/G,6CAAQ,gBAAgB,EAAE,iBAAiB,EAAE,eAAe,EAAE,cAAc,EAAE;AAC9E,kDAAa,YAAY,EAAE;AAC3B,+CAAU,aAAa,EAAE,8BAA8B,EAAE,eAAe,EAAE,SAAS,EAAE,kBAAkB,EAAE,iBAAiB,EAAE,gCAAgC,EAAE,eAAe,EAAE;AAC/K,sDAAiB,iBAAiB,EAAE;AACpC,8CAAS,kBAAkB,EAAE,mBAAmB,EAAE;AAClD,6CAAQ,sBAAsB,EAAE,WAAW,EAAE,iBAAiB,EAAE,mBAAmB,EAAE,aAAa,EAAE,YAAY,EAAE,cAAc,EAAE;AAClI,6CAAQ,iBAAiB,EAAE;AAC3B,mDAAc,aAAa,EAAE,eAAe,EAAE,8BAA8B,EAAE,uBAAuB,EAAE,SAAS,EAAE,mBAAmB,EAAE;AACvI,8CAAS,SAAS,EAAE,iCAAiC,EAAE,iBAAiB,EAAE,uBAAuB,EAAE;AACnG,oDAAe,cAAc,EAAE,gBAAgB,EAAE;AACjD,gDAAW,aAAa,EAAE,eAAe,EAAE,QAAQ,EAAE;AACrD,gDAAW,YAAY,EAAE;AACzB,6CAAQ,kBAAkB,EAAE,UAAU,EAAE,WAAW,EAAE,aAAa,EAAE,iBAAiB,EAAE,cAAc,EAAE,WAAW,EAAE;AACpH,mDAAc,SAAS,EAAE;AACzB,kEAA6B,mBAAmB,EAAE,cAAc,EAAE;AAClE,+GAAqC,mBAAmB,EAAE,qBAAqB,EAAE;AACjF,8GAAoC,mBAAmB,EAAE;AACzD,oHAA0C,cAAc,EAAE;AAC1D,4BAA4B,+CAAU,0BAA0B,EAAE,EAAE,gDAAW,kBAAkB,EAAE,EAAE,8CAAS,SAAS,EAAE,EAAE,0IAA2B,aAAa,EAAE,EAAE,4FAAkB,kBAAkB,EAAE,EAAE,6CAAQ,kBAAkB,EAAE,EAAE","sourcesContent":[".layout { display: grid; grid-template-columns: 228px minmax(0, 1fr); min-height: 100vh; background: #f4f6fb; color: #18283f; font-family: -apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", system-ui, sans-serif; line-height: 1.6; }\n.layout *, .page * { box-sizing: border-box; }\n.sidebar { display: flex; flex-direction: column; padding: 28px 20px; background: #14223a; color: #dae6fa; }\n.brand { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; margin-bottom: 48px; }\n.mark { display: grid; place-items: center; width: 32px; height: 32px; background: #6387fa; border-radius: 9px; color: white; }\n.label { color: #9fb1ce; font-size: 11px; letter-spacing: .1em; }\n.selected { margin-top: 12px; padding: 12px; background: #253b5c; border-radius: 8px; overflow-wrap: anywhere; }\n.note { margin-top: auto; padding-top: 32px; font-size: 12px; color: #aabbd5; }\n.workspace { min-width: 0; }\n.header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px 30px; background: white; border-bottom: 1px solid #dbe3ee; font-size: 14px; }\n.header strong { margin-left: 12px; }\n.tools { padding: 14px 30px; background: #eaf0fd; }\n.page { box-sizing: border-box; width: 100%; max-width: 1120px; margin-inline: auto; padding: 32px; min-width: 0; color: inherit; }\n.wide { max-width: 1480px; }\n.pageHeader { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }\n.title { margin: 0; font-size: clamp(24px, 3vw, 34px); line-height: 1.35; overflow-wrap: anywhere; }\n.description { color: #54657d; margin: 10px 0 0; }\n.actions { display: flex; flex-wrap: wrap; gap: 8px; }\n.content { min-width: 0; }\n.skip { position: absolute; left: 16px; top: -100px; padding: 10px; background: white; color: #1843a3; z-index: 10; }\n.skip:focus { top: 12px; }\n.layout[data-theme=\"dark\"] { background: #15233a; color: #e4ecff; }\n.layout[data-theme=\"dark\"] .header { background: #20324e; border-color: #385070; }\n.layout[data-theme=\"dark\"] .tools { background: #253b5c; }\n.layout[data-theme=\"dark\"] .description { color: #b7c7e2; }\n@media (max-width: 760px) { .layout { grid-template-columns: 1fr; } .sidebar { padding: 15px 20px; } .brand { margin: 0; } .label, .selected, .note { display: none; } .header, .tools { padding: 14px 20px; } .page { padding: 24px 16px; } }\n"],"sourceRoot":""}]);
// Exports
___CSS_LOADER_EXPORT___.locals = {
	"layout": `platform_1_2_0_11681bf2b051__layout__cMFUHe`,
	"page": `platform_1_2_0_11681bf2b051__page__zmHzQ5`,
	"sidebar": `platform_1_2_0_11681bf2b051__sidebar__wup9VK`,
	"brand": `platform_1_2_0_11681bf2b051__brand__fBRvUh`,
	"mark": `platform_1_2_0_11681bf2b051__mark__KaLxFI`,
	"label": `platform_1_2_0_11681bf2b051__label__YZTpnq`,
	"selected": `platform_1_2_0_11681bf2b051__selected__gMitvG`,
	"note": `platform_1_2_0_11681bf2b051__note__Zm1U9i`,
	"workspace": `platform_1_2_0_11681bf2b051__workspace__vi3ooc`,
	"header": `platform_1_2_0_11681bf2b051__header__WllTyK`,
	"tools": `platform_1_2_0_11681bf2b051__tools__EKR0Bl`,
	"wide": `platform_1_2_0_11681bf2b051__wide__ruZzgz`,
	"pageHeader": `platform_1_2_0_11681bf2b051__pageHeader__ynrCr8`,
	"title": `platform_1_2_0_11681bf2b051__title__HrG3gs`,
	"description": `platform_1_2_0_11681bf2b051__description__uPLkwA`,
	"actions": `platform_1_2_0_11681bf2b051__actions__GkelTS`,
	"content": `platform_1_2_0_11681bf2b051__content__ghLruY`,
	"skip": `platform_1_2_0_11681bf2b051__skip__YNJAXq`
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
//# sourceMappingURL=src_sdk_jsx.417d6a946906e3a74913.js.map