"use strict";
(self["webpackChunkshell_1_0_0_d2100e305573"] = self["webpackChunkshell_1_0_0_d2100e305573"] || []).push([["src_bootstrap_jsx"],{

/***/ "./src/bootstrap.jsx"
/*!***************************!*\
  !*** ./src/bootstrap.jsx ***!
  \***************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom/client */ "webpack/sharing/consume/default/react-dom/client/react-dom/client");
/* harmony import */ var platform_sdk__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! platform/sdk */ "webpack/container/remote/platform/sdk");
/* harmony import */ var platform_sdk__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(platform_sdk__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _loader__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./loader */ "./src/loader.js");
/* harmony import */ var _shell_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./shell.css */ "./src/shell.css");





const runtime = globalThis.__MFE_RUNTIME__;
const registry = runtime.registry;
const identityRecords = new Map();
const loadedArtifacts = new Set([registry.artifacts.platform.id]);
const mountOrder = [];
const recordMount = id => mountOrder.push(id);
const describeChain = role => {
  const app = registry.applications[role];
  const b = registry.artifacts[registry.runtimeBindings[app.id]?.b || app.dependencies.b];
  const d = registry.artifacts[registry.runtimeBindings[b.id]?.d || b.dependencies.d];
  return `${role} → B ${b.version} → D ${d.version}`;
};
window.__MFE_PROOF__ = {
  registry,
  compositionId: registry.compositionId,
  platformArtifactId: registry.artifacts.platform.id,
  getRuntimeDiagnostics: runtime.getDiagnostics,
  getSnapshot: platform_sdk__WEBPACK_IMPORTED_MODULE_2__.getRuntimeSnapshot,
  mountOrder,
  get loadedArtifacts() {
    return [...loadedArtifacts];
  },
  identities() {
    const activeIds = new Set((0,platform_sdk__WEBPACK_IMPORTED_MODULE_2__.getRuntimeSnapshot)().activeInstances.map(scope => scope.instanceId));
    return [...identityRecords].filter(([id]) => activeIds.has(id)).map(([instanceId, identity]) => ({
      instanceId,
      reactMatches: identity.react === (react__WEBPACK_IMPORTED_MODULE_0___default()) && identity.consumerReact === (react__WEBPACK_IMPORTED_MODULE_0___default()) && platform_sdk__WEBPACK_IMPORTED_MODULE_2__.ReactIdentity === (react__WEBPACK_IMPORTED_MODULE_0___default()),
      contextMatches: identity.context === platform_sdk__WEBPACK_IMPORTED_MODULE_2__.PlatformContext,
      artifactId: identity.artifactId,
      dependencyArtifact: identity.dependencyArtifact
    }));
  }
};
class WidgetErrorBoundary extends (react__WEBPACK_IMPORTED_MODULE_0___default().Component) {
  state = {
    error: null
  };
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  render() {
    return this.state.error ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      role: "alert",
      className: "error"
    }, this.state.error.message) : this.props.children;
  }
}
function App() {
  const platform = (0,platform_sdk__WEBPACK_IMPORTED_MODULE_2__.usePlatform)();
  const [widgets, setWidgets] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [pending, setPending] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [errors, setErrors] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({});
  const [eventNotifications, setEventNotifications] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  async function add(id) {
    const appId = id.startsWith('A') ? 'A' : 'C';
    const artifact = registry.applications[appId];
    setPending(true);
    setErrors(current => {
      const next = {
        ...current
      };
      delete next[id];
      return next;
    });
    try {
      const module = await (0,_loader__WEBPACK_IMPORTED_MODULE_3__.loadRemote)(artifact, './Widget');
      const identity = module.getIdentity();
      identityRecords.set(id, identity);
      for (const item of [artifact.id, identity.artifactId, identity.dependencyArtifact]) loadedArtifacts.add(item);
      setWidgets(current => current.some(widget => widget.id === id) ? current : [...current, {
        id,
        Component: module.default
      }]);
      // Wait for a committed mount, not just a resolved import, before loading the next app.
      await new Promise((resolve, reject) => {
        const deadline = Date.now() + 5000;
        const check = () => {
          if ((0,platform_sdk__WEBPACK_IMPORTED_MODULE_2__.getRuntimeSnapshot)().activeInstances.some(scope => scope.instanceId === id)) return resolve();
          if (Date.now() > deadline) return reject(new Error(`${id}: widget did not mount`));
          requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      });
    } catch (cause) {
      setErrors(current => ({
        ...current,
        [id]: cause.message
      }));
      console.error(cause);
    } finally {
      setPending(false);
    }
  }
  ;(0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('empty') === '1') return;
    const order = params.get('order') === 'ca' ? ['C', 'A'] : ['A', 'C'];
    (async () => {
      for (const id of order) await add(id);
    })();
  }, []);
  const has = id => widgets.some(widget => widget.id === id);
  const remove = id => setWidgets(current => current.filter(widget => widget.id !== id));
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "shell"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("aside", {
    className: "sidebar"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "brand"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "brandIcon"
  }, "M"), " Platform Lab"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "navLabel"
  }, "WORKSPACE"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "navItem active"
  }, "\u25EB ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uBC84\uC804 \uACF5\uC874 \uAC80\uC99D")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "navItem"
  }, "\u25A4 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC11C\uBE44\uC2A4 \uB4F1\uB85D\uBD80")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "sidebarFoot"
  }, "PLATFORM ", platform.platformVersion, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uACF5\uD1B5 React \xB7 \uACF5\uD1B5 SDK"))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "workspace"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("header", {
    className: "header"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uAC80\uC99D \uD658\uACBD ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "headerSlash"
  }, "/"), " Module Federation"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "user"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "avatar"
  }, platform.user.name.slice(0, 1)), " ", platform.user.name)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("main", {
    className: "main"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "pageEyebrow"
  }, "EXECUTABLE PROOF"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", null, "\uB2E4\uB978 \uBC84\uC804, \uD558\uB098\uC758 \uD50C\uB7AB\uD3FC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "intro"
  }, describeChain('A'), "\uACFC ", describeChain('C'), "\uC744 \uC2E4\uC81C \uC6D0\uACA9 \uBC88\uB4E4\uB85C \uBD88\uB7EC\uC635\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "statusStrip"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("i", null), " \uD50C\uB7AB\uD3FC SDK ", platform.platformVersion), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "8\uAC1C \uB3C5\uB9BD \uD504\uB85C\uC81D\uD2B8"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uACF5\uD1B5 React \uC778\uC2A4\uD134\uC2A4")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "toolbar"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "toolbarGroup"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "add-a",
    disabled: pending || has('A'),
    onClick: () => add('A')
  }, "A \uBD88\uB7EC\uC624\uAE30"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "add-c",
    disabled: pending || has('C'),
    onClick: () => add('C')
  }, "C \uBD88\uB7EC\uC624\uAE30"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "add-a-copy",
    disabled: pending || has('A-copy'),
    onClick: () => add('A-copy')
  }, "A \uC704\uC82F \uBCF5\uC81C")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "emit-event",
    onClick: () => setEventNotifications((0,platform_sdk__WEBPACK_IMPORTED_MODULE_2__.emitDemoEvent)())
  }, "\uACF5\uD1B5 \uC774\uBCA4\uD2B8 \uBCF4\uB0B4\uAE30")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "smallStatus"
  }, "\uB9C8\uC6B4\uD2B8\uB41C \uC704\uC82F ", widgets.length, "\uAC1C \xB7 \uB9C8\uC9C0\uB9C9 \uC774\uBCA4\uD2B8 \uC218\uC2E0 ", eventNotifications, "\uAC1C ", pending && '· 불러오는 중…'), Object.entries(errors).map(([id, message]) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    key: id,
    role: "alert",
    className: "error"
  }, id, ": ", message)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "widgetGrid",
    "aria-label": "\uC11C\uBE44\uC2A4 \uC704\uC82F"
  }, widgets.map(({
    id,
    Component
  }) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    key: id,
    className: "widgetSlot"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "slotHead"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, id === 'C' ? '정비 서비스' : 'OTA 서비스', " / ", id), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": `remove-${id.toLowerCase()}`,
    onClick: () => remove(id)
  }, "\uC81C\uAC70 \xD7")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(WidgetErrorBoundary, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Component, {
    instanceId: id,
    onMounted: recordMount
  }))))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "explanation"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, "\uC9C1\uC811 \uD655\uC778\uD558\uAE30"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uD55C\uCABD \uCE74\uC6B4\uD130\uC640 \uBA54\uBAA8\uB9CC \uBCC0\uACBD\uD574 \uBCF4\uC138\uC694. \uB2E4\uB978 \uC704\uC82F\uC758 \uC0C1\uD0DC\uC640 \uC0C9\uC0C1\uC740 \uADF8\uB300\uB85C \uC720\uC9C0\uB429\uB2C8\uB2E4. \uD31D\uC5C5\uC744 \uC5F0 \uCC44 \uC704\uC82F\uC744 \uC81C\uAC70\uD558\uAC70\uB098, \uAC19\uC740 \uBC84\uC804\uC758 A \uC704\uC82F\uC744 \uBCF5\uC81C\uD574\uB3C4 \uAC01 \uC778\uC2A4\uD134\uC2A4\uAC00 \uBD84\uB9AC\uB429\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: globalThis.__MFE_BOOT_URL__ || '/registry.json',
    target: "_blank",
    rel: "noreferrer"
  }, "\uC774 \uD398\uC774\uC9C0\uC758 \uBC30\uD3EC \uAD6C\uC131 \uBCF4\uAE30 \u2197")))));
}
;(0,react_dom_client__WEBPACK_IMPORTED_MODULE_1__.createRoot)(document.getElementById('root')).render(/*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(platform_sdk__WEBPACK_IMPORTED_MODULE_2__.PlatformProvider, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(App, null)));

/***/ },

/***/ "./src/loader.js"
/*!***********************!*\
  !*** ./src/loader.js ***!
  \***********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadRemote: () => (/* binding */ loadRemote)
/* harmony export */ });
const modules = new Map();
function loadRemote(artifact, exposedModule) {
  const key = `${artifact.id}:${exposedModule}`;
  if (!modules.has(key)) {
    const pending = (async () => {
      await __webpack_require__.I('default');
      const container = await globalThis.__MFE_RUNTIME__.getArtifactContainer(artifact);
      await container.init(__webpack_require__.S.default);
      const factory = await container.get(exposedModule);
      return factory();
    })();
    modules.set(key, pending);
    pending.catch(() => {
      if (modules.get(key) === pending) modules.delete(key);
    });
  }
  return modules.get(key);
}

/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js!./src/shell.css"
/*!*************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/shell.css ***!
  \*************************************************************/
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
___CSS_LOADER_EXPORT___.push([module.id, `html { color-scheme: light; }
body { margin: 0; background: #f8fafc; }
.shell { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #243146; font-size: 14px; display: flex; min-height: 100vh; }
.sidebar { width: 218px; flex-shrink: 0; background: #111d30; color: #becade; position: fixed; inset: 0 auto 0 0; display: flex; flex-direction: column; padding: 25px 18px; box-sizing: border-box; }
.brand { color: #fff; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px; margin-bottom: 50px; }
.brandIcon { display: grid; place-items: center; width: 29px; height: 29px; border-radius: 8px; background: #4258d6; }
.navLabel { color: #7c8ca5; font-size: 10px; font-weight: 700; letter-spacing: .13em; margin: 0 12px 15px; }
.navItem { display: flex; gap: 12px; padding: 13px 12px; border-radius: 7px; margin-bottom: 6px; font-size: 12px; }
.navItem.active { color: #fff; background: #24344e; }
.sidebarFoot { margin-top: auto; padding: 12px; font-size: 10px; letter-spacing: .08em; line-height: 2; color: #a4b1c7; }
.sidebarFoot span { letter-spacing: 0; color: #71829c; }
.workspace { flex: 1; margin-left: 218px; min-width: 0; }
.header { height: 68px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; background: white; border-bottom: 1px solid #e7ecf2; color: #637287; font-size: 12px; }
.headerSlash { margin: 0 12px; color: #c6cfdb; }
.user { display: flex; align-items: center; gap: 8px; }
.avatar { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 50%; background: #e9edf9; color: #4c5c90; font-size: 11px; }
.main { max-width: 1180px; padding: 42px 40px; margin: auto; }
.pageEyebrow { color: #6879a1; font-size: 10px; letter-spacing: .16em; font-weight: 700; }
.main h1 { font-size: 30px; letter-spacing: -.035em; margin: 10px 0; }
.intro { color: #748094; font-size: 13px; line-height: 1.8; }
.statusStrip { display: flex; flex-wrap: wrap; gap: 22px; padding: 16px 0 23px; margin-bottom: 24px; border-bottom: 1px solid #e1e7ef; font-size: 11px; color: #64748b; }
.statusStrip i { display: inline-block; width: 6px; height: 6px; background: #059669; border-radius: 50%; margin-right: 7px; }
.toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; }
.toolbarGroup { display: flex; flex-wrap: wrap; gap: 7px; }
.toolbar button { border: 1px solid #d6deea; border-radius: 6px; background: white; color: #41516a; padding: 9px 12px; font: inherit; font-size: 11px; cursor: pointer; }
.toolbar button:disabled { opacity: .4; cursor: default; }
.smallStatus { margin: 12px 0 26px; font-size: 11px; color: #8691a3; }
.widgetGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; align-items: start; }
.widgetSlot { min-width: 0; }
.slotHead { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 600; color: #64748b; padding: 0 4px 12px; }
.slotHead button { border: 0; background: transparent; color: #8491a3; font: inherit; cursor: pointer; }
.explanation { margin-top: 34px; padding: 20px 24px; background: #f0f3f8; border-radius: 10px; color: #63738a; font-size: 12px; line-height: 1.8; }
.explanation strong { color: #465775; }
.explanation p { margin: 6px 0 8px; }
.explanation a { color: #435baa; text-decoration: none; font-size: 11px; }
.error { background: #fef2f2; color: #991b1b; padding: 20px; border-radius: 8px; }
@media (max-width: 900px) { .sidebar { width: 170px; } .workspace { margin-left: 170px; } .main { padding: 26px 22px; } .header { padding: 0 22px; } .widgetGrid { grid-template-columns: 1fr; } }
@media (max-width: 600px) {
  .shell { flex-direction: column; }
  .sidebar { position: static; width: 100%; padding: 14px 18px; }
  .brand { margin-bottom: 12px; }
  .navLabel, .sidebarFoot { display: none; }
  .sidebar nav { display: flex; flex-wrap: wrap; gap: 6px; max-height: 220px; overflow-y: auto; }
  .navItem { margin: 0; padding: 10px 12px; }
  .workspace { margin-left: 0; }
  .main h1 { font-size: 25px; }
}

.navItem { text-decoration: none; color: inherit; overflow-wrap: anywhere; }
.sidebar { overflow-y: auto; }
[hidden] { display: none !important; }

.dashboardHeading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }
.dashboardHeading a { color: #435baa; }
.dashboardGrid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 24px; align-items: start; }
.dashboardTile { min-width: 0; }
.dashboardTileTitle { font-size: 15px; line-height: 1.5; margin: 0 0 12px; overflow-wrap: anywhere; }
.dashboardSpan2 { grid-column: span 2; }
.dashboardEmpty { padding: 40px 24px; border: 1px dashed #bac6d8; border-radius: 12px; color: #637287; background: white; }
@media(max-width:900px) { .dashboardGrid { grid-template-columns: minmax(0,1fr); } .dashboardSpan2 { grid-column: span 1; } }
`, "",{"version":3,"sources":["webpack://./src/shell.css"],"names":[],"mappings":"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","sourcesContent":["html { color-scheme: light; }\nbody { margin: 0; background: #f8fafc; }\n.shell { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; color: #243146; font-size: 14px; display: flex; min-height: 100vh; }\n.sidebar { width: 218px; flex-shrink: 0; background: #111d30; color: #becade; position: fixed; inset: 0 auto 0 0; display: flex; flex-direction: column; padding: 25px 18px; box-sizing: border-box; }\n.brand { color: #fff; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px; margin-bottom: 50px; }\n.brandIcon { display: grid; place-items: center; width: 29px; height: 29px; border-radius: 8px; background: #4258d6; }\n.navLabel { color: #7c8ca5; font-size: 10px; font-weight: 700; letter-spacing: .13em; margin: 0 12px 15px; }\n.navItem { display: flex; gap: 12px; padding: 13px 12px; border-radius: 7px; margin-bottom: 6px; font-size: 12px; }\n.navItem.active { color: #fff; background: #24344e; }\n.sidebarFoot { margin-top: auto; padding: 12px; font-size: 10px; letter-spacing: .08em; line-height: 2; color: #a4b1c7; }\n.sidebarFoot span { letter-spacing: 0; color: #71829c; }\n.workspace { flex: 1; margin-left: 218px; min-width: 0; }\n.header { height: 68px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; background: white; border-bottom: 1px solid #e7ecf2; color: #637287; font-size: 12px; }\n.headerSlash { margin: 0 12px; color: #c6cfdb; }\n.user { display: flex; align-items: center; gap: 8px; }\n.avatar { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 50%; background: #e9edf9; color: #4c5c90; font-size: 11px; }\n.main { max-width: 1180px; padding: 42px 40px; margin: auto; }\n.pageEyebrow { color: #6879a1; font-size: 10px; letter-spacing: .16em; font-weight: 700; }\n.main h1 { font-size: 30px; letter-spacing: -.035em; margin: 10px 0; }\n.intro { color: #748094; font-size: 13px; line-height: 1.8; }\n.statusStrip { display: flex; flex-wrap: wrap; gap: 22px; padding: 16px 0 23px; margin-bottom: 24px; border-bottom: 1px solid #e1e7ef; font-size: 11px; color: #64748b; }\n.statusStrip i { display: inline-block; width: 6px; height: 6px; background: #059669; border-radius: 50%; margin-right: 7px; }\n.toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; }\n.toolbarGroup { display: flex; flex-wrap: wrap; gap: 7px; }\n.toolbar button { border: 1px solid #d6deea; border-radius: 6px; background: white; color: #41516a; padding: 9px 12px; font: inherit; font-size: 11px; cursor: pointer; }\n.toolbar button:disabled { opacity: .4; cursor: default; }\n.smallStatus { margin: 12px 0 26px; font-size: 11px; color: #8691a3; }\n.widgetGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; align-items: start; }\n.widgetSlot { min-width: 0; }\n.slotHead { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 600; color: #64748b; padding: 0 4px 12px; }\n.slotHead button { border: 0; background: transparent; color: #8491a3; font: inherit; cursor: pointer; }\n.explanation { margin-top: 34px; padding: 20px 24px; background: #f0f3f8; border-radius: 10px; color: #63738a; font-size: 12px; line-height: 1.8; }\n.explanation strong { color: #465775; }\n.explanation p { margin: 6px 0 8px; }\n.explanation a { color: #435baa; text-decoration: none; font-size: 11px; }\n.error { background: #fef2f2; color: #991b1b; padding: 20px; border-radius: 8px; }\n@media (max-width: 900px) { .sidebar { width: 170px; } .workspace { margin-left: 170px; } .main { padding: 26px 22px; } .header { padding: 0 22px; } .widgetGrid { grid-template-columns: 1fr; } }\n@media (max-width: 600px) {\n  .shell { flex-direction: column; }\n  .sidebar { position: static; width: 100%; padding: 14px 18px; }\n  .brand { margin-bottom: 12px; }\n  .navLabel, .sidebarFoot { display: none; }\n  .sidebar nav { display: flex; flex-wrap: wrap; gap: 6px; max-height: 220px; overflow-y: auto; }\n  .navItem { margin: 0; padding: 10px 12px; }\n  .workspace { margin-left: 0; }\n  .main h1 { font-size: 25px; }\n}\n\n.navItem { text-decoration: none; color: inherit; overflow-wrap: anywhere; }\n.sidebar { overflow-y: auto; }\n[hidden] { display: none !important; }\n\n.dashboardHeading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }\n.dashboardHeading a { color: #435baa; }\n.dashboardGrid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 24px; align-items: start; }\n.dashboardTile { min-width: 0; }\n.dashboardTileTitle { font-size: 15px; line-height: 1.5; margin: 0 0 12px; overflow-wrap: anywhere; }\n.dashboardSpan2 { grid-column: span 2; }\n.dashboardEmpty { padding: 40px 24px; border: 1px dashed #bac6d8; border-radius: 12px; color: #637287; background: white; }\n@media(max-width:900px) { .dashboardGrid { grid-template-columns: minmax(0,1fr); } .dashboardSpan2 { grid-column: span 1; } }\n"],"sourceRoot":""}]);
// Exports
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

/***/ "./src/shell.css"
/*!***********************!*\
  !*** ./src/shell.css ***!
  \***********************/
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
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_shell_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./shell.css */ "./node_modules/css-loader/dist/cjs.js!./src/shell.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_shell_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_shell_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_shell_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_shell_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


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
//# sourceMappingURL=src_bootstrap_jsx.ce3145d8cc52d2b86482.js.map