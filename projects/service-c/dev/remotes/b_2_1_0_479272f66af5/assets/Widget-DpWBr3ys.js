import { a as init__virtual_mf___mfe_internal__mf_b_2_1_0_479272f66af5__mf_owner__123185571438837__loadShare__react__loadShare__, n as __mf_40, r as __mf_default, t as __mf_30 } from "./_virtual_mf___mfe_internal__mf_b_2_1_0_479272f66af5__mf_owner__123185571438837__loadShare__react__loadShare__.js-CJqcos9T.js";
import { n as __mf_2 } from "./_virtual_mf___mfe_internal__mf_b_2_1_0_479272f66af5__mf_owner__123185571438837__loadShare__shared-fhLrJplx.js";
import { r as exportModule, t as __mf_remote_pending } from "./_virtual_mf___mfe_internal__mf_b_2_1_0_479272f66af5__loadRemote__platform_mf_1_sdk__mf_owner__1__loadRemote__-Bajl1dHW.js";
import { r as exportModule$1, t as __mf_remote_pending$1 } from "./_virtual_mf___mfe_internal__mf_b_2_1_0_479272f66af5__loadRemote__d_mf_1_data__mf_owner__1__loadRemote__-k3NJ0iS_.js";
// src/Widget.module.css
init__virtual_mf___mfe_internal__mf_b_2_1_0_479272f66af5__mf_owner__123185571438837__loadShare__react__loadShare__();
var Widget_module_default = {
	panel: "b_2_1_0_479272f66af5__panel__899503",
	eyebrow: "b_2_1_0_479272f66af5__eyebrow__899503",
	titleRow: "b_2_1_0_479272f66af5__titleRow__899503",
	badge: "b_2_1_0_479272f66af5__badge__899503",
	description: "b_2_1_0_479272f66af5__description__899503",
	facts: "b_2_1_0_479272f66af5__facts__899503",
	counterRow: "b_2_1_0_479272f66af5__counterRow__899503",
	label: "b_2_1_0_479272f66af5__label__899503",
	count: "b_2_1_0_479272f66af5__count__899503",
	button: "b_2_1_0_479272f66af5__button__899503",
	inputRow: "b_2_1_0_479272f66af5__inputRow__899503",
	input: "b_2_1_0_479272f66af5__input__899503",
	secondary: "b_2_1_0_479272f66af5__secondary__899503",
	cache: "b_2_1_0_479272f66af5__cache__899503",
	actions: "b_2_1_0_479272f66af5__actions__899503",
	artifact: "b_2_1_0_479272f66af5__artifact__899503",
	popup: "b_2_1_0_479272f66af5__popup__899503"
};
// src/Widget.jsx
var PlatformContext;
var WidgetBoundary;
var usePlatform;
var useWidgetScope;
if ("PlatformContext" in exportModule) PlatformContext = exportModule["PlatformContext"];
if ("WidgetBoundary" in exportModule) WidgetBoundary = exportModule["WidgetBoundary"];
if ("usePlatform" in exportModule) usePlatform = exportModule["usePlatform"];
if ("useWidgetScope" in exportModule) useWidgetScope = exportModule["useWidgetScope"];
__mf_remote_pending.then(() => {
	PlatformContext = exportModule["PlatformContext"];
	WidgetBoundary = exportModule["WidgetBoundary"];
	usePlatform = exportModule["usePlatform"];
	useWidgetScope = exportModule["useWidgetScope"];
});
var describe;
var dependencyVersion;
var dependencyArtifact;
if ("describe" in exportModule$1) describe = exportModule$1["describe"];
if ("version" in exportModule$1) dependencyVersion = exportModule$1["version"];
if ("artifactId" in exportModule$1) dependencyArtifact = exportModule$1["artifactId"];
__mf_remote_pending$1.then(() => {
	describe = exportModule$1["describe"];
	dependencyVersion = exportModule$1["version"];
	dependencyArtifact = exportModule$1["artifactId"];
});
function getIdentity() {
	return {
		react: __mf_default,
		context: PlatformContext,
		artifactId: "b_2_1_0_479272f66af5",
		version: "2.1.0",
		dependencyArtifact,
		dependencyVersion
	};
}
function Content({ onMounted }) {
	const platform = usePlatform();
	const scope = useWidgetScope();
	const [input, setInput] = __mf_40("");
	const [cached, setCached] = __mf_40("");
	const [popup, setPopup] = __mf_40(false);
	__mf_30(() => scope.subscribe(() => {}), [scope.subscribe]);
	__mf_30(() => {
		onMounted?.(scope.instanceId);
	}, [onMounted, scope.instanceId]);
	return /* @__PURE__ */ __mf_default.createElement("article", {
		"data-testid": `widget-${scope.instanceId}`,
		"data-css-role": "panel",
		className: Widget_module_default.panel
	}, /* @__PURE__ */ __mf_default.createElement("div", { className: Widget_module_default.eyebrow }, scope.instanceId, " 서비스가 사용하는 위젯"), /* @__PURE__ */ __mf_default.createElement("div", { className: Widget_module_default.titleRow }, /* @__PURE__ */ __mf_default.createElement("h2", null, "Car Picker"), /* @__PURE__ */ __mf_default.createElement("span", {
		"data-testid": "version",
		className: Widget_module_default.badge
	}, "2.1.0")), /* @__PURE__ */ __mf_default.createElement("p", { className: Widget_module_default.description }, "독립 프로젝트에서 빌드한 B. 상태와 스타일은 이 인스턴스에만 적용됩니다."), /* @__PURE__ */ __mf_default.createElement("div", { className: Widget_module_default.facts }, /* @__PURE__ */ __mf_default.createElement("span", null, "간접 의존성 ", /* @__PURE__ */ __mf_default.createElement("strong", { "data-testid": "dependency" }, describe())), /* @__PURE__ */ __mf_default.createElement("span", null, "공통 사용자 ", /* @__PURE__ */ __mf_default.createElement("strong", { "data-testid": "platform-user" }, platform.user.name)), /* @__PURE__ */ __mf_default.createElement("span", null, "플랫폼 ", /* @__PURE__ */ __mf_default.createElement("strong", { "data-testid": "platform-version" }, platform.platformVersion))), /* @__PURE__ */ __mf_default.createElement("div", { className: Widget_module_default.counterRow }, /* @__PURE__ */ __mf_default.createElement("div", null, /* @__PURE__ */ __mf_default.createElement("span", { className: Widget_module_default.label }, "독립 카운터"), /* @__PURE__ */ __mf_default.createElement("strong", {
		"data-testid": "count",
		className: Widget_module_default.count
	}, scope.count)), /* @__PURE__ */ __mf_default.createElement("button", {
		"data-testid": "increment",
		"data-css-role": "button",
		className: Widget_module_default.button,
		onClick: () => scope.setCount((value) => value + 1)
	}, "카운터 +1")), /* @__PURE__ */ __mf_default.createElement("label", {
		className: Widget_module_default.label,
		htmlFor: `vehicle-${scope.instanceId}`
	}, "차량 메모 · 인스턴스 전용 캐시"), /* @__PURE__ */ __mf_default.createElement("div", { className: Widget_module_default.inputRow }, /* @__PURE__ */ __mf_default.createElement("input", {
		id: `vehicle-${scope.instanceId}`,
		"data-testid": "input",
		className: Widget_module_default.input,
		value: input,
		onChange: (event) => setInput(event.target.value),
		placeholder: "이 위젯에만 저장할 값"
	}), /* @__PURE__ */ __mf_default.createElement("button", {
		"data-testid": "cache-write",
		className: Widget_module_default.secondary,
		onClick: () => {
			scope.cache.set("selection", input);
			setCached(scope.cache.get("selection"));
		}
	}, "저장")), /* @__PURE__ */ __mf_default.createElement("div", { className: Widget_module_default.cache }, "캐시 ", /* @__PURE__ */ __mf_default.createElement("output", { "data-testid": "cache-value" }, cached), /* @__PURE__ */ __mf_default.createElement("button", {
		"data-testid": "cache-read",
		className: Widget_module_default.secondary,
		onClick: () => setCached(scope.cache.get("selection") || "")
	}, "다시 읽기")), /* @__PURE__ */ __mf_default.createElement("div", { className: Widget_module_default.actions }, /* @__PURE__ */ __mf_default.createElement("button", {
		"data-testid": "open-popup",
		className: Widget_module_default.secondary,
		onClick: () => setPopup(true)
	}, "전용 팝업 열기"), /* @__PURE__ */ __mf_default.createElement("span", null, "수신 이벤트 ", /* @__PURE__ */ __mf_default.createElement("strong", { "data-testid": "event-count" }, scope.eventCount))), /* @__PURE__ */ __mf_default.createElement("code", { className: Widget_module_default.artifact }, "b_2_1_0_479272f66af5"), popup && scope.portalRoot && __mf_2(/* @__PURE__ */ __mf_default.createElement("section", {
		role: "dialog",
		"aria-label": `${scope.instanceId} 위젯 팝업`,
		"data-testid": `popup-${scope.instanceId}`,
		className: Widget_module_default.popup
	}, /* @__PURE__ */ __mf_default.createElement("strong", null, scope.instanceId, " 전용 팝업 · B ", "2.1.0"), /* @__PURE__ */ __mf_default.createElement("p", null, "이 위젯을 제거하면 이 팝업도 함께 제거됩니다."), /* @__PURE__ */ __mf_default.createElement("button", {
		"data-testid": "close-popup",
		className: Widget_module_default.button,
		onClick: () => setPopup(false)
	}, "닫기")), scope.portalRoot));
}
function Widget({ instanceId, onMounted }) {
	return /* @__PURE__ */ __mf_default.createElement(WidgetBoundary, {
		instanceId,
		artifactId: "b_2_1_0_479272f66af5"
	}, /* @__PURE__ */ __mf_default.createElement(Content, { onMounted }));
}
var __mf_remote_dependency_pending = Promise.all([__mf_remote_pending, __mf_remote_pending$1]);
export { __mf_remote_dependency_pending, Widget as default, getIdentity };

//# sourceMappingURL=Widget-DpWBr3ys.js.map