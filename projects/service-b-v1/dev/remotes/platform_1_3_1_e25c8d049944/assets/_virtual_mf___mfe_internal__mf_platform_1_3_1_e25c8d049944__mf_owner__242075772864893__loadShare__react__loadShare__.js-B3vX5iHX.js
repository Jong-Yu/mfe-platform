import { n as __exportAll, r as __toESM, t as __commonJSMin } from "./rolldown-runtime-SbdDWaPq.js";
// node_modules/react/cjs/react.development.js
/**
* @license React
* react.development.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_development = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		function defineDeprecationWarning(methodName, info) {
			Object.defineProperty(Component.prototype, methodName, { get: function() {
				console.warn("%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]);
			} });
		}
		function getIteratorFn(maybeIterable) {
			if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
			maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
			return "function" === typeof maybeIterable ? maybeIterable : null;
		}
		function warnNoop(publicInstance, callerName) {
			publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
			var warningKey = publicInstance + "." + callerName;
			didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", callerName, publicInstance), didWarnStateUpdateForUnmountedComponent[warningKey] = !0);
		}
		function Component(props, context, updater) {
			this.props = props;
			this.context = context;
			this.refs = emptyObject;
			this.updater = updater || ReactNoopUpdateQueue;
		}
		function ComponentDummy() {}
		function PureComponent(props, context, updater) {
			this.props = props;
			this.context = context;
			this.refs = emptyObject;
			this.updater = updater || ReactNoopUpdateQueue;
		}
		function noop() {}
		function testStringCoercion(value) {
			return "" + value;
		}
		function checkKeyStringCoercion(value) {
			try {
				testStringCoercion(value);
				var JSCompiler_inline_result = !1;
			} catch (e) {
				JSCompiler_inline_result = !0;
			}
			if (JSCompiler_inline_result) {
				JSCompiler_inline_result = console;
				var JSCompiler_temp_const = JSCompiler_inline_result.error;
				var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
				JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
				return testStringCoercion(value);
			}
		}
		function getComponentNameFromType(type) {
			if (null == type) return null;
			if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
			if ("string" === typeof type) return type;
			switch (type) {
				case REACT_FRAGMENT_TYPE: return "Fragment";
				case REACT_PROFILER_TYPE: return "Profiler";
				case REACT_STRICT_MODE_TYPE: return "StrictMode";
				case REACT_SUSPENSE_TYPE: return "Suspense";
				case REACT_SUSPENSE_LIST_TYPE: return "SuspenseList";
				case REACT_ACTIVITY_TYPE: return "Activity";
				case REACT_VIEW_TRANSITION_TYPE: return "ViewTransition";
			}
			if ("object" === typeof type) switch ("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof) {
				case REACT_PORTAL_TYPE: return "Portal";
				case REACT_CONTEXT_TYPE: return type.displayName || "Context";
				case REACT_CONSUMER_TYPE: return (type._context.displayName || "Context") + ".Consumer";
				case REACT_FORWARD_REF_TYPE:
					var innerType = type.render;
					type = type.displayName;
					type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
					return type;
				case REACT_MEMO_TYPE: return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
				case REACT_LAZY_TYPE:
					innerType = type._payload;
					type = type._init;
					try {
						return getComponentNameFromType(type(innerType));
					} catch (x) {}
			}
			return null;
		}
		function getTaskName(type) {
			if (type === REACT_FRAGMENT_TYPE) return "<>";
			if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
			try {
				var name = getComponentNameFromType(type);
				return name ? "<" + name + ">" : "<...>";
			} catch (x) {
				return "<...>";
			}
		}
		function getOwner() {
			var dispatcher = ReactSharedInternals.A;
			return null === dispatcher ? null : dispatcher.getOwner();
		}
		function UnknownOwner() {
			return Error("react-stack-top-frame");
		}
		function hasValidKey(config) {
			if (hasOwnProperty.call(config, "key")) {
				var getter = Object.getOwnPropertyDescriptor(config, "key").get;
				if (getter && getter.isReactWarning) return !1;
			}
			return void 0 !== config.key;
		}
		function defineKeyPropWarningGetter(props, displayName) {
			function warnAboutAccessingKey() {
				specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
			}
			warnAboutAccessingKey.isReactWarning = !0;
			Object.defineProperty(props, "key", {
				get: warnAboutAccessingKey,
				configurable: !0
			});
		}
		function elementRefGetterWithDeprecationWarning() {
			var componentName = getComponentNameFromType(this.type);
			didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
			componentName = this.props.ref;
			return void 0 !== componentName ? componentName : null;
		}
		function ReactElement(type, key, props, owner, debugStack, debugTask) {
			var refProp = props.ref;
			type = {
				$$typeof: REACT_ELEMENT_TYPE,
				type,
				key,
				props,
				_owner: owner
			};
			null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
				enumerable: !1,
				get: elementRefGetterWithDeprecationWarning
			}) : Object.defineProperty(type, "ref", {
				enumerable: !1,
				value: null
			});
			type._store = {};
			Object.defineProperty(type._store, "validated", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: 0
			});
			Object.defineProperty(type, "_debugInfo", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: null
			});
			Object.defineProperty(type, "_debugStack", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: debugStack
			});
			Object.defineProperty(type, "_debugTask", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: debugTask
			});
			Object.freeze && (Object.freeze(type.props), Object.freeze(type));
			return type;
		}
		function cloneAndReplaceKey(oldElement, newKey) {
			newKey = ReactElement(oldElement.type, newKey, oldElement.props, oldElement._owner, oldElement._debugStack, oldElement._debugTask);
			oldElement._store && (newKey._store.validated = oldElement._store.validated);
			return newKey;
		}
		function validateChildKeys(node) {
			isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
		}
		function isValidElement(object) {
			return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
		}
		function escape(key) {
			var escaperLookup = {
				"=": "=0",
				":": "=2"
			};
			return "$" + key.replace(/[=:]/g, function(match) {
				return escaperLookup[match];
			});
		}
		function getElementKey(element, index) {
			return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
		}
		function resolveThenable(thenable) {
			switch (thenable.status) {
				case "fulfilled": return thenable.value;
				case "rejected": throw thenable.reason;
				default: switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
					"pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
				}, function(error) {
					"pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
				})), thenable.status) {
					case "fulfilled": return thenable.value;
					case "rejected": throw thenable.reason;
				}
			}
			throw thenable;
		}
		function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
			var type = typeof children;
			if ("undefined" === type || "boolean" === type) children = null;
			var invokeCallback = !1;
			if (null === children) invokeCallback = !0;
			else switch (type) {
				case "bigint":
				case "string":
				case "number":
					invokeCallback = !0;
					break;
				case "object": switch (children.$$typeof) {
					case REACT_ELEMENT_TYPE:
					case REACT_PORTAL_TYPE:
						invokeCallback = !0;
						break;
					case REACT_LAZY_TYPE: return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
				}
			}
			if (invokeCallback) {
				invokeCallback = children;
				callback = callback(invokeCallback);
				var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
				isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
					return c;
				})) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(callback, escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + childKey), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
				return 1;
			}
			invokeCallback = 0;
			childKey = "" === nameSoFar ? "." : nameSoFar + ":";
			if (isArrayImpl(children)) for (var i = 0; i < children.length; i++) nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
			else if (i = getIteratorFn(children), "function" === typeof i) for (i === children.entries && (didWarnAboutMaps || console.warn("Using Maps as children is not supported. Use an array of keyed ReactElements instead."), didWarnAboutMaps = !0), children = i.call(children), i = 0; !(nameSoFar = children.next()).done;) nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
			else if ("object" === type) {
				if ("function" === typeof children.then) return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
				array = String(children);
				throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
			}
			return invokeCallback;
		}
		function mapChildren(children, func, context) {
			if (null == children) return children;
			var result = [], count = 0;
			mapIntoArray(children, result, "", "", function(child) {
				return func.call(context, child, count++);
			});
			return result;
		}
		function lazyInitializer(payload) {
			if (-1 === payload._status) {
				var resolveDebugValue = null, rejectDebugValue = null, ioInfo = payload._ioInfo;
				null != ioInfo && (ioInfo.start = ioInfo.end = performance.now(), ioInfo.value = new Promise(function(resolve, reject) {
					resolveDebugValue = resolve;
					rejectDebugValue = reject;
				}));
				ioInfo = payload._result;
				var thenable = ioInfo();
				thenable.then(function(moduleObject) {
					if (0 === payload._status || -1 === payload._status) {
						payload._status = 1;
						payload._result = moduleObject;
						var _ioInfo = payload._ioInfo;
						if (null != _ioInfo) {
							_ioInfo.end = performance.now();
							var debugValue = null == moduleObject ? void 0 : moduleObject.default;
							resolveDebugValue(debugValue);
							_ioInfo.value.status = "fulfilled";
							_ioInfo.value.value = debugValue;
						}
						void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
					}
				}, function(error) {
					if (0 === payload._status || -1 === payload._status) {
						payload._status = 2;
						payload._result = error;
						var _ioInfo2 = payload._ioInfo;
						null != _ioInfo2 && (_ioInfo2.end = performance.now(), _ioInfo2.value.then(noop, noop), rejectDebugValue(error), _ioInfo2.value.status = "rejected", _ioInfo2.value.reason = error);
						void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
					}
				});
				ioInfo = payload._ioInfo;
				if (null != ioInfo) {
					var displayName = thenable.displayName;
					"string" === typeof displayName && (ioInfo.name = displayName);
				}
				-1 === payload._status && (payload._status = 0, payload._result = thenable);
			}
			if (1 === payload._status) return ioInfo = payload._result, void 0 === ioInfo && console.error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?", ioInfo), "default" in ioInfo || console.error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", ioInfo), ioInfo.default;
			throw payload._result;
		}
		function resolveDispatcher() {
			var dispatcher = ReactSharedInternals.H;
			null === dispatcher && console.error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.");
			return dispatcher;
		}
		function releaseAsyncTransition() {
			ReactSharedInternals.asyncTransitions--;
		}
		function startTransition(scope) {
			var prevTransition = ReactSharedInternals.T, currentTransition = {};
			currentTransition.types = null !== prevTransition ? prevTransition.types : null;
			currentTransition._updatedFibers = /* @__PURE__ */ new Set();
			ReactSharedInternals.T = currentTransition;
			try {
				var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
				null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
				"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
			} catch (error) {
				reportGlobalError(error);
			} finally {
				null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.")), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error("We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
			}
		}
		function addTransitionType(type) {
			var transition = ReactSharedInternals.T;
			if (null !== transition) {
				var transitionTypes = transition.types;
				null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
			} else 0 === ReactSharedInternals.asyncTransitions && console.error("addTransitionType can only be called inside a `startTransition()` callback. It must be associated with a specific Transition."), startTransition(addTransitionType.bind(null, type));
		}
		function enqueueTask(task) {
			if (null === enqueueTaskImpl) try {
				var requireString = ("require" + Math.random()).slice(0, 7);
				enqueueTaskImpl = (module && module[requireString]).call(module, "timers").setImmediate;
			} catch (_err) {
				enqueueTaskImpl = function(callback) {
					!1 === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = !0, "undefined" === typeof MessageChannel && console.error("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."));
					var channel = new MessageChannel();
					channel.port1.onmessage = callback;
					channel.port2.postMessage(void 0);
				};
			}
			return enqueueTaskImpl(task);
		}
		function aggregateErrors(errors) {
			return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
		}
		function popActScope(prevActQueue, prevActScopeDepth) {
			prevActScopeDepth !== actScopeDepth - 1 && console.error("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. ");
			actScopeDepth = prevActScopeDepth;
		}
		function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
			var queue = ReactSharedInternals.actQueue;
			if (null !== queue) if (0 !== queue.length) try {
				flushActQueue(queue);
				enqueueTask(function() {
					return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
				});
				return;
			} catch (error) {
				ReactSharedInternals.thrownErrors.push(error);
			}
			else ReactSharedInternals.actQueue = null;
			0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
		}
		function flushActQueue(queue) {
			if (!isFlushing) {
				isFlushing = !0;
				var i = 0;
				try {
					for (; i < queue.length; i++) {
						var callback = queue[i];
						do {
							ReactSharedInternals.didUsePromise = !1;
							var continuation = callback(!1);
							if (null !== continuation) {
								if (ReactSharedInternals.didUsePromise) {
									queue[i] = callback;
									queue.splice(0, i);
									return;
								}
								callback = continuation;
							} else break;
						} while (1);
					}
					queue.length = 0;
				} catch (error) {
					queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
				} finally {
					isFlushing = !1;
				}
			}
		}
		"undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
		var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
			isMounted: function() {
				return !1;
			},
			enqueueForceUpdate: function(publicInstance) {
				warnNoop(publicInstance, "forceUpdate");
			},
			enqueueReplaceState: function(publicInstance) {
				warnNoop(publicInstance, "replaceState");
			},
			enqueueSetState: function(publicInstance) {
				warnNoop(publicInstance, "setState");
			}
		}, assign = Object.assign, emptyObject = {};
		Object.freeze(emptyObject);
		Component.prototype.isReactComponent = {};
		Component.prototype.setState = function(partialState, callback) {
			if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
			this.updater.enqueueSetState(this, partialState, callback, "setState");
		};
		Component.prototype.forceUpdate = function(callback) {
			this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
		};
		var deprecatedAPIs = {
			isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
			replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
		};
		for (fnName in deprecatedAPIs) deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
		ComponentDummy.prototype = Component.prototype;
		deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
		deprecatedAPIs.constructor = PureComponent;
		assign(deprecatedAPIs, Component.prototype);
		deprecatedAPIs.isPureReactComponent = !0;
		var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = {
			H: null,
			A: null,
			T: null,
			S: null,
			actQueue: null,
			asyncTransitions: 0,
			isBatchingLegacy: !1,
			didScheduleLegacyUpdate: !1,
			didUsePromise: !1,
			thrownErrors: [],
			getCurrentStack: null,
			recentlyCreatedOwnerStacks: 0
		}, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
			return null;
		};
		deprecatedAPIs = { react_stack_bottom_frame: function(callStackForError) {
			return callStackForError();
		} };
		var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
		var didWarnAboutElementRef = {};
		var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(deprecatedAPIs, UnknownOwner)();
		var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
		var didWarnAboutMaps = !1, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
			if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
				var event = new window.ErrorEvent("error", {
					bubbles: !0,
					cancelable: !0,
					message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
					error
				});
				if (!window.dispatchEvent(event)) return;
			} else if ("object" === typeof process && "function" === typeof process.emit) {
				process.emit("uncaughtException", error);
				return;
			}
			console.error(error);
		}, didWarnAboutMessageChannel = !1, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = !1, isFlushing = !1, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
			queueMicrotask(function() {
				return queueMicrotask(callback);
			});
		} : enqueueTask;
		deprecatedAPIs = Object.freeze({
			__proto__: null,
			c: function(size) {
				return resolveDispatcher().useMemoCache(size);
			}
		});
		var fnName = {
			map: mapChildren,
			forEach: function(children, forEachFunc, forEachContext) {
				mapChildren(children, function() {
					forEachFunc.apply(this, arguments);
				}, forEachContext);
			},
			count: function(children) {
				var n = 0;
				mapChildren(children, function() {
					n++;
				});
				return n;
			},
			toArray: function(children) {
				return mapChildren(children, function(child) {
					return child;
				}) || [];
			},
			only: function(children) {
				if (!isValidElement(children)) throw Error("React.Children.only expected to receive a single React element child.");
				return children;
			}
		};
		exports.Activity = REACT_ACTIVITY_TYPE;
		exports.Children = fnName;
		exports.Component = Component;
		exports.Fragment = REACT_FRAGMENT_TYPE;
		exports.Profiler = REACT_PROFILER_TYPE;
		exports.PureComponent = PureComponent;
		exports.StrictMode = REACT_STRICT_MODE_TYPE;
		exports.Suspense = REACT_SUSPENSE_TYPE;
		exports.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
		exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
		exports.__COMPILER_RUNTIME = deprecatedAPIs;
		exports.act = function(callback) {
			var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
			actScopeDepth++;
			var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = !1;
			try {
				var result = callback();
			} catch (error) {
				ReactSharedInternals.thrownErrors.push(error);
			}
			if (0 < ReactSharedInternals.thrownErrors.length) throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
			if (null !== result && "object" === typeof result && "function" === typeof result.then) {
				var thenable = result;
				queueSeveralMicrotasks(function() {
					didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = !0, console.error("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"));
				});
				return { then: function(resolve, reject) {
					didAwaitActCall = !0;
					thenable.then(function(returnValue) {
						popActScope(prevActQueue, prevActScopeDepth);
						if (0 === prevActScopeDepth) {
							try {
								flushActQueue(queue), enqueueTask(function() {
									return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
								});
							} catch (error$0) {
								ReactSharedInternals.thrownErrors.push(error$0);
							}
							if (0 < ReactSharedInternals.thrownErrors.length) {
								var _thrownError = aggregateErrors(ReactSharedInternals.thrownErrors);
								ReactSharedInternals.thrownErrors.length = 0;
								reject(_thrownError);
							}
						} else resolve(returnValue);
					}, function(error) {
						popActScope(prevActQueue, prevActScopeDepth);
						0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
					});
				} };
			}
			var returnValue$jscomp$0 = result;
			popActScope(prevActQueue, prevActScopeDepth);
			0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
				didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = !0, console.error("A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"));
			}), ReactSharedInternals.actQueue = null);
			if (0 < ReactSharedInternals.thrownErrors.length) throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
			return { then: function(resolve, reject) {
				didAwaitActCall = !0;
				0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
					return recursivelyFlushAsyncActWork(returnValue$jscomp$0, resolve, reject);
				})) : resolve(returnValue$jscomp$0);
			} };
		};
		exports.addTransitionType = addTransitionType;
		exports.cache = function(fn) {
			return function() {
				return fn.apply(null, arguments);
			};
		};
		exports.cacheSignal = function() {
			return null;
		};
		exports.captureOwnerStack = function() {
			var getCurrentStack = ReactSharedInternals.getCurrentStack;
			return null === getCurrentStack ? null : getCurrentStack();
		};
		exports.cloneElement = function(element, config, children) {
			if (null === element || void 0 === element) throw Error("The argument must be a React element, but you passed " + element + ".");
			var props = assign({}, element.props), key = element.key, owner = element._owner;
			if (null != config) {
				var JSCompiler_inline_result;
				a: {
					if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(config, "ref").get) && JSCompiler_inline_result.isReactWarning) {
						JSCompiler_inline_result = !1;
						break a;
					}
					JSCompiler_inline_result = void 0 !== config.ref;
				}
				JSCompiler_inline_result && (owner = getOwner());
				hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
				for (propName in config) !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
			}
			var propName = arguments.length - 2;
			if (1 === propName) props.children = children;
			else if (1 < propName) {
				JSCompiler_inline_result = Array(propName);
				for (var i = 0; i < propName; i++) JSCompiler_inline_result[i] = arguments[i + 2];
				props.children = JSCompiler_inline_result;
			}
			props = ReactElement(element.type, key, props, owner, element._debugStack, element._debugTask);
			for (key = 2; key < arguments.length; key++) validateChildKeys(arguments[key]);
			return props;
		};
		exports.createContext = function(defaultValue) {
			defaultValue = {
				$$typeof: REACT_CONTEXT_TYPE,
				_currentValue: defaultValue,
				_currentValue2: defaultValue,
				_threadCount: 0,
				Provider: null,
				Consumer: null
			};
			defaultValue.Provider = defaultValue;
			defaultValue.Consumer = {
				$$typeof: REACT_CONSUMER_TYPE,
				_context: defaultValue
			};
			defaultValue._currentRenderer = null;
			defaultValue._currentRenderer2 = null;
			return defaultValue;
		};
		exports.createElement = function(type, config, children) {
			for (var i = 2; i < arguments.length; i++) validateChildKeys(arguments[i]);
			var propName;
			i = {};
			var key = null;
			if (null != config) for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = !0, console.warn("Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform")), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config) hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
			var childrenLength = arguments.length - 2;
			if (1 === childrenLength) i.children = children;
			else if (1 < childrenLength) {
				for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++) childArray[_i] = arguments[_i + 2];
				Object.freeze && Object.freeze(childArray);
				i.children = childArray;
			}
			if (type && type.defaultProps) for (propName in childrenLength = type.defaultProps, childrenLength) void 0 === i[propName] && (i[propName] = childrenLength[propName]);
			key && defineKeyPropWarningGetter(i, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
			(propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++) ? (childArray = Error.stackTraceLimit, Error.stackTraceLimit = 10, childrenLength = Error("react-stack-top-frame"), Error.stackTraceLimit = childArray) : childrenLength = unknownOwnerDebugStack;
			return ReactElement(type, key, i, getOwner(), childrenLength, propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
		};
		exports.createRef = function() {
			var refObject = { current: null };
			Object.seal(refObject);
			return refObject;
		};
		exports.forwardRef = function(render) {
			null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : "function" !== typeof render ? console.error("forwardRef requires a render function but was given %s.", null === render ? "null" : typeof render) : 0 !== render.length && 2 !== render.length && console.error("forwardRef render functions accept exactly two parameters: props and ref. %s", 1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
			null != render && null != render.defaultProps && console.error("forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?");
			var elementType = {
				$$typeof: REACT_FORWARD_REF_TYPE,
				render
			}, ownName;
			Object.defineProperty(elementType, "displayName", {
				enumerable: !1,
				configurable: !0,
				get: function() {
					return ownName;
				},
				set: function(name) {
					ownName = name;
					render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
				}
			});
			return elementType;
		};
		exports.isValidElement = isValidElement;
		exports.lazy = function(ctor) {
			ctor = {
				_status: -1,
				_result: ctor
			};
			var lazyType = {
				$$typeof: REACT_LAZY_TYPE,
				_payload: ctor,
				_init: lazyInitializer
			}, ioInfo = {
				name: "lazy",
				start: -1,
				end: -1,
				value: null,
				owner: null,
				debugStack: Error("react-stack-top-frame"),
				debugTask: console.createTask ? console.createTask("lazy()") : null
			};
			ctor._ioInfo = ioInfo;
			lazyType._debugInfo = [{ awaited: ioInfo }];
			return lazyType;
		};
		exports.memo = function(type, compare) {
			type ?? console.error("memo: The first argument must be a component. Instead received: %s", null === type ? "null" : typeof type);
			compare = {
				$$typeof: REACT_MEMO_TYPE,
				type,
				compare: void 0 === compare ? null : compare
			};
			var ownName;
			Object.defineProperty(compare, "displayName", {
				enumerable: !1,
				configurable: !0,
				get: function() {
					return ownName;
				},
				set: function(name) {
					ownName = name;
					type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
				}
			});
			return compare;
		};
		exports.startTransition = startTransition;
		exports.unstable_useCacheRefresh = function() {
			return resolveDispatcher().useCacheRefresh();
		};
		exports.use = function(usable) {
			return resolveDispatcher().use(usable);
		};
		exports.useActionState = function(action, initialState, permalink) {
			return resolveDispatcher().useActionState(action, initialState, permalink);
		};
		exports.useCallback = function(callback, deps) {
			return resolveDispatcher().useCallback(callback, deps);
		};
		exports.useContext = function(Context) {
			var dispatcher = resolveDispatcher();
			Context.$$typeof === REACT_CONSUMER_TYPE && console.error("Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?");
			return dispatcher.useContext(Context);
		};
		exports.useDebugValue = function(value, formatterFn) {
			return resolveDispatcher().useDebugValue(value, formatterFn);
		};
		exports.useDeferredValue = function(value, initialValue) {
			return resolveDispatcher().useDeferredValue(value, initialValue);
		};
		exports.useEffect = function(create, deps) {
			create ?? console.warn("React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?");
			return resolveDispatcher().useEffect(create, deps);
		};
		exports.useEffectEvent = function(callback) {
			return resolveDispatcher().useEffectEvent(callback);
		};
		exports.useId = function() {
			return resolveDispatcher().useId();
		};
		exports.useImperativeHandle = function(ref, create, deps) {
			return resolveDispatcher().useImperativeHandle(ref, create, deps);
		};
		exports.useInsertionEffect = function(create, deps) {
			create ?? console.warn("React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?");
			return resolveDispatcher().useInsertionEffect(create, deps);
		};
		exports.useLayoutEffect = function(create, deps) {
			create ?? console.warn("React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?");
			return resolveDispatcher().useLayoutEffect(create, deps);
		};
		exports.useMemo = function(create, deps) {
			return resolveDispatcher().useMemo(create, deps);
		};
		exports.useOptimistic = function(passthrough, reducer) {
			return resolveDispatcher().useOptimistic(passthrough, reducer);
		};
		exports.useReducer = function(reducer, initialArg, init) {
			return resolveDispatcher().useReducer(reducer, initialArg, init);
		};
		exports.useRef = function(initialValue) {
			return resolveDispatcher().useRef(initialValue);
		};
		exports.useState = function(initialState) {
			return resolveDispatcher().useState(initialState);
		};
		exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
			return resolveDispatcher().useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
		};
		exports.useTransition = function() {
			return resolveDispatcher().useTransition();
		};
		exports.version = "19.3.1";
		"undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
	})();
}));
// node_modules/react/index.js
var require_react = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_development();
}));
// \0virtual:mf:__mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__prebuild__react__prebuild__.js
var _virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__prebuild__react__prebuild___exports = /* @__PURE__ */ __exportAll({
	Activity: () => __mf_0$1,
	Children: () => __mf_1$1,
	Component: () => __mf_2$1,
	Fragment: () => __mf_3$1,
	Profiler: () => __mf_4$1,
	PureComponent: () => __mf_5$1,
	StrictMode: () => __mf_6$1,
	Suspense: () => __mf_7$1,
	ViewTransition: () => __mf_8$1,
	__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: () => __mf_9$1,
	__COMPILER_RUNTIME: () => __mf_10$1,
	addTransitionType: () => __mf_11$1,
	cache: () => __mf_12$1,
	cacheSignal: () => __mf_13$1,
	cloneElement: () => __mf_14$1,
	createContext: () => __mf_15$1,
	createElement: () => __mf_16$1,
	createRef: () => __mf_17$1,
	default: () => _virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__prebuild__react__prebuild___default,
	forwardRef: () => __mf_18$1,
	isValidElement: () => __mf_19$1,
	lazy: () => __mf_20$1,
	memo: () => __mf_21$1,
	startTransition: () => __mf_22$1,
	unstable_useCacheRefresh: () => __mf_23$1,
	use: () => __mf_24$1,
	useActionState: () => __mf_25$1,
	useCallback: () => __mf_26$1,
	useContext: () => __mf_27$1,
	useDebugValue: () => __mf_28$1,
	useDeferredValue: () => __mf_29$1,
	useEffect: () => __mf_30$1,
	useEffectEvent: () => __mf_31$1,
	useId: () => __mf_32$1,
	useImperativeHandle: () => __mf_33$1,
	useInsertionEffect: () => __mf_34$1,
	useLayoutEffect: () => __mf_35$1,
	useMemo: () => __mf_36$1,
	useOptimistic: () => __mf_37$1,
	useReducer: () => __mf_38$1,
	useRef: () => __mf_39$1,
	useState: () => __mf_40$1,
	useSyncExternalStore: () => __mf_41$1,
	useTransition: () => __mf_42$1,
	version: () => __mf_43$1
});
var import_react = /* @__PURE__ */ __toESM(require_react());
var __mfPrebuildExports = import_react;
var __mf_0$1 = __mfPrebuildExports["Activity"];
var __mf_1$1 = __mfPrebuildExports["Children"];
var __mf_2$1 = __mfPrebuildExports["Component"];
var __mf_3$1 = __mfPrebuildExports["Fragment"];
var __mf_4$1 = __mfPrebuildExports["Profiler"];
var __mf_5$1 = __mfPrebuildExports["PureComponent"];
var __mf_6$1 = __mfPrebuildExports["StrictMode"];
var __mf_7$1 = __mfPrebuildExports["Suspense"];
var __mf_8$1 = __mfPrebuildExports["ViewTransition"];
var __mf_9$1 = __mfPrebuildExports["__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE"];
var __mf_10$1 = __mfPrebuildExports["__COMPILER_RUNTIME"];
var __mf_11$1 = __mfPrebuildExports["addTransitionType"];
var __mf_12$1 = __mfPrebuildExports["cache"];
var __mf_13$1 = __mfPrebuildExports["cacheSignal"];
var __mf_14$1 = __mfPrebuildExports["cloneElement"];
var __mf_15$1 = __mfPrebuildExports["createContext"];
var __mf_16$1 = __mfPrebuildExports["createElement"];
var __mf_17$1 = __mfPrebuildExports["createRef"];
var __mf_18$1 = __mfPrebuildExports["forwardRef"];
var __mf_19$1 = __mfPrebuildExports["isValidElement"];
var __mf_20$1 = __mfPrebuildExports["lazy"];
var __mf_21$1 = __mfPrebuildExports["memo"];
var __mf_22$1 = __mfPrebuildExports["startTransition"];
var __mf_23$1 = __mfPrebuildExports["unstable_useCacheRefresh"];
var __mf_24$1 = __mfPrebuildExports["use"];
var __mf_25$1 = __mfPrebuildExports["useActionState"];
var __mf_26$1 = __mfPrebuildExports["useCallback"];
var __mf_27$1 = __mfPrebuildExports["useContext"];
var __mf_28$1 = __mfPrebuildExports["useDebugValue"];
var __mf_29$1 = __mfPrebuildExports["useDeferredValue"];
var __mf_30$1 = __mfPrebuildExports["useEffect"];
var __mf_31$1 = __mfPrebuildExports["useEffectEvent"];
var __mf_32$1 = __mfPrebuildExports["useId"];
var __mf_33$1 = __mfPrebuildExports["useImperativeHandle"];
var __mf_34$1 = __mfPrebuildExports["useInsertionEffect"];
var __mf_35$1 = __mfPrebuildExports["useLayoutEffect"];
var __mf_36$1 = __mfPrebuildExports["useMemo"];
var __mf_37$1 = __mfPrebuildExports["useOptimistic"];
var __mf_38$1 = __mfPrebuildExports["useReducer"];
var __mf_39$1 = __mfPrebuildExports["useRef"];
var __mf_40$1 = __mfPrebuildExports["useState"];
var __mf_41$1 = __mfPrebuildExports["useSyncExternalStore"];
var __mf_42$1 = __mfPrebuildExports["useTransition"];
var __mf_43$1 = __mfPrebuildExports["version"];
var _virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__prebuild__react__prebuild___default = Reflect.get(import_react, "default") ?? import_react;
// \0virtual:mf:__mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__loadShare__react__loadShare__.js
var _virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__loadShare__react__loadShare___exports = /* @__PURE__ */ __exportAll({
	Activity: () => __mf_0,
	Children: () => __mf_1,
	Component: () => __mf_2,
	Fragment: () => __mf_3,
	Profiler: () => __mf_4,
	PureComponent: () => __mf_5,
	StrictMode: () => __mf_6,
	Suspense: () => __mf_7,
	ViewTransition: () => __mf_8,
	__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: () => __mf_9,
	__COMPILER_RUNTIME: () => __mf_10,
	__moduleExports: () => __moduleExports,
	addTransitionType: () => __mf_11,
	cache: () => __mf_12,
	cacheSignal: () => __mf_13,
	cloneElement: () => __mf_14,
	createContext: () => __mf_15,
	createElement: () => __mf_16,
	createRef: () => __mf_17,
	default: () => __mf_default,
	forwardRef: () => __mf_18,
	isValidElement: () => __mf_19,
	lazy: () => __mf_20,
	memo: () => __mf_21,
	startTransition: () => __mf_22,
	unstable_useCacheRefresh: () => __mf_23,
	use: () => __mf_24,
	useActionState: () => __mf_25,
	useCallback: () => __mf_26,
	useContext: () => __mf_27,
	useDebugValue: () => __mf_28,
	useDeferredValue: () => __mf_29,
	useEffect: () => __mf_30,
	useEffectEvent: () => __mf_31,
	useId: () => __mf_32,
	useImperativeHandle: () => __mf_33,
	useInsertionEffect: () => __mf_34,
	useLayoutEffect: () => __mf_35,
	useMemo: () => __mf_36,
	useOptimistic: () => __mf_37,
	useReducer: () => __mf_38,
	useRef: () => __mf_39,
	useState: () => __mf_40,
	useSyncExternalStore: () => __mf_41,
	useTransition: () => __mf_42,
	version: () => __mf_43
});
var __mfCacheGlobalKey = "__mf_module_cache__";
globalThis[__mfCacheGlobalKey] ||= {
	share: {},
	remote: {}
};
globalThis[__mfCacheGlobalKey].share ||= {};
globalThis[__mfCacheGlobalKey].remote ||= {};
var __mfModuleCache = globalThis[__mfCacheGlobalKey];
for (const __mfShareKey of Object.keys(__mfModuleCache.share)) if (__mfShareKey.startsWith("default:")) {
	const __mfLegacyShareKey = __mfShareKey.slice(8);
	if (__mfModuleCache.share[__mfLegacyShareKey] === void 0) __mfModuleCache.share[__mfLegacyShareKey] = __mfModuleCache.share[__mfShareKey];
} else if (!__mfShareKey.includes(":")) {
	const __mfDefaultShareKey = "default:" + __mfShareKey;
	if (__mfModuleCache.share[__mfDefaultShareKey] === void 0) __mfModuleCache.share[__mfDefaultShareKey] = __mfModuleCache.share[__mfShareKey];
}
var __mfReadSharedCache = (cache, descriptor) => {
	const value = cache[descriptor.canonical];
	if (value !== void 0) return value;
	const aliases = descriptor.aliases || [];
	for (const alias of aliases) {
		if (!Object.prototype.hasOwnProperty.call(cache, alias)) continue;
		const aliasValue = cache[alias];
		if (aliasValue !== void 0) {
			cache[descriptor.canonical] = aliasValue;
			return aliasValue;
		}
	}
};
var __mfSharedCacheListenersKey = Symbol.for("module-federation.shared-cache-listeners");
var __mfGetSharedCacheListeners = (cache) => {
	let listeners = cache[__mfSharedCacheListenersKey];
	if (listeners === void 0) {
		listeners = Object.create(null);
		Object.defineProperty(cache, __mfSharedCacheListenersKey, {
			value: listeners,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}
	return listeners;
};
var __mfSubscribeSharedCache = (cache, descriptor, listener) => {
	const listeners = __mfGetSharedCacheListeners(cache);
	(listeners[descriptor.canonical] ||= /* @__PURE__ */ new Set()).add(listener);
};
var __mfSharedCacheOwnersKey = Symbol.for("module-federation.shared-cache-owners");
var __mfGetSharedCacheOwners = (cache) => {
	let owners = cache[__mfSharedCacheOwnersKey];
	if (owners === void 0) {
		owners = Object.create(null);
		Object.defineProperty(cache, __mfSharedCacheOwnersKey, {
			value: owners,
			enumerable: false,
			configurable: false,
			writable: false
		});
	}
	return owners;
};
var __mfGetSharedModuleIdentity = (value) => {
	const candidates = [value, value?.default];
	for (const candidate of candidates) {
		if (!candidate || typeof candidate !== "object") continue;
		for (const key of [
			"__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
			"__TEST_INTERNALS",
			"__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED"
		]) {
			const internals = candidate[key];
			if (internals && typeof internals === "object") return { internals };
		}
		if (typeof candidate.useState === "function") return { hook: candidate.useState };
	}
};
var __mfIsSameSharedModule = (current, next) => {
	if (current === next) return true;
	const currentIdentity = __mfGetSharedModuleIdentity(current);
	const nextIdentity = __mfGetSharedModuleIdentity(next);
	if (!currentIdentity || !nextIdentity) return false;
	const currentInternals = currentIdentity.internals;
	const nextInternals = nextIdentity.internals;
	if (currentInternals !== void 0 || nextInternals !== void 0) return currentInternals !== void 0 && currentInternals === nextInternals;
	return typeof currentIdentity.hook === "function" && currentIdentity.hook === nextIdentity.hook;
};
var __mfWriteSharedCache = (cache, descriptor, value, owner) => {
	const current = __mfReadSharedCache(cache, descriptor);
	if (current !== void 0 && __mfIsSameSharedModule(current, value)) return value;
	cache[descriptor.canonical] = value;
	const aliases = descriptor.aliases || [];
	for (const alias of aliases) Object.defineProperty(cache, alias, {
		value,
		enumerable: true,
		configurable: true,
		writable: true
	});
	const owners = cache[__mfSharedCacheOwnersKey];
	if (owner === void 0) {
		if (owners) delete owners[descriptor.canonical];
	} else __mfGetSharedCacheOwners(cache)[descriptor.canonical] = owner;
	const listeners = cache[__mfSharedCacheListenersKey]?.[descriptor.canonical];
	if (listeners) for (const listener of listeners) listener(value);
	return value;
};
var __mfNormalizeShareModule = (mod) => {
	const normalized = (() => {
		let current = mod;
		for (let i = 0; i < 5; i++) {
			const defaultExport = current?.default;
			if (!defaultExport || typeof defaultExport !== "object") break;
			const namedValues = Object.keys(current).filter((key) => key !== "default").map((key) => current[key]);
			if (namedValues.length > 0 && namedValues.some((value) => value !== void 0)) break;
			current = defaultExport;
		}
		return current;
	})();
	return normalized && Object.getPrototypeOf(normalized) === null ? Object.assign({}, normalized) : normalized;
};
var __mfInitializedLocalShare = (mod) => {
	if (mod === void 0) return void 0;
	try {
		return __mfNormalizeShareModule(mod);
	} catch (error) {
		if (error instanceof ReferenceError) return void 0;
		throw error;
	}
};
var exportModule = __mfReadSharedCache(__mfModuleCache.share, {
	"canonical": "default:react",
	"aliases": ["react"]
});
if (exportModule === void 0) {
	Promise.resolve().then(() => {
		if (__mfReadSharedCache(__mfModuleCache.share, {
			"canonical": "default:react",
			"aliases": ["react"]
		}) !== void 0) return;
		const localShare = __mfInitializedLocalShare(_virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__prebuild__react__prebuild___exports);
		if (localShare !== void 0) __mfWriteSharedCache(__mfModuleCache.share, {
			"canonical": "default:react",
			"aliases": ["react"]
		}, localShare, "mf_platform_1_3_1_e25c8d049944");
	});
	exportModule = _virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__prebuild__react__prebuild___exports;
}
var __mf_default;
var __mf_0;
var __mf_1;
var __mf_2;
var __mf_3;
var __mf_4;
var __mf_5;
var __mf_6;
var __mf_7;
var __mf_8;
var __mf_9;
var __mf_10;
var __mf_11;
var __mf_12;
var __mf_13;
var __mf_14;
var __mf_15;
var __mf_16;
var __mf_17;
var __mf_18;
var __mf_19;
var __mf_20;
var __mf_21;
var __mf_22;
var __mf_23;
var __mf_24;
var __mf_25;
var __mf_26;
var __mf_27;
var __mf_28;
var __mf_29;
var __mf_30;
var __mf_31;
var __mf_32;
var __mf_33;
var __mf_34;
var __mf_35;
var __mf_36;
var __mf_37;
var __mf_38;
var __mf_39;
var __mf_40;
var __mf_41;
var __mf_42;
var __mf_43;
var __mfApplyEagerShareExports = (mod) => {
	__mf_0 = mod["Activity"];
	__mf_1 = mod["Children"];
	__mf_2 = mod["Component"];
	__mf_3 = mod["Fragment"];
	__mf_4 = mod["Profiler"];
	__mf_5 = mod["PureComponent"];
	__mf_6 = mod["StrictMode"];
	__mf_7 = mod["Suspense"];
	__mf_8 = mod["ViewTransition"];
	__mf_9 = mod["__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE"];
	__mf_10 = mod["__COMPILER_RUNTIME"];
	__mf_11 = mod["addTransitionType"];
	__mf_12 = mod["cache"];
	__mf_13 = mod["cacheSignal"];
	__mf_14 = mod["cloneElement"];
	__mf_15 = mod["createContext"];
	__mf_16 = mod["createElement"];
	__mf_17 = mod["createRef"];
	__mf_18 = mod["forwardRef"];
	__mf_19 = mod["isValidElement"];
	__mf_20 = mod["lazy"];
	__mf_21 = mod["memo"];
	__mf_22 = mod["startTransition"];
	__mf_23 = mod["unstable_useCacheRefresh"];
	__mf_24 = mod["use"];
	__mf_25 = mod["useActionState"];
	__mf_26 = mod["useCallback"];
	__mf_27 = mod["useContext"];
	__mf_28 = mod["useDebugValue"];
	__mf_29 = mod["useDeferredValue"];
	__mf_30 = mod["useEffect"];
	__mf_31 = mod["useEffectEvent"];
	__mf_32 = mod["useId"];
	__mf_33 = mod["useImperativeHandle"];
	__mf_34 = mod["useInsertionEffect"];
	__mf_35 = mod["useLayoutEffect"];
	__mf_36 = mod["useMemo"];
	__mf_37 = mod["useOptimistic"];
	__mf_38 = mod["useReducer"];
	__mf_39 = mod["useRef"];
	__mf_40 = mod["useState"];
	__mf_41 = mod["useSyncExternalStore"];
	__mf_42 = mod["useTransition"];
	__mf_43 = mod["version"];
	__mf_default = mod.default ?? mod;
};
var __mfApplyEagerShareExportsWhenReady = (mod) => {
	if (mod === void 0) return;
	try {
		__mfApplyEagerShareExports(mod);
	} catch (error) {
		if (!(error instanceof ReferenceError)) throw error;
	}
};
__mfSubscribeSharedCache(__mfModuleCache.share, {
	"canonical": "default:react",
	"aliases": ["react"]
}, __mfApplyEagerShareExports);
__mfApplyEagerShareExportsWhenReady(exportModule);
var __moduleExports = exportModule;
export { __mf_32 as a, __mf_40 as c, _virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__prebuild__react__prebuild___exports as d, require_react as f, __mf_30 as i, __mf_default as l, __mf_26 as n, __mf_35 as o, __mf_27 as r, __mf_36 as s, __mf_15 as t, _virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__loadShare__react__loadShare___exports as u };

//# sourceMappingURL=_virtual_mf___mfe_internal__mf_platform_1_3_1_e25c8d049944__mf_owner__242075772864893__loadShare__react__loadShare__.js-B3vX5iHX.js.map