"use strict";
(self["webpackChunka_1_1_0_56bda02b1a0f"] = self["webpackChunka_1_1_0_56bda02b1a0f"] || []).push([["src_index_jsx"],{

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
  }, label, " \uC601\uC5ED\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.");
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

/***/ "./src/index.jsx"
/*!***********************!*\
  !*** ./src/index.jsx ***!
  \***********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ConsumerWidget),
/* harmony export */   getIdentity: () => (/* binding */ getIdentity)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var b_Widget__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! b/Widget */ "webpack/container/remote/b/Widget");
/* harmony import */ var b_Widget__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(b_Widget__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _RemoteRegion__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./RemoteRegion */ "./src/RemoteRegion.jsx");
/* harmony import */ var _Nested_module_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Nested.module.css */ "./src/Nested.module.css");




function getIdentity() {
  return {
    ...(0,b_Widget__WEBPACK_IMPORTED_MODULE_1__.getIdentity)(),
    consumerArtifact: "a_1_1_0_56bda02b1a0f",
    consumerVersion: "1.1.0",
    consumerReact: (react__WEBPACK_IMPORTED_MODULE_0___default()),
    remoteRegion: _RemoteRegion__WEBPACK_IMPORTED_MODULE_2__["default"]
  };
}
function ConsumerWidget({
  instanceId,
  onMounted
}) {
  const [showC, setShowC] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  const direct = (0,b_Widget__WEBPACK_IMPORTED_MODULE_1__.getIdentity)();
  // A's direct B and the B inside C are separate mounted instances.
  // Dependency versions are resolved by consumer artifact, not by this UI ID.
  const childId = `${instanceId}--c`;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: _Nested_module_css__WEBPACK_IMPORTED_MODULE_3__["default"].group,
    "data-testid": `nested-${instanceId}`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Nested_module_css__WEBPACK_IMPORTED_MODULE_3__["default"].heading
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, "A\uC758 \uC9C1\uC811\xB7\uAC04\uC811 B \uC0AC\uC6A9"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "A\uC758 B ", direct.version, "\uC640 C \uC11C\uBE44\uC2A4"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    "data-testid": `toggle-c-${instanceId}`,
    "aria-expanded": showC,
    "aria-controls": `nested-c-${instanceId}`,
    onClick: () => setShowC(value => !value)
  }, showC ? 'A 안의 C 제거' : 'A 안의 C 다시 표시')), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((b_Widget__WEBPACK_IMPORTED_MODULE_1___default()), {
    instanceId: instanceId,
    onMounted: onMounted
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    id: `nested-c-${instanceId}`
  }, showC && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_RemoteRegion__WEBPACK_IMPORTED_MODULE_2__["default"], {
    consumerId: "a_1_1_0_56bda02b1a0f",
    alias: "c",
    exposedModule: "./Widget",
    instanceId: childId,
    label: "C",
    componentProps: {
      instanceId: childId,
      onMounted
    }
  })));
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
function getRemoteRecoveryLog() {
  return recoveryLog.map(entry => ({
    ...entry,
    removed: [...entry.removed],
    prepared: [...entry.prepared]
  }));
}
async function resetFailedBranch(runtime, artifact, scope, context, visited = new Set()) {
  if (visited.has(artifact.id) || artifact.service === 'platform') return;
  visited.add(artifact.id);
  const registry = runtime.registry;
  const children = [...Object.values(artifact.dependencies || {}), ...Object.values(registry.runtimeBindings[artifact.id] || {})];
  for (const id of children) await resetFailedBranch(runtime, registry.artifacts[id], scope, context, visited);
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
    await container.get(request);
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
    const pending = (async () => {
      // The caller's ID must be supplied by the service. This SDK's build ID
      // is not the consumer of the requested remote.
      await __webpack_require__.I('default');
      const container = await runtime.getDependencyContainer(consumerId, alias);
      await container.init(__webpack_require__.S.default);
      if (retry) {
        const target = runtime.registry.artifacts[runtime.registry.runtimeBindings[consumerId][alias]];
        if (!retryProtocols.has(target.retryProtocol)) throw new Error('This remote build does not support local retry');
        await resetFailedBranch(runtime, target, __webpack_require__.S.default, {
          consumerId,
          alias,
          exposedModule
        });
      }
      const factory = await container.get(exposedModule);
      const module = factory();
      if (!module.default) throw new Error(`Missing default component: ${alias}/${exposedModule}`);
      return module;
    })();
    modules.set(key, pending);
    pending.catch(() => {
      if (modules.get(key) === pending) modules.delete(key);
    });
  }
  return modules.get(key);
}

/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[2].use[1]!./src/Nested.module.css"
/*!*************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[2].use[1]!./src/Nested.module.css ***!
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
___CSS_LOADER_EXPORT___.push([module.id, `.a_1_1_0_56bda02b1a0f__group__JWLEbp { display: grid; gap: 16px; min-width: 0; }
.a_1_1_0_56bda02b1a0f__heading__FjWFwD { border: 1px solid #ccd6e4; border-radius: 12px; padding: 16px; background: #f3f6fc; color: #18243b; }
.a_1_1_0_56bda02b1a0f__heading__FjWFwD p { margin: 8px 0 12px; font-size: 14px; overflow-wrap: anywhere; }
.a_1_1_0_56bda02b1a0f__heading__FjWFwD button { padding: 9px 12px; border: 1px solid #8293ac; background: white; color: #18243b; border-radius: 7px; cursor: pointer; }
.a_1_1_0_56bda02b1a0f__heading__FjWFwD button:focus-visible { outline: 3px solid #3454dc; outline-offset: 3px; }
`, "",{"version":3,"sources":["webpack://./src/Nested.module.css"],"names":[],"mappings":"AAAA,uCAAS,aAAa,EAAE,SAAS,EAAE,YAAY,EAAE;AACjD,yCAAW,yBAAyB,EAAE,mBAAmB,EAAE,aAAa,EAAE,mBAAmB,EAAE,cAAc,EAAE;AAC/G,2CAAa,kBAAkB,EAAE,eAAe,EAAE,uBAAuB,EAAE;AAC3E,gDAAkB,iBAAiB,EAAE,yBAAyB,EAAE,iBAAiB,EAAE,cAAc,EAAE,kBAAkB,EAAE,eAAe,EAAE;AACxI,8DAAgC,0BAA0B,EAAE,mBAAmB,EAAE","sourcesContent":[".group { display: grid; gap: 16px; min-width: 0; }\n.heading { border: 1px solid #ccd6e4; border-radius: 12px; padding: 16px; background: #f3f6fc; color: #18243b; }\n.heading p { margin: 8px 0 12px; font-size: 14px; overflow-wrap: anywhere; }\n.heading button { padding: 9px 12px; border: 1px solid #8293ac; background: white; color: #18243b; border-radius: 7px; cursor: pointer; }\n.heading button:focus-visible { outline: 3px solid #3454dc; outline-offset: 3px; }\n"],"sourceRoot":""}]);
// Exports
___CSS_LOADER_EXPORT___.locals = {
	"group": `a_1_1_0_56bda02b1a0f__group__JWLEbp`,
	"heading": `a_1_1_0_56bda02b1a0f__heading__FjWFwD`
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[2].use[1]!./src/RemoteRegion.module.css"
/*!*******************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[2].use[1]!./src/RemoteRegion.module.css ***!
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
___CSS_LOADER_EXPORT___.push([module.id, `.a_1_1_0_56bda02b1a0f__loading__sJqa_j, .a_1_1_0_56bda02b1a0f__unavailable__A_v9yY { padding: 18px; border-radius: 12px; border: 1px solid #ccd6e4; background: white; color: #33445c; }
.a_1_1_0_56bda02b1a0f__unavailable__A_v9yY { border-color: #d4b086; background: #fff8ee; color: #6b451e; }
.a_1_1_0_56bda02b1a0f__unavailable__A_v9yY p { margin: 8px 0 0; }
.a_1_1_0_56bda02b1a0f__unavailable__A_v9yY button { margin-top: 12px; padding: 9px 12px; border: 1px solid #996a34; border-radius: 7px; background: white; color: #6b451e; cursor: pointer; }
.a_1_1_0_56bda02b1a0f__unavailable__A_v9yY button:focus-visible { outline: 3px solid #3454dc; outline-offset: 3px; }
`, "",{"version":3,"sources":["webpack://./src/RemoteRegion.module.css"],"names":[],"mappings":"AAAA,qFAAyB,aAAa,EAAE,mBAAmB,EAAE,yBAAyB,EAAE,iBAAiB,EAAE,cAAc,EAAE;AAC3H,6CAAe,qBAAqB,EAAE,mBAAmB,EAAE,cAAc,EAAE;AAC3E,+CAAiB,eAAe,EAAE;AAClC,oDAAsB,gBAAgB,EAAE,iBAAiB,EAAE,yBAAyB,EAAE,kBAAkB,EAAE,iBAAiB,EAAE,cAAc,EAAE,eAAe,EAAE;AAC9J,kEAAoC,0BAA0B,EAAE,mBAAmB,EAAE","sourcesContent":[".loading, .unavailable { padding: 18px; border-radius: 12px; border: 1px solid #ccd6e4; background: white; color: #33445c; }\n.unavailable { border-color: #d4b086; background: #fff8ee; color: #6b451e; }\n.unavailable p { margin: 8px 0 0; }\n.unavailable button { margin-top: 12px; padding: 9px 12px; border: 1px solid #996a34; border-radius: 7px; background: white; color: #6b451e; cursor: pointer; }\n.unavailable button:focus-visible { outline: 3px solid #3454dc; outline-offset: 3px; }\n"],"sourceRoot":""}]);
// Exports
___CSS_LOADER_EXPORT___.locals = {
	"loading": `a_1_1_0_56bda02b1a0f__loading__sJqa_j`,
	"unavailable": `a_1_1_0_56bda02b1a0f__unavailable__A_v9yY`
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

/***/ "./src/Nested.module.css"
/*!*******************************!*\
  !*** ./src/Nested.module.css ***!
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
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_Nested_module_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[2].use[1]!./Nested.module.css */ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[2].use[1]!./src/Nested.module.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_Nested_module_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_Nested_module_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_Nested_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_Nested_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


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
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[2].use[1]!./RemoteRegion.module.css */ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[2].use[1]!./src/RemoteRegion.module.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_2_use_1_RemoteRegion_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


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
//# sourceMappingURL=src_index_jsx.5a64b5b142b22ddaa9e4.js.map