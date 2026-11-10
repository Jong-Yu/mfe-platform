import { a as __mf_32, c as __mf_40, i as __mf_30, l as __mf_default, n as __mf_26, o as __mf_35, r as __mf_27, s as __mf_36, t as __mf_15 } from "./_virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__loadShare__react__loadShare__.js-B3vX5iHX.js";
var Layout_module_default = {
	layout: "platform_1_3_1_e25c8d049944__layout__bff4cc",
	page: "platform_1_3_1_e25c8d049944__page__bff4cc",
	sidebar: "platform_1_3_1_e25c8d049944__sidebar__bff4cc",
	brand: "platform_1_3_1_e25c8d049944__brand__bff4cc",
	mark: "platform_1_3_1_e25c8d049944__mark__bff4cc",
	label: "platform_1_3_1_e25c8d049944__label__bff4cc",
	selected: "platform_1_3_1_e25c8d049944__selected__bff4cc",
	note: "platform_1_3_1_e25c8d049944__note__bff4cc",
	workspace: "platform_1_3_1_e25c8d049944__workspace__bff4cc",
	header: "platform_1_3_1_e25c8d049944__header__bff4cc",
	tools: "platform_1_3_1_e25c8d049944__tools__bff4cc",
	wide: "platform_1_3_1_e25c8d049944__wide__bff4cc",
	pageHeader: "platform_1_3_1_e25c8d049944__pageHeader__bff4cc",
	title: "platform_1_3_1_e25c8d049944__title__bff4cc",
	description: "platform_1_3_1_e25c8d049944__description__bff4cc",
	actions: "platform_1_3_1_e25c8d049944__actions__bff4cc",
	content: "platform_1_3_1_e25c8d049944__content__bff4cc",
	skip: "platform_1_3_1_e25c8d049944__skip__bff4cc"
};
// src/remote-loader.js
var moduleCaches = /* @__PURE__ */ new WeakMap();
var recoveryLog = [];
var retryProtocols = /* @__PURE__ */ new Set([
	"failed-modules-v1",
	"failed-modules-v2",
	"vite-preflight-v1"
]);
var retryDelayMs = 500;
function isTransientLoadError(error) {
	const message = error?.message || "";
	return error?.code === "MFE_CHUNK_LOAD" || error?.name === "ChunkLoadError" || /^Remote (unavailable|timed out): /.test(message) || /^(Module |Initialization |Remote ).+ timed out$/.test(message) || /^(Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed)(:|\.|$)/i.test(message) || /^Unable to preload CSS for /.test(message) || /^\[Module Federation\] Failed to load CSS asset: /.test(message);
}
function getRemoteRecoveryLog() {
	return recoveryLog.map((entry) => ({
		...entry,
		removed: [...entry.removed],
		prepared: [...entry.prepared]
	}));
}
async function resetFailedBranch(runtime, artifact, scope, context, preparedFactories, visited = /* @__PURE__ */ new Set()) {
	if (!artifact || visited.has(artifact.id) || artifact.service === "platform") return;
	visited.add(artifact.id);
	const registry = runtime.registry;
	const children = [...Object.values(artifact.dependencies || {}), ...Object.values(registry.runtimeBindings[artifact.id] || {})];
	for (const id of children) await resetFailedBranch(runtime, registry.artifacts[id], scope, context, preparedFactories, visited);
	if (!retryProtocols.has(artifact.retryProtocol)) return;
	const container = await runtime.getArtifactContainer(artifact);
	await container.init(scope);
	const controls = (await container.get("./__mfe_retry__"))();
	if (controls.protocol !== artifact.retryProtocol) throw new Error("Unsupported remote retry protocol");
	const failedExposes = controls.protocol === "failed-modules-v1" ? [] : controls.getFailedExposes();
	const removed = controls.resetFailedModules();
	const record = {
		...context,
		artifactId: artifact.id,
		removed,
		prepared: []
	};
	recoveryLog.push(record);
	if (recoveryLog.length > 50) recoveryLog.shift();
	for (const request of failedExposes) {
		const factory = await container.get(request);
		preparedFactories.set(JSON.stringify([artifact.id, request]), factory);
		record.prepared.push(request);
	}
}
async function loadRemoteDependency(consumerId, alias, exposedModule, retry) {
	if (![
		consumerId,
		alias,
		exposedModule
	].every((value) => typeof value === "string" && value.length > 0)) throw new Error("RemoteRegion requires a consumerId, alias and exposedModule.");
	const runtime = globalThis.__MFE_RUNTIME__;
	if (!runtime) throw new Error("RemoteRegion requires an initialized platform runtime.");
	let modules = moduleCaches.get(runtime);
	if (!modules) {
		modules = /* @__PURE__ */ new Map();
		moduleCaches.set(runtime, modules);
	}
	const key = JSON.stringify([
		consumerId,
		alias,
		exposedModule
	]);
	if (!modules.has(key)) {
		const loadOnce = async (attempt) => {
			const scope = await runtime.initializeSharing();
			const container = await runtime.getDependencyContainer(consumerId, alias);
			await container.init(scope);
			let factory;
			if (retry) {
				const target = runtime.registry.artifacts[runtime.registry.runtimeBindings[consumerId][alias]];
				if (!retryProtocols.has(target.retryProtocol)) throw new Error("This remote build does not support local retry");
				const preparedFactories = /* @__PURE__ */ new Map();
				await resetFailedBranch(runtime, target, scope, {
					consumerId,
					alias,
					exposedModule,
					attempt
				}, preparedFactories);
				factory = preparedFactories.get(JSON.stringify([target.id, exposedModule]));
			}
			if (!factory) factory = await container.get(exposedModule);
			const module = factory();
			if (!module.default) throw new Error(`Missing default component: ${alias}/${exposedModule}`);
			return module;
		};
		const pending = (async () => {
			try {
				return await loadOnce(1);
			} catch (error) {
				if (!retry || !isTransientLoadError(error)) throw error;
				await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
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
var RemoteRegion_module_default = {
	loading: "platform_1_3_1_e25c8d049944__loading__616a53",
	unavailable: "platform_1_3_1_e25c8d049944__unavailable__616a53"
};
// src/RemoteRegion.jsx
function Unavailable({ instanceId, label, onRetry }) {
	return /* @__PURE__ */ __mf_default.createElement("div", {
		className: RemoteRegion_module_default.unavailable,
		role: "alert",
		"data-testid": `remote-error-${instanceId}`
	}, /* @__PURE__ */ __mf_default.createElement("strong", null, label, " 영역을 표시할 수 없습니다."), /* @__PURE__ */ __mf_default.createElement("p", null, "다른 영역은 계속 사용할 수 있습니다."), /* @__PURE__ */ __mf_default.createElement("button", {
		type: "button",
		"data-testid": `retry-${instanceId}`,
		onClick: onRetry
	}, label, " 영역 다시 시도"));
}
var RenderBoundary = class extends __mf_default.Component {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch(error) {
		console.error("RemoteRegion render failed:", error);
	}
	render() {
		return this.state.failed ? /* @__PURE__ */ __mf_default.createElement(Unavailable, {
			instanceId: this.props.instanceId,
			label: this.props.label,
			onRetry: this.props.onRetry
		}) : this.props.children;
	}
};
function LoadingRegion({ consumerId, alias, exposedModule, instanceId, label, componentProps, retry, onRetry }) {
	const [result, setResult] = __mf_40(null);
	__mf_30(() => {
		let active = true;
		loadRemoteDependency(consumerId, alias, exposedModule, retry).then((module) => {
			if (active) setResult({ Component: module.default });
		}, (error) => {
			if (!active) return;
			console.error("RemoteRegion load failed:", error);
			setResult({ error });
		});
		return () => {
			active = false;
		};
	}, [
		consumerId,
		alias,
		exposedModule,
		retry
	]);
	if (!result) return /* @__PURE__ */ __mf_default.createElement("div", {
		className: RemoteRegion_module_default.loading,
		role: "status",
		"data-testid": `remote-loading-${instanceId}`
	}, retry ? `${label} 영역을 다시 시도하는 중입니다. 일시적인 연결 오류는 한 번 더 시도합니다.` : `${label} 영역을 불러오는 중입니다.`);
	if (result.error) return /* @__PURE__ */ __mf_default.createElement(Unavailable, {
		instanceId,
		label,
		onRetry
	});
	const Component = result.Component;
	return /* @__PURE__ */ __mf_default.createElement(RenderBoundary, {
		instanceId,
		label,
		onRetry
	}, /* @__PURE__ */ __mf_default.createElement(Component, componentProps));
}
function Region(props) {
	const [attempt, setAttempt] = __mf_40(0);
	return /* @__PURE__ */ __mf_default.createElement(LoadingRegion, {
		key: attempt,
		...props,
		retry: attempt > 0,
		onRetry: () => setAttempt((value) => value + 1)
	});
}
function RemoteRegion({ consumerId, alias, exposedModule = "./Widget", instanceId, label = "서비스", componentProps }) {
	return /* @__PURE__ */ __mf_default.createElement(Region, {
		key: JSON.stringify([
			consumerId,
			alias,
			exposedModule,
			instanceId
		]),
		consumerId,
		alias,
		exposedModule,
		instanceId,
		label,
		componentProps
	});
}
// src/sdk.jsx
var ReactIdentity = __mf_default;
var PlatformContext = __mf_15(null);
var PLATFORM_VERSION = "1.3.1";
var WidgetScopeContext = __mf_15(null);
var activeScopes = /* @__PURE__ */ new Set();
var defaultUser = Object.freeze({
	name: "김개발",
	id: "demo"
});
function PlatformProvider({ children, user = defaultUser, theme = "light" }) {
	const value = __mf_36(() => ({
		platformVersion: PLATFORM_VERSION,
		user,
		theme
	}), [user, theme]);
	return /* @__PURE__ */ __mf_default.createElement(PlatformContext.Provider, { value }, children);
}
function PageContainer({ title, description, actions, children, width = "standard" }) {
	const titleId = __mf_32();
	return /* @__PURE__ */ __mf_default.createElement("section", {
		className: `${Layout_module_default.page} ${width === "wide" ? Layout_module_default.wide : ""}`,
		"aria-labelledby": title ? titleId : void 0,
		"data-page-container": true
	}, (title || description || actions) && /* @__PURE__ */ __mf_default.createElement("header", { className: Layout_module_default.pageHeader }, /* @__PURE__ */ __mf_default.createElement("div", null, title && /* @__PURE__ */ __mf_default.createElement("h1", {
		id: titleId,
		className: Layout_module_default.title
	}, title), description && /* @__PURE__ */ __mf_default.createElement("p", { className: Layout_module_default.description }, description)), actions && /* @__PURE__ */ __mf_default.createElement("div", { className: Layout_module_default.actions }, actions)), /* @__PURE__ */ __mf_default.createElement("div", { className: Layout_module_default.content }, children));
}
function DevLayout({ serviceName, children, tools }) {
	const platform = usePlatform();
	const contentId = __mf_32();
	return /* @__PURE__ */ __mf_default.createElement("div", {
		className: Layout_module_default.layout,
		"data-dev-layout": true,
		"data-theme": platform.theme
	}, /* @__PURE__ */ __mf_default.createElement("a", {
		className: Layout_module_default.skip,
		href: `#${contentId}`
	}, "콘텐츠로 이동"), /* @__PURE__ */ __mf_default.createElement("aside", {
		className: Layout_module_default.sidebar,
		"aria-label": "개발 환경"
	}, /* @__PURE__ */ __mf_default.createElement("div", { className: Layout_module_default.brand }, /* @__PURE__ */ __mf_default.createElement("span", { className: Layout_module_default.mark }, "M"), " Platform Dev"), /* @__PURE__ */ __mf_default.createElement("span", { className: Layout_module_default.label }, "LOCAL WORKSPACE"), /* @__PURE__ */ __mf_default.createElement("div", { className: Layout_module_default.selected }, serviceName), /* @__PURE__ */ __mf_default.createElement("p", { className: Layout_module_default.note }, "서비스 단독 개발", /* @__PURE__ */ __mf_default.createElement("br", null), "SDK ", platform.platformVersion, " · MF")), /* @__PURE__ */ __mf_default.createElement("div", { className: Layout_module_default.workspace }, /* @__PURE__ */ __mf_default.createElement("header", { className: Layout_module_default.header }, /* @__PURE__ */ __mf_default.createElement("span", null, "개발 미리보기 ", /* @__PURE__ */ __mf_default.createElement("strong", null, serviceName)), /* @__PURE__ */ __mf_default.createElement("span", null, platform.user.name)), tools && /* @__PURE__ */ __mf_default.createElement("div", { className: Layout_module_default.tools }, tools), /* @__PURE__ */ __mf_default.createElement("main", {
		id: contentId,
		tabIndex: -1
	}, children)));
}
function usePlatform() {
	const platform = __mf_27(PlatformContext);
	if (!platform) throw new Error("usePlatform requires PlatformProvider.");
	return platform;
}
function WidgetBoundary({ instanceId, artifactId, children }) {
	const [count, setCount] = __mf_40(0);
	const [eventCount, setEventCount] = __mf_40(0);
	const [portalRoot, setPortalRoot] = __mf_40(null);
	const [runtime] = __mf_40(() => ({
		instanceId,
		artifactId,
		count: 0,
		eventCount: 0,
		cache: /* @__PURE__ */ new Map(),
		subscriptions: /* @__PURE__ */ new Set(),
		incrementEventCount() {
			this.eventCount += 1;
			setEventCount(this.eventCount);
		}
	}));
	const subscribe = __mf_26((handler) => {
		if (typeof handler !== "function") throw new TypeError("subscribe requires a function.");
		const subscription = { handler };
		runtime.subscriptions.add(subscription);
		return () => {
			runtime.subscriptions.delete(subscription);
		};
	}, [runtime]);
	__mf_35(() => {
		runtime.instanceId = instanceId;
		runtime.artifactId = artifactId;
		runtime.count = count;
	}, [
		runtime,
		instanceId,
		artifactId,
		count
	]);
	__mf_30(() => {
		activeScopes.add(runtime);
		return () => {
			activeScopes.delete(runtime);
			runtime.subscriptions.clear();
		};
	}, [runtime]);
	const scope = __mf_36(() => ({
		instanceId,
		artifactId,
		count,
		setCount,
		eventCount,
		cache: runtime.cache,
		portalRoot,
		subscribe
	}), [
		instanceId,
		artifactId,
		count,
		eventCount,
		runtime,
		portalRoot,
		subscribe
	]);
	return /* @__PURE__ */ __mf_default.createElement(WidgetScopeContext.Provider, { value: scope }, /* @__PURE__ */ __mf_default.createElement("div", { "data-widget-scope": instanceId }, children, /* @__PURE__ */ __mf_default.createElement("div", {
		"data-portal-scope": instanceId,
		ref: setPortalRoot
	})));
}
function useWidgetScope() {
	const scope = __mf_27(WidgetScopeContext);
	if (!scope) throw new Error("useWidgetScope requires WidgetBoundary.");
	return scope;
}
function getRuntimeSnapshot() {
	const instances = [...activeScopes];
	return {
		activeInstances: instances.map((scope) => ({
			instanceId: scope.instanceId,
			artifactId: scope.artifactId,
			count: scope.count,
			eventCount: scope.eventCount,
			cacheSize: scope.cache.size
		})),
		activeSubscriptions: instances.reduce((total, scope) => total + scope.subscriptions.size, 0),
		eventCounts: Object.fromEntries(instances.map((scope) => [scope.instanceId, scope.eventCount])),
		platformVersion: PLATFORM_VERSION
	};
}
function emitDemoEvent() {
	let notified = 0;
	for (const scope of [...activeScopes]) {
		if (!activeScopes.has(scope) || scope.subscriptions.size === 0) continue;
		scope.incrementEventCount();
		const event = {
			type: "demo",
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
export { DevLayout, PageContainer, PlatformContext, PlatformProvider, ReactIdentity, RemoteRegion, WidgetBoundary, emitDemoEvent, getRemoteRecoveryLog, getRuntimeSnapshot, usePlatform, useWidgetScope };

//# sourceMappingURL=sdk-ClnQiGJZ.js.map