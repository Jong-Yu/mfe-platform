"use strict";
(self["webpackChunkb_2_1_0_c751f7ae2573"] = self["webpackChunkb_2_1_0_c751f7ae2573"] || []).push([["src_Summary_jsx"],{

/***/ "./src/Summary.jsx"
/*!*************************!*\
  !*** ./src/Summary.jsx ***!
  \*************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Summary)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var platform_sdk__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! platform/sdk */ "webpack/container/remote/platform/sdk");
/* harmony import */ var platform_sdk__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(platform_sdk__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var d_data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! d/data */ "webpack/container/remote/d/data");
/* harmony import */ var d_data__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(d_data__WEBPACK_IMPORTED_MODULE_2__);



function Content() {
  const scope = (0,platform_sdk__WEBPACK_IMPORTED_MODULE_1__.useWidgetScope)(),
    platform = (0,platform_sdk__WEBPACK_IMPORTED_MODULE_1__.usePlatform)();
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    "data-testid": `summary-${scope.instanceId}`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uCC28\uB7C9 \uC694\uC57D \xB7 ", (0,d_data__WEBPACK_IMPORTED_MODULE_2__.describe)(), " \xB7 ", platform.user.name), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "summary-increment",
    onClick: () => scope.setCount(n => n + 1)
  }, "\uC694\uC57D \uD655\uC778 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    "data-testid": "summary-count"
  }, scope.count)));
}
function Summary({
  instanceId
}) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(platform_sdk__WEBPACK_IMPORTED_MODULE_1__.WidgetBoundary, {
    instanceId: instanceId,
    artifactId: "b_2_1_0_c751f7ae2573"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Content, null));
}

/***/ }

}]);
//# sourceMappingURL=src_Summary_jsx.6d98387357b16254bef8.js.map