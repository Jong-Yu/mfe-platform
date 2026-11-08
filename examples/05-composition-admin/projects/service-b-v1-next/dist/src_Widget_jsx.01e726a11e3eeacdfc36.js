"use strict";
(self["webpackChunkb_1_5_0_c31af82fe4c3"] = self["webpackChunkb_1_5_0_c31af82fe4c3"] || []).push([["src_Widget_jsx"],{

/***/ "./src/Widget.jsx"
/*!************************!*\
  !*** ./src/Widget.jsx ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Widget),
/* harmony export */   getIdentity: () => (/* binding */ getIdentity)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom */ "webpack/sharing/consume/default/react-dom/react-dom");
/* harmony import */ var platform_sdk__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! platform/sdk */ "webpack/container/remote/platform/sdk");
/* harmony import */ var platform_sdk__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(platform_sdk__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var d_data__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! d/data */ "webpack/container/remote/d/data");
/* harmony import */ var d_data__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(d_data__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Widget.module.css */ "./src/Widget.module.css");





function getIdentity() {
  return {
    react: (react__WEBPACK_IMPORTED_MODULE_0___default()),
    context: platform_sdk__WEBPACK_IMPORTED_MODULE_2__.PlatformContext,
    artifactId: "b_1_5_0_c31af82fe4c3",
    version: "1.5.0",
    dependencyArtifact: d_data__WEBPACK_IMPORTED_MODULE_3__.artifactId,
    dependencyVersion: d_data__WEBPACK_IMPORTED_MODULE_3__.version
  };
}
function Content({
  onMounted
}) {
  const platform = (0,platform_sdk__WEBPACK_IMPORTED_MODULE_2__.usePlatform)();
  const scope = (0,platform_sdk__WEBPACK_IMPORTED_MODULE_2__.useWidgetScope)();
  const [input, setInput] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [cached, setCached] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [popup, setPopup] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => scope.subscribe(() => {}), [scope.subscribe]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    onMounted?.(scope.instanceId);
  }, [onMounted, scope.instanceId]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("article", {
    "data-testid": `widget-${scope.instanceId}`,
    "data-css-role": "panel",
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].panel
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].eyebrow
  }, scope.instanceId, " \uC11C\uBE44\uC2A4\uAC00 \uC0AC\uC6A9\uD558\uB294 \uC704\uC82F"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].titleRow
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", null, "Car Picker"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    "data-testid": "version",
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].badge
  }, "1.5.0")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].description
  }, "\uB3C5\uB9BD \uD504\uB85C\uC81D\uD2B8\uC5D0\uC11C \uBE4C\uB4DC\uD55C B. \uC0C1\uD0DC\uC640 \uC2A4\uD0C0\uC77C\uC740 \uC774 \uC778\uC2A4\uD134\uC2A4\uC5D0\uB9CC \uC801\uC6A9\uB429\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].facts
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uAC04\uC811 \uC758\uC874\uC131 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", {
    "data-testid": "dependency"
  }, (0,d_data__WEBPACK_IMPORTED_MODULE_3__.describe)())), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uACF5\uD1B5 \uC0AC\uC6A9\uC790 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", {
    "data-testid": "platform-user"
  }, platform.user.name)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uD50C\uB7AB\uD3FC ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", {
    "data-testid": "platform-version"
  }, platform.platformVersion))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].counterRow
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].label
  }, "\uB3C5\uB9BD \uCE74\uC6B4\uD130"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", {
    "data-testid": "count",
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].count
  }, scope.count)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "increment",
    "data-css-role": "button",
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].button,
    onClick: () => scope.setCount(value => value + 1)
  }, "\uCE74\uC6B4\uD130 +1")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].label,
    htmlFor: `vehicle-${scope.instanceId}`
  }, "\uCC28\uB7C9 \uBA54\uBAA8 \xB7 \uC778\uC2A4\uD134\uC2A4 \uC804\uC6A9 \uCE90\uC2DC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].inputRow
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    id: `vehicle-${scope.instanceId}`,
    "data-testid": "input",
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].input,
    value: input,
    onChange: event => setInput(event.target.value),
    placeholder: "\uC774 \uC704\uC82F\uC5D0\uB9CC \uC800\uC7A5\uD560 \uAC12"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "cache-write",
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].secondary,
    onClick: () => {
      scope.cache.set('selection', input);
      setCached(scope.cache.get('selection'));
    }
  }, "\uC800\uC7A5")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].cache
  }, "\uCE90\uC2DC ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("output", {
    "data-testid": "cache-value"
  }, cached), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "cache-read",
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].secondary,
    onClick: () => setCached(scope.cache.get('selection') || '')
  }, "\uB2E4\uC2DC \uC77D\uAE30")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].actions
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "open-popup",
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].secondary,
    onClick: () => setPopup(true)
  }, "\uC804\uC6A9 \uD31D\uC5C5 \uC5F4\uAE30"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC218\uC2E0 \uC774\uBCA4\uD2B8 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", {
    "data-testid": "event-count"
  }, scope.eventCount))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].artifact
  }, "b_1_5_0_c31af82fe4c3"), popup && scope.portalRoot && /*#__PURE__*/(0,react_dom__WEBPACK_IMPORTED_MODULE_1__.createPortal)(/*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    role: "dialog",
    "aria-label": `${scope.instanceId} 위젯 팝업`,
    "data-testid": `popup-${scope.instanceId}`,
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].popup
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, scope.instanceId, " \uC804\uC6A9 \uD31D\uC5C5 \xB7 B ", "1.5.0"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC774 \uC704\uC82F\uC744 \uC81C\uAC70\uD558\uBA74 \uC774 \uD31D\uC5C5\uB3C4 \uD568\uAED8 \uC81C\uAC70\uB429\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "close-popup",
    className: _Widget_module_css__WEBPACK_IMPORTED_MODULE_4__["default"].button,
    onClick: () => setPopup(false)
  }, "\uB2EB\uAE30")), scope.portalRoot));
}
function Widget({
  instanceId,
  onMounted
}) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(platform_sdk__WEBPACK_IMPORTED_MODULE_2__.WidgetBoundary, {
    instanceId: instanceId,
    artifactId: "b_1_5_0_c31af82fe4c3"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Content, {
    onMounted: onMounted
  }));
}

/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./src/Widget.module.css"
/*!*************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./src/Widget.module.css ***!
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
___CSS_LOADER_EXPORT___.push([module.id, `.b_1_5_0_c31af82fe4c3__panel__fKOqXc { padding: 26px; border: 1px solid #bad6f4; border-top: 4px solid #2563eb; border-radius: 14px; background: #eff6ff; color: #163252; box-shadow: 0 8px 26px #25477009; }
.b_1_5_0_c31af82fe4c3__eyebrow__SoaRs8 { color: #476886; font-size: 12px; font-weight: 700; letter-spacing: .04em; }
.b_1_5_0_c31af82fe4c3__titleRow__WyIMHR { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.b_1_5_0_c31af82fe4c3__titleRow__WyIMHR h2 { margin: 12px 0; font-size: 25px; }
.b_1_5_0_c31af82fe4c3__badge__g2UsRn { border-radius: 6px; background: #d9e8ff; padding: 5px 9px; font: 700 13px monospace; }
.b_1_5_0_c31af82fe4c3__description__hc_nWk { font-size: 13px; line-height: 1.7; color: #516d88; }
.b_1_5_0_c31af82fe4c3__facts__z_hdFF { display: grid; gap: 8px; padding: 16px 0; border-bottom: 1px solid #d2e2f2; font-size: 12px; }
.b_1_5_0_c31af82fe4c3__facts__z_hdFF span { display: flex; justify-content: space-between; }
.b_1_5_0_c31af82fe4c3__counterRow__hFNAh_ { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; }
.b_1_5_0_c31af82fe4c3__label__KVYLxk { display: block; margin-bottom: 8px; font-size: 12px; color: #476886; }
.b_1_5_0_c31af82fe4c3__count__xuXMh6 { font-size: 34px; line-height: 1; }
.b_1_5_0_c31af82fe4c3__button__UbwByH { border: 0; border-radius: 7px; padding: 11px 16px; background: #2563eb; color: white; font: inherit; font-size: 12px; cursor: pointer; }
.b_1_5_0_c31af82fe4c3__inputRow__tFVAKe { display: flex; gap: 8px; }
.b_1_5_0_c31af82fe4c3__input__kEeIsx { width: 100%; min-width: 0; border: 1px solid #b8cee4; border-radius: 7px; background: white; padding: 10px; font: inherit; font-size: 13px; }
.b_1_5_0_c31af82fe4c3__secondary__zlVM7B { flex-shrink: 0; border: 1px solid #b8cee4; border-radius: 7px; padding: 10px 12px; background: #ffffffb8; color: #254974; font: inherit; font-size: 12px; cursor: pointer; }
.b_1_5_0_c31af82fe4c3__cache__hXqBWP { display: flex; align-items: center; gap: 8px; min-height: 22px; margin-top: 12px; font-size: 12px; overflow-wrap: anywhere; }
.b_1_5_0_c31af82fe4c3__cache__hXqBWP .b_1_5_0_c31af82fe4c3__secondary__zlVM7B { margin-left: auto; padding: 5px 8px; font-size: 10px; }
.b_1_5_0_c31af82fe4c3__cache__hXqBWP output { margin-left: 10px; font-weight: 700; }
.b_1_5_0_c31af82fe4c3__actions__O9vg05 { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 15px; font-size: 12px; }
.b_1_5_0_c31af82fe4c3__artifact__XIDkbu { display: block; margin-top: 20px; color: #6a85a0; font-size: 10px; overflow-wrap: anywhere; }
.b_1_5_0_c31af82fe4c3__popup__pBpsbt { margin-top: 12px; padding: 20px; border: 2px solid #2563eb; border-radius: 10px; background: #eff6ff; color: #163252; font-size: 13px; }
`, "",{"version":3,"sources":["webpack://./src/Widget.module.css"],"names":[],"mappings":"AAAA,uCAAS,aAAa,EAAE,yBAAyB,EAAE,6BAA6B,EAAE,mBAAmB,EAAE,mBAAmB,EAAE,cAAc,EAAE,gCAAgC,EAAE;AAC9K,yCAAW,cAAc,EAAE,eAAe,EAAE,gBAAgB,EAAE,qBAAqB,EAAE;AACrF,0CAAY,aAAa,EAAE,mBAAmB,EAAE,8BAA8B,EAAE,SAAS,EAAE;AAC3F,6CAAe,cAAc,EAAE,eAAe,EAAE;AAChD,uCAAS,kBAAkB,EAAE,mBAAmB,EAAE,gBAAgB,EAAE,wBAAwB,EAAE;AAC9F,6CAAe,eAAe,EAAE,gBAAgB,EAAE,cAAc,EAAE;AAClE,uCAAS,aAAa,EAAE,QAAQ,EAAE,eAAe,EAAE,gCAAgC,EAAE,eAAe,EAAE;AACtG,4CAAc,aAAa,EAAE,8BAA8B,EAAE;AAC7D,4CAAc,aAAa,EAAE,8BAA8B,EAAE,mBAAmB,EAAE,eAAe,EAAE;AACnG,uCAAS,cAAc,EAAE,kBAAkB,EAAE,eAAe,EAAE,cAAc,EAAE;AAC9E,uCAAS,eAAe,EAAE,cAAc,EAAE;AAC1C,wCAAU,SAAS,EAAE,kBAAkB,EAAE,kBAAkB,EAAE,mBAAmB,EAAE,YAAY,EAAE,aAAa,EAAE,eAAe,EAAE,eAAe,EAAE;AACjJ,0CAAY,aAAa,EAAE,QAAQ,EAAE;AACrC,uCAAS,WAAW,EAAE,YAAY,EAAE,yBAAyB,EAAE,kBAAkB,EAAE,iBAAiB,EAAE,aAAa,EAAE,aAAa,EAAE,eAAe,EAAE;AACrJ,2CAAa,cAAc,EAAE,yBAAyB,EAAE,kBAAkB,EAAE,kBAAkB,EAAE,qBAAqB,EAAE,cAAc,EAAE,aAAa,EAAE,eAAe,EAAE,eAAe,EAAE;AACxL,uCAAS,aAAa,EAAE,mBAAmB,EAAE,QAAQ,EAAE,gBAAgB,EAAE,gBAAgB,EAAE,eAAe,EAAE,uBAAuB,EAAE;AACrI,gFAAoB,iBAAiB,EAAE,gBAAgB,EAAE,eAAe,EAAE;AAC1E,8CAAgB,iBAAiB,EAAE,gBAAgB,EAAE;AACrD,yCAAW,aAAa,EAAE,8BAA8B,EAAE,mBAAmB,EAAE,SAAS,EAAE,gBAAgB,EAAE,eAAe,EAAE;AAC7H,0CAAY,cAAc,EAAE,gBAAgB,EAAE,cAAc,EAAE,eAAe,EAAE,uBAAuB,EAAE;AACxG,uCAAS,gBAAgB,EAAE,aAAa,EAAE,yBAAyB,EAAE,mBAAmB,EAAE,mBAAmB,EAAE,cAAc,EAAE,eAAe,EAAE","sourcesContent":[".panel { padding: 26px; border: 1px solid #bad6f4; border-top: 4px solid #2563eb; border-radius: 14px; background: #eff6ff; color: #163252; box-shadow: 0 8px 26px #25477009; }\n.eyebrow { color: #476886; font-size: 12px; font-weight: 700; letter-spacing: .04em; }\n.titleRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }\n.titleRow h2 { margin: 12px 0; font-size: 25px; }\n.badge { border-radius: 6px; background: #d9e8ff; padding: 5px 9px; font: 700 13px monospace; }\n.description { font-size: 13px; line-height: 1.7; color: #516d88; }\n.facts { display: grid; gap: 8px; padding: 16px 0; border-bottom: 1px solid #d2e2f2; font-size: 12px; }\n.facts span { display: flex; justify-content: space-between; }\n.counterRow { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; }\n.label { display: block; margin-bottom: 8px; font-size: 12px; color: #476886; }\n.count { font-size: 34px; line-height: 1; }\n.button { border: 0; border-radius: 7px; padding: 11px 16px; background: #2563eb; color: white; font: inherit; font-size: 12px; cursor: pointer; }\n.inputRow { display: flex; gap: 8px; }\n.input { width: 100%; min-width: 0; border: 1px solid #b8cee4; border-radius: 7px; background: white; padding: 10px; font: inherit; font-size: 13px; }\n.secondary { flex-shrink: 0; border: 1px solid #b8cee4; border-radius: 7px; padding: 10px 12px; background: #ffffffb8; color: #254974; font: inherit; font-size: 12px; cursor: pointer; }\n.cache { display: flex; align-items: center; gap: 8px; min-height: 22px; margin-top: 12px; font-size: 12px; overflow-wrap: anywhere; }\n.cache .secondary { margin-left: auto; padding: 5px 8px; font-size: 10px; }\n.cache output { margin-left: 10px; font-weight: 700; }\n.actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 15px; font-size: 12px; }\n.artifact { display: block; margin-top: 20px; color: #6a85a0; font-size: 10px; overflow-wrap: anywhere; }\n.popup { margin-top: 12px; padding: 20px; border: 2px solid #2563eb; border-radius: 10px; background: #eff6ff; color: #163252; font-size: 13px; }\n"],"sourceRoot":""}]);
// Exports
___CSS_LOADER_EXPORT___.locals = {
	"panel": `b_1_5_0_c31af82fe4c3__panel__fKOqXc`,
	"eyebrow": `b_1_5_0_c31af82fe4c3__eyebrow__SoaRs8`,
	"titleRow": `b_1_5_0_c31af82fe4c3__titleRow__WyIMHR`,
	"badge": `b_1_5_0_c31af82fe4c3__badge__g2UsRn`,
	"description": `b_1_5_0_c31af82fe4c3__description__hc_nWk`,
	"facts": `b_1_5_0_c31af82fe4c3__facts__z_hdFF`,
	"counterRow": `b_1_5_0_c31af82fe4c3__counterRow__hFNAh_`,
	"label": `b_1_5_0_c31af82fe4c3__label__KVYLxk`,
	"count": `b_1_5_0_c31af82fe4c3__count__xuXMh6`,
	"button": `b_1_5_0_c31af82fe4c3__button__UbwByH`,
	"inputRow": `b_1_5_0_c31af82fe4c3__inputRow__tFVAKe`,
	"input": `b_1_5_0_c31af82fe4c3__input__kEeIsx`,
	"secondary": `b_1_5_0_c31af82fe4c3__secondary__zlVM7B`,
	"cache": `b_1_5_0_c31af82fe4c3__cache__hXqBWP`,
	"actions": `b_1_5_0_c31af82fe4c3__actions__O9vg05`,
	"artifact": `b_1_5_0_c31af82fe4c3__artifact__XIDkbu`,
	"popup": `b_1_5_0_c31af82fe4c3__popup__pBpsbt`
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

/***/ "./src/Widget.module.css"
/*!*******************************!*\
  !*** ./src/Widget.module.css ***!
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
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Widget_module_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./Widget.module.css */ "./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./src/Widget.module.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Widget_module_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Widget_module_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Widget_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_ruleSet_1_rules_1_use_1_Widget_module_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


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
//# sourceMappingURL=src_Widget_jsx.01e726a11e3eeacdfc36.js.map