import { a as init__virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__react__loadShare__, n as __mf_40, r as __mf_default, t as __mf_30 } from "./_virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__react__loadShare__.js-DgQ7VONi.js";
import { n as __mf_2 } from "./_virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__shared-B1DGyhpy.js";
import { r as exportModule, t as __mf_remote_pending } from "./_virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__loadRemote__platform_mf_1_sdk__mf_owner__1__loadRemote__-Bqk7zvGL.js";
import { r as exportModule$1, t as __mf_remote_pending$1 } from "./_virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__loadRemote__d_mf_1_data__mf_owner__1__loadRemote__-6LDeHEEF.js";
// src/Widget.module.css
init__virtual_mf___mfe_internal__mf_b_1_4_0_6cc8bf6c0028__mf_owner__226140563824246__loadShare__react__loadShare__();
var Widget_module_default = {
	panel: "b_1_4_0_6cc8bf6c0028__panel__c038c0",
	eyebrow: "b_1_4_0_6cc8bf6c0028__eyebrow__c038c0",
	titleRow: "b_1_4_0_6cc8bf6c0028__titleRow__c038c0",
	badge: "b_1_4_0_6cc8bf6c0028__badge__c038c0",
	description: "b_1_4_0_6cc8bf6c0028__description__c038c0",
	facts: "b_1_4_0_6cc8bf6c0028__facts__c038c0",
	counterRow: "b_1_4_0_6cc8bf6c0028__counterRow__c038c0",
	label: "b_1_4_0_6cc8bf6c0028__label__c038c0",
	count: "b_1_4_0_6cc8bf6c0028__count__c038c0",
	button: "b_1_4_0_6cc8bf6c0028__button__c038c0",
	inputRow: "b_1_4_0_6cc8bf6c0028__inputRow__c038c0",
	input: "b_1_4_0_6cc8bf6c0028__input__c038c0",
	secondary: "b_1_4_0_6cc8bf6c0028__secondary__c038c0",
	cache: "b_1_4_0_6cc8bf6c0028__cache__c038c0",
	actions: "b_1_4_0_6cc8bf6c0028__actions__c038c0",
	artifact: "b_1_4_0_6cc8bf6c0028__artifact__c038c0",
	popup: "b_1_4_0_6cc8bf6c0028__popup__c038c0"
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
		artifactId: "b_1_4_0_6cc8bf6c0028",
		version: "1.4.0",
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
	}, "1.4.0")), /* @__PURE__ */ __mf_default.createElement("p", { className: Widget_module_default.description }, "독립 프로젝트에서 빌드한 B. 상태와 스타일은 이 인스턴스에만 적용됩니다."), /* @__PURE__ */ __mf_default.createElement("div", { className: Widget_module_default.facts }, /* @__PURE__ */ __mf_default.createElement("span", null, "간접 의존성 ", /* @__PURE__ */ __mf_default.createElement("strong", { "data-testid": "dependency" }, describe())), /* @__PURE__ */ __mf_default.createElement("span", null, "공통 사용자 ", /* @__PURE__ */ __mf_default.createElement("strong", { "data-testid": "platform-user" }, platform.user.name)), /* @__PURE__ */ __mf_default.createElement("span", null, "플랫폼 ", /* @__PURE__ */ __mf_default.createElement("strong", { "data-testid": "platform-version" }, platform.platformVersion))), /* @__PURE__ */ __mf_default.createElement("div", { className: Widget_module_default.counterRow }, /* @__PURE__ */ __mf_default.createElement("div", null, /* @__PURE__ */ __mf_default.createElement("span", { className: Widget_module_default.label }, "독립 카운터"), /* @__PURE__ */ __mf_default.createElement("strong", {
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
	}, "전용 팝업 열기"), /* @__PURE__ */ __mf_default.createElement("span", null, "수신 이벤트 ", /* @__PURE__ */ __mf_default.createElement("strong", { "data-testid": "event-count" }, scope.eventCount))), /* @__PURE__ */ __mf_default.createElement("code", { className: Widget_module_default.artifact }, "b_1_4_0_6cc8bf6c0028"), popup && scope.portalRoot && __mf_2(/* @__PURE__ */ __mf_default.createElement("section", {
		role: "dialog",
		"aria-label": `${scope.instanceId} 위젯 팝업`,
		"data-testid": `popup-${scope.instanceId}`,
		className: Widget_module_default.popup
	}, /* @__PURE__ */ __mf_default.createElement("strong", null, scope.instanceId, " 전용 팝업 · B ", "1.4.0"), /* @__PURE__ */ __mf_default.createElement("p", null, "이 위젯을 제거하면 이 팝업도 함께 제거됩니다."), /* @__PURE__ */ __mf_default.createElement("button", {
		"data-testid": "close-popup",
		className: Widget_module_default.button,
		onClick: () => setPopup(false)
	}, "닫기")), scope.portalRoot));
}
function Widget({ instanceId, onMounted }) {
	return /* @__PURE__ */ __mf_default.createElement(WidgetBoundary, {
		instanceId,
		artifactId: "b_1_4_0_6cc8bf6c0028"
	}, /* @__PURE__ */ __mf_default.createElement(Content, { onMounted }));
}
var __mf_remote_dependency_pending = Promise.all([__mf_remote_pending, __mf_remote_pending$1]);
export { __mf_remote_dependency_pending, Widget as default, getIdentity };

//# sourceMappingURL=Widget-BiiMpLC6.js.map