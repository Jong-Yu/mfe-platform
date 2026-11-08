"use strict";
(self["webpackChunkadmin_1_3_0_9f16db563744"] = self["webpackChunkadmin_1_3_0_9f16db563744"] || []).push([["src_bootstrap_jsx"],{

/***/ "./src/AdminApp.jsx"
/*!**************************!*\
  !*** ./src/AdminApp.jsx ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AdminApp)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./model */ "./src/model.js");
/* harmony import */ var _LifecyclePanel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./LifecyclePanel */ "./src/LifecyclePanel.jsx");
/* harmony import */ var _ServiceMenus__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ServiceMenus */ "./src/ServiceMenus.jsx");
/* harmony import */ var _DashboardEditor__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./DashboardEditor */ "./src/DashboardEditor.jsx");





const currentView = () => location.hash === '#lifecycle' ? 'lifecycle' : location.hash === '#dashboard' ? 'dashboard' : location.hash === '#services' ? 'services' : 'composition';
async function request(path, body, csrfToken, signal) {
  const response = await fetch(`/api/admin/${path}`, {
    signal,
    cache: 'no-store',
    ...(body ? {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MFE-CSRF': csrfToken
      },
      body: JSON.stringify(body)
    } : {})
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || '요청을 처리하지 못했습니다.'), {
    code: data.code
  });
  return data;
}
const serviceNames = {
  A: 'OTA 서비스',
  C: '정비 서비스'
};
function ArtifactLabel({
  artifact
}) {
  return artifact ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "artifact-label"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, artifact.version), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    title: artifact.id
  }, (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(artifact.id))) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "muted"
  }, "\uC120\uD0DD \uD544\uC694");
}
function CurrentGraph({
  composition,
  catalog
}) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "surface current-surface",
    "aria-labelledby": "current-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "section-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "eyebrow"
  }, "LIVE COMPOSITION"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", {
    id: "current-heading"
  }, "\uD604\uC7AC \uC801\uC6A9\uB41C \uC870\uD569")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "pill green"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("i", null), " \uC801\uC6A9 \uC911")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "sdk-rail"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "node-symbol"
  }, "\u25C8"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "muted small"
  }, "\uBAA8\uB4E0 \uACBD\uB85C\uC758 \uACF5\uD1B5 \uAE30\uBC18"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, "\uD50C\uB7AB\uD3FC SDK ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    "data-testid": "current-sdk"
  }, composition.platformVersion))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    title: composition.selected.platform
  }, (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(composition.selected.platform))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "current-paths"
  }, ['A', 'C'].map(role => {
    const {
      app,
      b,
      d
    } = (0,_model__WEBPACK_IMPORTED_MODULE_1__.pathFor)(composition, catalog, role);
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      key: role,
      className: `current-path path-${role.toLowerCase()}`,
      "data-testid": `current-path-${role}`
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      className: "path-service"
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
      className: "service-letter"
    }, role), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, serviceNames[role]), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, app?.version))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
      className: "connector",
      "aria-hidden": "true"
    }, "\u2192"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      className: "path-node"
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC11C\uBE44\uC2A4 B"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", {
      "data-testid": `current-b-${role}`
    }, b?.version || '—'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
      title: b?.id
    }, (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(b?.id))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
      className: "connector",
      "aria-hidden": "true"
    }, "\u2192"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      className: "path-node"
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC758\uC874 \uC11C\uBE44\uC2A4 D"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", {
      "data-testid": `current-d-${role}`
    }, d?.version || '—'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
      title: d?.id
    }, (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(d?.id))));
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("details", {
    className: "metadata"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("summary", null, "\uC870\uD569 \uC2DD\uBCC4\uC790\uC640 \uBC30\uD3EC \uC815\uBCF4"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("dl", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("dt", null, "\uC870\uD569"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("dd", {
    "data-testid": "active-composition"
  }, composition.compositionId), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("dt", null, "Shell"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("dd", null, composition.selected.shell), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("dt", null, "A / C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("dd", null, composition.selected.A, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), composition.selected.C))));
}
function VersionSelect({
  id,
  label,
  service,
  value,
  catalog,
  disabled,
  onChange,
  requirement
}) {
  const candidates = Object.values(catalog).filter(artifact => artifact.service === service && artifact.kind === 'remote' && (!['unregistered', 'deleting', 'deleted'].includes(artifact.selectionState) || artifact.id === value));
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "version-field"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: id
  }, label), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
    id: id,
    "data-testid": id,
    value: value || '',
    disabled: disabled,
    onChange: event => onChange(event.target.value)
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: ""
  }, "\uBC84\uC804\uC744 \uC120\uD0DD\uD558\uC138\uC694"), candidates.map(artifact => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: artifact.id,
    key: artifact.id,
    disabled: artifact.selectionState && artifact.selectionState !== 'available'
  }, artifact.version, " \xB7 ", (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(artifact.id), artifact.selectionState === 'ended' ? ' · 지원 종료' : ['unregistered', 'deleting', 'deleted'].includes(artifact.selectionState) ? ' · 등록 해제' : service === 'b' ? artifact.runtimeDependencies?.d ? ' · D 선택 가능' : ' · D 고정' : ''))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "field-hint"
  }, requirement ? `지원 범위 ${requirement}` : '선택 후 전체 조합의 호환성을 검사합니다.'));
}
function PathEditor({
  role,
  draft,
  catalog,
  disabled,
  onBinding
}) {
  const {
    app,
    b,
    d
  } = (0,_model__WEBPACK_IMPORTED_MODULE_1__.pathFor)(draft, catalog, role);
  const canSelectB = Boolean(app?.runtimeDependencies?.b);
  const canSelectD = Boolean(b?.runtimeDependencies?.d);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: `path-editor path-${role.toLowerCase()}`,
    "aria-label": `${role} 경로 버전 선택`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "path-editor-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "service-letter"
  }, role), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, serviceNames[role]), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, role, " \u2192 B \u2192 D"))), canSelectB ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(VersionSelect, {
    id: `select-b-${role}`,
    label: "\uC0AC\uC6A9\uD560 B \uBC84\uC804",
    service: "b",
    value: b?.id,
    catalog: catalog,
    disabled: disabled,
    requirement: app.runtimeDependencies.b.requires,
    onChange: value => onBinding(app.id, 'b', value)
  }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "fixed-version"
  }, "B ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ArtifactLabel, {
    artifact: b
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC774 \uBC30\uD3EC\uBB3C\uC758 B \uC5F0\uACB0\uC740 \uBE4C\uB4DC\uC5D0 \uACE0\uC815\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "dependency-line",
    "aria-hidden": "true"
  }, "\u2193 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC120\uD0DD\uD55C B\uAC00 \uC0AC\uC6A9")), canSelectD ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(VersionSelect, {
    id: `select-d-${role}`,
    label: "B\uAC00 \uC0AC\uC6A9\uD560 D \uBC84\uC804",
    service: "d",
    value: d?.id,
    catalog: catalog,
    disabled: disabled,
    requirement: b.runtimeDependencies.d.requires,
    onChange: value => onBinding(b.id, 'd', value)
  }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "fixed-version"
  }, "D ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ArtifactLabel, {
    artifact: d
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, b ? '이 B의 D 연결은 빌드에 고정되어 있습니다.' : 'B를 선택하면 D를 지정할 수 있습니다.')));
}
function History({
  items,
  busy,
  rollbackTo,
  onSelect
}) {
  const [query, setQuery] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [all, setAll] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const filtered = items.filter(item => `${item.id} ${item.platformVersion} ${item.paths.map(p => `${p.b} ${p.d}`).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const shown = all || query ? filtered : filtered.slice(0, 6);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    id: "history",
    className: "surface history-surface",
    "aria-labelledby": "history-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "section-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "eyebrow"
  }, "SAVED COMPOSITIONS"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", {
    id: "history-heading"
  }, "\uC774\uC804 \uC870\uD569\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "muted"
  }, "\uC870\uD569\uC744 \uBD88\uB7EC\uC628 \uB4A4 \uBCC0\uACBD \uB0B4\uC5ED\uC744 \uD655\uC778\uD558\uACE0 \uB864\uBC31\uD569\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    className: "search"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "sr-only"
  }, "\uC870\uD569 \uC774\uB825 \uAC80\uC0C9"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    type: "search",
    placeholder: "\uBC84\uC804 \uB610\uB294 \uC870\uD569 \uAC80\uC0C9",
    value: query,
    onChange: event => setQuery(event.target.value)
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "history-list"
  }, shown.map(item => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("article", {
    key: item.id,
    className: `history-row ${item.active ? 'is-current' : ''}`,
    "data-testid": `history-${item.id}`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "history-marker",
    "aria-hidden": "true"
  }, item.active ? '●' : '◷'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "history-info"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "history-title"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, "SDK ", item.platformVersion), item.active ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "pill green"
  }, "\uD604\uC7AC \uC870\uD569") : null, rollbackTo === item.id ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "pill blue"
  }, "\uB864\uBC31 \uC900\uBE44") : null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, item.paths.map(p => `${p.role} → B ${p.b} → D ${p.d}`).join('　 /　 '), " \xB7 \uB4F1\uB85D \uBA54\uB274 ", item.menuCount || 0, "\uAC1C \xB7 \uC704\uC82F ", item.widgetCount || 0, "\uAC1C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "history-date"
  }, "\uCD5C\uCD08 \uC800\uC7A5 ", new Date(item.createdAt).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }), " \xB7 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    title: item.id
  }, (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(item.id))), !item.valid ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "history-reason"
  }, item.reason) : null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "button secondary compact",
    disabled: busy || item.active || !item.valid,
    onClick: () => onSelect(item.id)
  }, item.active ? '적용 중' : item.valid ? '불러오기' : '적용 불가')))), !shown.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "empty"
  }, "\uC77C\uCE58\uD558\uB294 \uC870\uD569\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.") : null, !all && !query && filtered.length > 6 ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "text-button",
    onClick: () => setAll(true)
  }, "\uC800\uC7A5\uB41C \uC870\uD569 ", filtered.length, "\uAC1C \uBAA8\uB450 \uBCF4\uAE30 \u2193") : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "footnote"
  }, "\uD45C\uC2DC\uB41C \uC2DC\uAC04\uC740 \uC870\uD569 \uD30C\uC77C\uC758 \uCD5C\uCD08 \uC800\uC7A5 \uC2DC\uAC01\uC785\uB2C8\uB2E4. \uAD6C\uBC84\uC804 \uBC30\uD3EC \uD30C\uC77C\uC740 \uB864\uBC31 \uD6C4\uC5D0\uB3C4 \uBCF4\uC874\uB429\uB2C8\uB2E4."));
}
function AdminApp() {
  const [view, setView] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(currentView);
  const [data, setData] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [draft, setDraft] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [review, setReview] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [rollbackTo, setRollbackTo] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [busy, setBusy] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('load');
  const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [notice, setNotice] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const editor = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const change = () => setView(currentView());
    addEventListener('hashchange', change);
    return () => removeEventListener('hashchange', change);
  }, []);
  function acceptState(next) {
    setData(next);
    setDraft(next.current ? (0,_model__WEBPACK_IMPORTED_MODULE_1__.makeDraft)(next.current) : null);
    setReview(null);
    setRollbackTo(null);
  }
  ;(0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const controller = new AbortController();
    request('state', null, null, controller.signal).then(acceptState).catch(cause => {
      if (cause.name !== 'AbortError') setError(cause.message);
    }).finally(() => {
      if (!controller.signal.aborted) setBusy('');
    });
    return () => controller.abort();
  }, []);
  const catalog = Object.fromEntries((data?.catalog || []).map(artifact => [artifact.id, artifact]));
  const changes = data?.current && draft ? (0,_model__WEBPACK_IMPORTED_MODULE_1__.changesBetween)(data.current, draft, catalog) : [];
  async function refreshManagementMetadata() {
    const next = await request('state');
    setData(previous => ({
      ...previous,
      catalog: next.catalog,
      history: next.history
    }));
    setReview(null);
  }
  async function reload() {
    setBusy('load');
    setError('');
    setNotice('');
    try {
      acceptState(await request('state'));
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy('');
    }
  }
  function edit(change) {
    setDraft(change);
    setReview(null);
    setError('');
    setNotice('');
  }
  function bind(owner, alias, target) {
    edit({
      ...draft,
      runtimeBindings: {
        ...draft.runtimeBindings,
        [owner]: {
          ...draft.runtimeBindings[owner],
          [alias]: target
        }
      }
    });
  }
  async function inspect() {
    setBusy('preview');
    setError('');
    setNotice('');
    setReview(null);
    try {
      const payload = (0,_model__WEBPACK_IMPORTED_MODULE_1__.payloadFor)(data.current, draft, catalog, rollbackTo);
      const result = await request('preview', payload, data.csrfToken);
      setReview({
        ...result,
        payload
      });
      setNotice(result.unchanged ? '현재 적용된 조합과 같습니다.' : '선언된 버전 범위와 모든 의존 관계를 확인했습니다. 아래 변경 내역을 적용할 수 있습니다.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy('');
    }
  }
  async function apply() {
    if (!review || review.unchanged) return;
    setBusy('apply');
    setError('');
    setNotice('');
    let applied = false;
    try {
      const result = await request('apply', {
        ...review.payload,
        previewedCompositionId: review.composition.compositionId
      }, data.csrfToken);
      applied = true;
      setData(previous => ({
        ...previous,
        current: result.composition
      }));
      setDraft((0,_model__WEBPACK_IMPORTED_MODULE_1__.makeDraft)(result.composition));
      setReview(null);
      setRollbackTo(null);
      acceptState(await request('state'));
      setNotice('조합을 적용했습니다. 새로 열린 화면부터 사용하며, 이미 열린 화면은 기존 조합을 유지합니다.');
    } catch (cause) {
      setReview(null);
      setError(`${applied ? '조합은 적용됐지만 목록을 갱신하지 못했습니다. ' : ''}${cause.message}`);
    } finally {
      setBusy('');
    }
  }
  async function chooseHistory(id) {
    setBusy('history');
    setError('');
    setNotice('');
    setReview(null);
    try {
      const snapshot = await request(`compositions/${id}`);
      setDraft((0,_model__WEBPACK_IMPORTED_MODULE_1__.makeDraft)(snapshot));
      setRollbackTo(id);
      editor.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy('');
    }
  }
  const locked = Boolean(busy || rollbackTo);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "admin-shell"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("aside", {
    className: "sidebar"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    className: "brand",
    href: "/admin"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "brand-icon"
  }, "M"), "Platform Lab"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "nav-label"
  }, "WORKSPACE"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("nav", {
    "aria-label": "\uC8FC \uBA54\uB274"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "/subscriptions",
    className: "nav-item"
  }, "\uC0AC\uC6A9\uC790\uBCC4 \uAD6C\uB3C5"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "/",
    className: "nav-item"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    "aria-hidden": "true"
  }, "\u25EB"), "\uC11C\uBE44\uC2A4 \uD654\uBA74"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "/admin",
    className: "nav-item active",
    "aria-current": "page"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    "aria-hidden": "true"
  }, "\u25A4"), "\uBC30\uD3EC \uC870\uD569 \uAD00\uB9AC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "/guide",
    className: "nav-item"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    "aria-hidden": "true"
  }, "\u25A7"), "\uAD6C\uC870\uC640 \uC0AC\uC6A9 \uC124\uBA85\uC11C")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "sidebar-foot"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "live-dot"
  }), " LOCAL ENVIRONMENT", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uB3C5\uB9BD \uBC30\uD3EC \xB7 \uB7F0\uD0C0\uC784 \uC120\uD0DD"))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "workspace"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uD50C\uB7AB\uD3FC ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "slash"
  }, "/"), " \uBC30\uD3EC \uAD00\uB9AC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "environment"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("i", null), " \uB85C\uCEEC \uC800\uC7A5\uC18C")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("main", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "page-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "eyebrow"
  }, "RELEASE CONTROL"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", null, "\uBC84\uC804\uACFC \uC758\uC874 \uAD00\uACC4"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uBC30\uD3EC\uB41C \uBC84\uC804\uC744 \uC870\uD569\uD558\uACE0, \uC11C\uBE44\uC2A4 \uC7AC\uBE4C\uB4DC \uC5C6\uC774 \uC801\uC6A9\uD558\uC138\uC694.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "heading-actions"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "button secondary",
    onClick: reload,
    disabled: Boolean(busy)
  }, "\u21BB \uCD5C\uC2E0 \uC870\uD569 \uBD88\uB7EC\uC624\uAE30"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    className: "button secondary",
    href: "/",
    target: "_blank",
    rel: "noreferrer"
  }, "\uC11C\uBE44\uC2A4 \uD654\uBA74 \u2197"))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("nav", {
    className: "management-tabs",
    "aria-label": "\uAD00\uB9AC \uAE30\uB2A5"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "#composition",
    "aria-current": view === 'composition' ? 'page' : undefined
  }, "\uC870\uD569 \uAD00\uB9AC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "#services",
    "aria-current": view === 'services' ? 'page' : undefined
  }, "\uC11C\uBE44\uC2A4 \xB7 \uBA54\uB274"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "#dashboard",
    "aria-current": view === 'dashboard' ? 'page' : undefined
  }, "\uB300\uC2DC\uBCF4\uB4DC \uC704\uC82F"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "#lifecycle",
    "aria-current": view === 'lifecycle' ? 'page' : undefined
  }, "\uC0AC\uC6A9 \uD604\uD669 \xB7 \uC9C0\uC6D0 \uC885\uB8CC")), error && !data?.current ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "alert error",
    role: "alert",
    "data-testid": "admin-error"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, "\uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, error)) : null, !data ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "surface loading",
    role: "status"
  }, busy ? '배포 정보를 불러오고 있습니다…' : '배포 정보를 불러오지 못했습니다. 최신 조합 불러오기를 눌러 주세요.') : !data.current ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "surface empty"
  }, "\uD65C\uC131\uD654\uB41C \uC11C\uBE44\uC2A4 \uC870\uD569\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uCD08\uAE30 \uC870\uD569\uC744 \uBA3C\uC800 \uC900\uBE44\uD574 \uC8FC\uC138\uC694.") : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, view === 'lifecycle' ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_LifecyclePanel__WEBPACK_IMPORTED_MODULE_2__["default"], {
    request: request,
    csrfToken: data.csrfToken,
    onChanged: refreshManagementMetadata
  }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(CurrentGraph, {
    composition: data.current,
    catalog: catalog
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "surface editor-surface",
    ref: editor,
    "aria-labelledby": "editor-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "section-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "eyebrow"
  }, rollbackTo ? 'RESTORE COMPOSITION' : 'EDIT COMPOSITION'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", {
    id: "editor-heading"
  }, rollbackTo ? '이전 조합 검토' : '사용할 버전 선택'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "muted"
  }, rollbackTo ? '저장된 SDK·서비스·의존 관계를 함께 복원합니다.' : '아직 서비스에 적용되지 않았습니다. 선택 후 조합을 검사하세요.')), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: `pill ${changes.length ? 'amber' : ''}`
  }, changes.length ? `변경 ${changes.length}개` : '현재 조합과 동일')), view === 'composition' ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "sdk-editor"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "node-symbol"
  }, "\u25C8"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uACF5\uD1B5 \uD50C\uB7AB\uD3FC SDK"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uB450 \uACBD\uB85C\uAC00 \uB3D9\uC77C\uD55C SDK\uB97C \uACF5\uC720\uD569\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(VersionSelect, {
    id: "select-sdk",
    label: "\uC0AC\uC6A9\uD560 SDK \uBC84\uC804",
    service: "platform",
    catalog: catalog,
    value: draft.selected.platform,
    disabled: locked,
    onChange: value => edit({
      ...draft,
      selected: {
        ...draft.selected,
        platform: value
      }
    })
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "edit-paths"
  }, ['A', 'C'].map(role => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(PathEditor, {
    key: role,
    role: role,
    draft: draft,
    catalog: catalog,
    disabled: locked,
    onBinding: bind
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "footnote"
  }, "\uAC19\uC740 B \uBC30\uD3EC\uBB3C\uC744 \uC0AC\uC6A9\uD558\uB294 \uACBD\uB85C\uB294 D \uC120\uD0DD\uB3C4 \uACF5\uC720\uD569\uB2C8\uB2E4. \uAC19\uC740 \uBC84\uC804\uC758 \uBC30\uD3EC\uBB3C\uC740 \uB4A4\uC758 \uC2DD\uBCC4\uC790\uB85C \uAD6C\uBD84\uD569\uB2C8\uB2E4.")) : view === 'dashboard' ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_DashboardEditor__WEBPACK_IMPORTED_MODULE_4__["default"], {
    draft: draft,
    current: data.current,
    catalog: catalog,
    disabled: locked,
    onBinding: bind,
    onChange: dashboard => edit({
      ...draft,
      dashboard
    })
  }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ServiceMenus__WEBPACK_IMPORTED_MODULE_3__["default"], {
    draft: draft,
    current: data.current,
    catalog: catalog,
    disabled: locked,
    onBinding: bind,
    onChange: navigation => edit({
      ...draft,
      navigation
    })
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "review-panel"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "review-title"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uC801\uC6A9\uD560 \uBCC0\uACBD \uB0B4\uC5ED"), review && !review.unchanged ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "pill green",
    "data-testid": "preview-valid"
  }, "\uAC80\uC0AC \uD1B5\uACFC") : null), changes.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "changes"
  }, changes.map(change => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: change.label
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, change.label), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, change.textFrom ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, change.textFrom) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ArtifactLabel, {
    artifact: change.from
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "change-arrow",
    "aria-hidden": "true"
  }, "\u2192"), change.textTo ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, change.textTo) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ArtifactLabel, {
    artifact: change.to
  }))))) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "muted"
  }, "\uBC84\uC804\uC744 \uC120\uD0DD\uD558\uBA74 \uD604\uC7AC \uC870\uD569\uACFC\uC758 \uCC28\uC774\uB97C \uBCF4\uC5EC\uC90D\uB2C8\uB2E4."), rollbackTo ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "footnote"
  }, "\uBCF5\uC6D0 \uB300\uC0C1 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", null, rollbackTo)) : null, error ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "alert error",
    role: "alert",
    "data-testid": "admin-error"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, "\uBCC0\uACBD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, error)) : null, notice ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "alert success",
    role: "status",
    "data-testid": "admin-notice"
  }, notice) : null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "apply-bar"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, "\uC0C8\uB85C \uC5F4\uB9B0 \uD654\uBA74\uBD80\uD130 \uC801\uC6A9"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC5F4\uB824 \uC788\uB294 \uD654\uBA74\uC740 \uCC98\uC74C \uBC1B\uC740 \uC870\uD569\uC744 \uACC4\uC18D \uC0AC\uC6A9\uD569\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "apply-actions"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "text-button",
    disabled: Boolean(busy),
    onClick: () => {
      setDraft((0,_model__WEBPACK_IMPORTED_MODULE_1__.makeDraft)(data.current));
      setRollbackTo(null);
      setReview(null);
      setError('');
      setNotice('');
    }
  }, "\uC120\uD0DD \uCD08\uAE30\uD654"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "button secondary",
    "data-testid": "preview",
    disabled: Boolean(busy) || changes.length === 0,
    onClick: inspect
  }, busy === 'preview' ? '검사 중…' : '조합 검사'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "button primary",
    "data-testid": "apply",
    disabled: Boolean(busy) || !review || review.unchanged,
    onClick: apply
  }, busy === 'apply' ? '적용 중…' : rollbackTo ? '이 조합으로 롤백' : '변경 적용'))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "footnote"
  }, "\uAC80\uC0AC\uB294 \uC120\uC5B8\uB41C \uC9C0\uC6D0 \uBC94\uC704\xB7\uC758\uC874\uC131\xB7React \uC870\uAC74\uC744 \uD655\uC778\uD569\uB2C8\uB2E4. \uACF5\uAC1C API \uB3D9\uC791\uC758 \uD638\uD658\uC131\uC740 \uBC30\uD3EC \uC804 \uAC80\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(History, {
    items: data.history,
    busy: Boolean(busy),
    rollbackTo: rollbackTo,
    onSelect: chooseHistory
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("footer", null, "Platform Lab \xB7 \uB85C\uCEEC \uBC30\uD3EC \uC870\uD569 \uAD00\uB9AC ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "/guide"
  }, "\uC0AC\uC6A9 \uBC29\uBC95\uACFC \uAC80\uC99D \uBC94\uC704 \u2197")))));
}

/***/ },

/***/ "./src/DashboardEditor.jsx"
/*!*********************************!*\
  !*** ./src/DashboardEditor.jsx ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ DashboardEditor)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./model */ "./src/model.js");
/* harmony import */ var _ServiceMenus__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ServiceMenus */ "./src/ServiceMenus.jsx");



function DashboardEditor({
  draft,
  catalog,
  current,
  disabled,
  onChange,
  onBinding
}) {
  const placements = draft.dashboard || [];
  const locked = disabled || current.shell.dashboardProtocol !== 'registered-dashboard-v1';
  const candidates = Object.values(catalog).filter(artifact => artifact.widgets?.length && artifact.kind === 'remote' && !['platform', 'admin'].includes(artifact.service));
  const update = (index, change) => onChange(placements.map((item, i) => i === index ? {
    ...item,
    ...change
  } : item));
  function add() {
    let n = 1;
    while (placements.some(item => item.id === `widget-${n}`)) n++;
    onChange([...placements, {
      id: `widget-${n}`,
      title: '새 위젯',
      artifactId: '',
      widgetId: '',
      span: 1
    }]);
  }
  function move(index, offset) {
    const next = [...placements];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "dashboard-editor",
    "aria-labelledby": "dashboard-editor-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", {
    id: "dashboard-editor-heading"
  }, "\uACF5\uAC1C \uC704\uC82F \uC120\uD0DD\uACFC \uBC30\uCE58"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "muted"
  }, "\uC11C\uBE44\uC2A4\uAC00 \uB300\uC2DC\uBCF4\uB4DC\uC6A9\uC73C\uB85C \uACF5\uAC1C\uD55C \uC704\uC82F\uC744 \uC120\uD0DD\uD558\uC138\uC694. \uC704\uC5D0\uC11C \uC544\uB798 \uC21C\uC11C\uB85C, \uD55C \uC904\uC5D0 2\uCE78\uC529 \uBC30\uCE58\uD569\uB2C8\uB2E4. \uBAA8\uBC14\uC77C\uC5D0\uC11C\uB294 \uD55C \uC904\uC5D0 \uD558\uB098\uC529 \uD45C\uC2DC\uD569\uB2C8\uB2E4."), current.shell.dashboardProtocol !== 'registered-dashboard-v1' ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "status"
  }, "\uB4F1\uB85D\uD615 \uB300\uC2DC\uBCF4\uB4DC\uB97C \uC9C0\uC6D0\uD558\uB294 Shell\uB85C \uCD5C\uCD08 \uD55C \uBC88 \uC804\uD658\uD574\uC57C \uD569\uB2C8\uB2E4.") : null, !candidates.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "status"
  }, "\uACF5\uAC1C\uB41C \uC704\uC82F\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC11C\uBE44\uC2A4 \uD300\uC774 widgets \uBAA9\uB85D\uC744 \uC120\uC5B8\uD574 \uBE4C\uB4DC\xB7\uBC1C\uD589\uD558\uBA74 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4.") : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "dashboard-preview",
    "aria-label": "\uBC30\uCE58 \uBBF8\uB9AC\uBCF4\uAE30",
    "data-testid": "dashboard-preview"
  }, placements.map((item, index) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    key: index,
    className: `preview-tile preview-span-${item.span}`,
    "data-testid": `preview-tile-${index}`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, index + 1, ". ", item.title), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, catalog[item.artifactId]?.service.toUpperCase() || '서비스 미선택', " \xB7 ", item.span === 2 ? '전체 너비' : '절반 너비'))), !placements.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uBC30\uCE58\uD55C \uC704\uC82F\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.") : null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "field-hint"
  }, "\uBBF8\uB9AC\uBCF4\uAE30\uB294 \uBC30\uCE58 \uBAA8\uC591\uB9CC \uBCF4\uC5EC\uC90D\uB2C8\uB2E4. \uAD00\uB9AC \uD654\uBA74\uC5D0\uC11C\uB294 \uC11C\uBE44\uC2A4 \uCF54\uB4DC\uB97C \uC2E4\uD589\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), placements.map((item, index) => {
    const artifact = catalog[item.artifactId];
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("fieldset", {
      className: "menu-card",
      key: index,
      disabled: locked,
      "data-testid": `dashboard-row-${index}`
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("legend", null, "\uC704\uC82F ", index + 1), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      className: "menu-fields"
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uBC30\uCE58 ID", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
      "data-testid": `dashboard-id-${index}`,
      value: item.id,
      maxLength: 40,
      onChange: event => update(index, {
        id: event.target.value
      })
    })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uD45C\uC2DC \uC81C\uBAA9", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
      "data-testid": `dashboard-title-${index}`,
      value: item.title,
      maxLength: 60,
      onChange: event => update(index, {
        title: event.target.value
      })
    })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uC11C\uBE44\uC2A4\uC640 \uBC30\uD3EC \uBC84\uC804", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
      "data-testid": `dashboard-artifact-${index}`,
      value: item.artifactId,
      onChange: event => update(index, {
        artifactId: event.target.value,
        widgetId: ''
      })
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
      value: ""
    }, "\uC11C\uBE44\uC2A4\uB97C \uC120\uD0DD\uD558\uC138\uC694"), candidates.map(value => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
      key: value.id,
      value: value.id,
      disabled: value.selectionState !== 'available'
    }, value.service.toUpperCase(), " ", value.version, " \xB7 ", (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(value.id), value.selectionState !== 'available' ? ' · 선택 불가' : '')))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uACF5\uAC1C \uC704\uC82F", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
      "data-testid": `dashboard-widget-${index}`,
      value: item.widgetId,
      onChange: event => {
        const widget = artifact?.widgets.find(value => value.id === event.target.value);
        update(index, {
          widgetId: event.target.value,
          ...(item.title === '새 위젯' && widget ? {
            title: widget.title
          } : {})
        });
      }
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
      value: ""
    }, "\uACF5\uAC1C \uC704\uC82F\uC744 \uC120\uD0DD\uD558\uC138\uC694"), (artifact?.widgets || []).map(widget => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
      key: widget.id,
      value: widget.id
    }, widget.title, " \xB7 ", widget.id)))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uB108\uBE44", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
      "data-testid": `dashboard-span-${index}`,
      value: item.span,
      onChange: event => update(index, {
        span: Number(event.target.value)
      })
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
      value: 1
    }, "\uC808\uBC18 \uB108\uBE44 \xB7 1\uCE78"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
      value: 2
    }, "\uC804\uCCB4 \uB108\uBE44 \xB7 2\uCE78")))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_ServiceMenus__WEBPACK_IMPORTED_MODULE_2__.DependencyFields, {
      artifact: artifact,
      catalog: catalog,
      bindings: draft.runtimeBindings,
      onBinding: onBinding,
      disabled: locked
    }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      className: "menu-actions"
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
      type: "button",
      className: "button secondary compact",
      "data-testid": `dashboard-up-${index}`,
      disabled: locked || index === 0,
      onClick: () => move(index, -1)
    }, "\uC704\uB85C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
      type: "button",
      className: "button secondary compact",
      "data-testid": `dashboard-down-${index}`,
      disabled: locked || index === placements.length - 1,
      onClick: () => move(index, 1)
    }, "\uC544\uB798\uB85C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
      type: "button",
      className: "button secondary compact",
      "data-testid": `dashboard-remove-${index}`,
      onClick: () => onChange(placements.filter((_, i) => i !== index))
    }, "\uC704\uC82F \uC81C\uAC70")));
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "menu-actions"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "button secondary",
    "data-testid": "add-dashboard-widget",
    disabled: locked || placements.length >= 24,
    onClick: add
  }, "\uC704\uC82F \uCD94\uAC00"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "button secondary",
    "data-testid": "clear-dashboard",
    disabled: locked || !placements.length && draft.dashboard !== undefined,
    onClick: () => onChange([])
  }, "\uBE48 \uB300\uC2DC\uBCF4\uB4DC\uB85C \uC124\uC815")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "footnote"
  }, "\uAC19\uC740 \uC704\uC82F\uB3C4 \uB2E4\uB978 \uBC30\uCE58 ID\uB85C \uC5EC\uB7EC \uBC88 \uCD94\uAC00\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uBC30\uCE58 ID\uB294 \uC0C1\uD0DC\uB97C \uAD6C\uBD84\uD558\uBBC0\uB85C \uC81C\uBAA9\xB7\uC21C\uC11C\uB9CC \uBC14\uAFC0 \uB54C\uB294 \uC720\uC9C0\uD558\uC138\uC694. \uAC19\uC740 \uBC30\uD3EC\uBB3C\uC758 \uD558\uC704 \uBC84\uC804 \uC120\uD0DD\uC740 \uBAA8\uB4E0 \uC0AC\uC6A9\uCC98\uAC00 \uACF5\uC720\uD569\uB2C8\uB2E4. \uC81C\uAC70\uD574\uB3C4 \uD30C\uC77C\uC744 \uC0AD\uC81C\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."));
}

/***/ },

/***/ "./src/LegacyControls.jsx"
/*!********************************!*\
  !*** ./src/LegacyControls.jsx ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ LegacyControls)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

const stamp = value => value ? new Date(value).toLocaleString('ko-KR', {
  timeZone: 'Asia/Seoul'
}) : '없음';
function LegacyControls({
  release,
  compositionId,
  request,
  csrfToken,
  onSaved
}) {
  const [prepared, setPrepared] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    [confirmation, setConfirmation] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [reason, setReason] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [ack, setAck] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    [external, setExternal] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [busy, setBusy] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [notice, setNotice] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [bridge, setBridge] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  async function connect() {
    setBusy(true);
    setError('');
    try {
      if (!('serviceWorker' in navigator)) throw new Error('이 브라우저에서는 전환 중계를 사용할 수 없습니다. 수동으로 최신 화면을 열거나 버전 접근 종료 절차를 사용해 주세요.');
      const existing = await navigator.serviceWorker.getRegistration('/');
      const worker = existing?.active || existing?.waiting || existing?.installing;
      if (worker && new URL(worker.scriptURL).pathname !== '/transition-worker.js') throw new Error('이 출처에 다른 중계 기능이 등록되어 있습니다. 기존 기능을 덮어쓰지 않았습니다.');
      await navigator.serviceWorker.register('/transition-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      await navigator.serviceWorker.ready;
      setBridge('이 브라우저에 연결했습니다. 구형 탭의 다음 응답부터 중계가 확인됩니다. 다른 브라우저·프로필에는 별도 연결이 필요합니다.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  function prepare(type, session) {
    setPrepared({
      type,
      session,
      id: type === 'fence' ? release.artifact.id : session.id,
      revision: release.lifecycle.revision,
      compositionId,
      accessRevokedAt: release.lifecycle.accessRevokedAt
    });
    setConfirmation('');
    setReason('');
    setAck(false);
    setExternal(false);
    setNotice('');
    setError('');
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    let completed = false;
    try {
      const body = {
        confirmationId: confirmation,
        reason
      };
      let endpoint;
      if (prepared.type === 'fence') {
        endpoint = 'releases/revoke-access';
        Object.assign(body, {
          artifactId: prepared.id,
          expectedRevision: prepared.revision,
          expectedCompositionId: prepared.compositionId,
          serviceInterruptionAcknowledged: ack,
          externalUsageChecked: external
        });
      } else {
        Object.assign(body, {
          sessionId: prepared.id,
          expectedSequence: prepared.session.sequence
        });
        if (prepared.type === 'transition') {
          endpoint = 'sessions/transition';
          body.unsavedInputAcknowledged = ack;
        } else {
          endpoint = 'sessions/release-legacy';
          Object.assign(body, {
            artifactId: release.artifact.id,
            expectedAccessRevokedAt: prepared.accessRevokedAt
          });
        }
      }
      await request(endpoint, body, csrfToken);
      completed = true;
      setNotice(prepared.type === 'transition' ? '전환을 요청했습니다. 전환 문서의 확인 응답이 오기 전에는 참조를 해제하지 않습니다.' : prepared.type === 'fence' ? '이 버전의 파일 접근을 종료했습니다. 파일은 보관되며 24시간 뒤 구형 탭의 이 버전 참조만 정리할 수 있습니다.' : '이 버전에 대한 탭 참조만 정리했습니다. 다른 버전 참조는 유지하고 파일은 최소 30일 더 보존합니다.');
      setPrepared(null);
      await onSaved();
    } catch (cause) {
      setError(`${completed ? '작업은 완료했지만 목록 갱신에 실패했습니다. ' : ''}${cause.message}`);
    } finally {
      setBusy(false);
    }
  }
  const legacy = release.sessions.filter(s => s.protocol !== 'lease-v1' && (!s.closedAt || s.transition));
  const labels = {
    transition: '구형 탭 전환 요청',
    fence: '이 버전 파일 접근 종료',
    release: '이 버전의 구형 탭 참조 정리'
  };
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("details", {
    className: "legacy-controls detail-section"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("summary", null, "\uAD6C\uD615 \uD0ED \uC804\uD658 \xB7 \uC811\uADFC \uC885\uB8CC (", legacy.length, ")"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uC751\uB2F5\uD558\uB294 \uAD6C\uD615 \uD0ED\uC740 \uCD5C\uC2E0 \uD654\uBA74\uC73C\uB85C \uC804\uD658\uD569\uB2C8\uB2E4. \uB3CC\uC544\uC624\uC9C0 \uC54A\uB294 \uD0ED\uC740 \uBC84\uC804 \uC811\uADFC\uC744 \uC885\uB8CC\uD55C \uB4A4 \uD574\uB2F9 \uBC84\uC804\uC758 \uCC38\uC870\uB9CC \uC815\uB9AC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "button secondary",
    "data-testid": "install-transition-bridge",
    disabled: busy,
    onClick: connect
  }, "\uC774 \uBE0C\uB77C\uC6B0\uC800\uC758 \uC804\uD658 \uC911\uACC4 \uC5F0\uACB0"), bridge ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "status",
    className: "form-success",
    "data-testid": "transition-bridge-status"
  }, bridge) : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "field-hint"
  }, "\uB3D9\uC77C \uBE0C\uB77C\uC6B0\uC800\xB7\uD504\uB85C\uD544\xB7\uCD9C\uCC98\uC5D0\uC11C\uB9CC \uAE30\uC874 \uD0ED\uC744 \uC804\uD658\uD569\uB2C8\uB2E4. \uB2E4\uB978 \uBE0C\uB77C\uC6B0\uC800\uB294 \uAC19\uC740 \uAD00\uB9AC \uD654\uBA74\uC5D0\uC11C \uC911\uACC4\uB97C \uC5F0\uACB0\uD558\uAC70\uB098 \uC0AC\uC6A9\uC790\uAC00 \uC9C1\uC811 \uC0C8\uB85C\uACE0\uCE68\uD574\uC57C \uD569\uB2C8\uB2E4. \uC804\uD658\uD558\uBA74 \uBBF8\uC800\uC7A5 \uC785\uB825\uC774 \uC0AC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "session-list"
  }, legacy.map(session => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: session.id,
    "data-testid": `legacy-${session.id}`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    className: "full-artifact-id"
  }, session.id), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small"
  }, session.transition?.confirmedAt ? '전환 확인 완료' : session.transition && Date.parse(session.transition.expiresAt) > Date.now() ? '전환 응답 대기' : session.releasedAt ? '탭 참조 정리 완료' : '구형 탭'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uB9C8\uC9C0\uB9C9 \uC751\uB2F5 ", stamp(session.lastSeenAt), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "\uC804\uD658 \uC911\uACC4 \uD655\uC778 ", stamp(session.bridge?.lastSeenAt), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "\uC804\uD658 \uC694\uCCAD ", stamp(session.transition?.requestedAt), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "\uC804\uD658 \uD655\uC778 ", stamp(session.transition?.confirmedAt)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "button secondary",
    "data-testid": `prepare-transition-${session.id}`,
    disabled: busy || Boolean(session.closedAt || session.releasedAt) || session.transition && !session.transition.confirmedAt && Date.parse(session.transition.expiresAt) > Date.now(),
    onClick: () => prepare('transition', session)
  }, "\uAD6C\uD615 \uD0ED \uC804\uD658 \uC900\uBE44"), session.referenceReleasedAt ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uC774 \uBC84\uC804 \uCC38\uC870 \uC815\uB9AC ", stamp(session.referenceReleasedAt), " \xB7 ", session.legacyReleases[release.artifact.id].reason) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uC774 \uBC84\uC804 \uCC38\uC870 \uC815\uB9AC \uAC00\uB2A5 ", stamp(session.legacyCleanup.earliestReleaseAt)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "button secondary",
    "data-testid": `prepare-legacy-release-${session.id}`,
    disabled: busy || !session.legacyCleanup.eligible,
    onClick: () => prepare('release', session)
  }, "\uC774 \uBC84\uC804 \uCC38\uC870 \uC815\uB9AC \uC900\uBE44"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "blocker-list"
  }, session.legacyCleanup.blockers.map(message => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: message
  }, message))))))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uB3CC\uC544\uC624\uC9C0 \uC54A\uB294 \uD0ED\uC758 \uBC84\uC804 \uC811\uADFC \uC885\uB8CC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uB4F1\uB85D \uD574\uC81C\uC640 \uB864\uBC31\xB7\uACE0\uC815 \uCC38\uC870 \uC815\uB9AC \uD6C4, \uBCF4\uD638 \uD0ED \uCC38\uC870\uAC00 \uC5C6\uACE0 \uAD6C\uD615 \uD0ED \uC751\uB2F5\uB3C4 24\uC2DC\uAC04 \uC774\uC0C1 \uC5C6\uC744 \uB54C \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uC11C\uBC84\uAC00 \uC774 \uBC84\uC804\uC758 \uBAA8\uB4E0 \uD30C\uC77C \uC694\uCCAD\uC744 \uAC70\uC808\uD569\uB2C8\uB2E4. \uC774\uBBF8 \uBC1B\uC740 \uCF54\uB4DC\xB7\uB2E4\uB978 \uD638\uC2A4\uD2B8\xB7\uC5C5\uBB34 API\uAE4C\uC9C0 \uD68C\uC218\uD558\uB294 \uAE30\uB2A5\uC740 \uC544\uB2D9\uB2C8\uB2E4."), release.lifecycle.accessRevokedAt ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small",
    "data-testid": "access-revoked"
  }, "\uD30C\uC77C \uC811\uADFC \uC885\uB8CC ", stamp(release.lifecycle.accessRevokedAt), " \xB7 ", release.lifecycle.accessRevocationReason) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "button danger",
    "data-testid": "prepare-access-fence",
    disabled: busy || !release.accessFence.eligible,
    onClick: () => prepare('fence')
  }, "\uBC84\uC804 \uC811\uADFC \uC885\uB8CC \uC900\uBE44"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "blocker-list"
  }, release.accessFence.blockers.map(message => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: message
  }, message)))), prepared ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("form", {
    className: "retirement-confirm",
    onSubmit: submit
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, labels[prepared.type], " \uD655\uC778"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    className: "full-artifact-id"
  }, prepared.id), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "legacy-confirm"
  }, "\uAD6C\uD615 \uD0ED \uC791\uC5C5 \uB300\uC0C1 \uC804\uCCB4 ID"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    id: "legacy-confirm",
    value: confirmation,
    disabled: busy,
    onChange: e => setConfirmation(e.target.value)
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "legacy-reason"
  }, "\uAD6C\uD615 \uD0ED \uC791\uC5C5 \uC0AC\uC720"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("textarea", {
    id: "legacy-reason",
    rows: "2",
    maxLength: "500",
    value: reason,
    disabled: busy,
    onChange: e => setReason(e.target.value)
  }), prepared.type !== 'release' ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    className: "external-confirm"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    type: "checkbox",
    checked: ack,
    disabled: busy,
    onChange: e => setAck(e.target.checked)
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, prepared.type === 'transition' ? '대상 탭에 전환을 안내했으며 미저장 입력이 사라질 수 있음을 확인했습니다.' : '복귀하는 구형 탭에서 이 버전의 이용이 중단될 수 있음을 확인했습니다.')) : null, prepared.type === 'fence' ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    className: "external-confirm"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    type: "checkbox",
    checked: external,
    disabled: busy,
    onChange: e => setExternal(e.target.checked)
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC678\uBD80 \uD638\uC2A4\uD2B8\xB7\uC5C5\uBB34 API \uB4F1 \uC774 \uC11C\uBC84 \uBC16\uC758 \uC0AC\uC6A9\uACFC \uD544\uC694\uD55C \uC811\uADFC \uCC28\uB2E8\uC744 \uBCC4\uB3C4\uB85C \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4.")) : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "support-actions"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "text-button",
    disabled: busy,
    onClick: () => setPrepared(null)
  }, "\uCDE8\uC18C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "submit",
    className: "button primary",
    "data-testid": "confirm-legacy-action",
    disabled: busy || confirmation !== prepared.id || !reason.trim() || prepared.type !== 'release' && !ack || prepared.type === 'fence' && !external
  }, busy ? '처리 중…' : `${labels[prepared.type]} 실행`))) : null, error ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "alert",
    className: "form-error",
    "data-testid": "legacy-error"
  }, error) : null, notice ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "status",
    className: "form-success",
    "data-testid": "legacy-saved"
  }, notice) : null);
}

/***/ },

/***/ "./src/LifecyclePanel.jsx"
/*!********************************!*\
  !*** ./src/LifecyclePanel.jsx ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ LifecyclePanel)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./model */ "./src/model.js");
/* harmony import */ var _RetirementActions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./RetirementActions */ "./src/RetirementActions.jsx");
/* harmony import */ var _SessionActions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./SessionActions */ "./src/SessionActions.jsx");
/* harmony import */ var _LegacyControls__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./LegacyControls */ "./src/LegacyControls.jsx");





const names = {
  platform: 'SDK',
  shell: 'Shell',
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D'
};
const supportNames = {
  unscheduled: '종료일 미정',
  scheduled: '종료 예정',
  ended: '지원 종료'
};
const registrationNames = {
  unregistered: '등록 해제 · 파일 보관',
  deleting: '삭제 미완료',
  deleted: '파일 삭제 완료'
};
const stamp = value => value ? new Date(value).toLocaleString('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
}) : '기록 없음';
function pathLabel(path, catalog) {
  return path.map(id => {
    const a = catalog[id];
    return a ? `${names[a.service] || a.service} ${a.version}` : id;
  }).join(' → ');
}
function SupportEditor({
  release,
  request,
  csrfToken,
  onSaved
}) {
  const [form, setForm] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(release.lifecycle);
  const [busy, setBusy] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [notice, setNotice] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await request('lifecycle', {
        artifactId: release.artifact.id,
        expectedRevision: form.revision,
        supportEndsOn: form.supportEndsOn || null,
        noticeReference: form.noticeReference
      }, csrfToken);
      setForm(result.lifecycle);
      setNotice('지원 정책을 저장했습니다. 서비스 조합과 배포 파일은 유지됩니다.');
      await onSaved();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("form", {
    className: "support-editor",
    onSubmit: save
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uC9C0\uC6D0 \uC885\uB8CC \uACC4\uD68D"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "support-end"
  }, "\uC9C0\uC6D0 \uC885\uB8CC \uC608\uC815\uC77C ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uD55C\uAD6D \uC2DC\uAC04 \xB7 \uD574\uB2F9 \uB0A0\uC9DC\uAE4C\uC9C0 \uC9C0\uC6D0")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    id: "support-end",
    type: "date",
    value: form.supportEndsOn || '',
    disabled: busy,
    onChange: event => {
      setForm({
        ...form,
        supportEndsOn: event.target.value
      });
      setNotice('');
    }
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "notice-reference"
  }, "\uACF5\uC9C0 \uAE30\uB85D ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uACF5\uC9C0 \uB9C1\uD06C \uB610\uB294 \uB0B4\uBD80 \uAE30\uB85D \uC2DD\uBCC4\uC790")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("textarea", {
    id: "notice-reference",
    rows: "2",
    maxLength: "1000",
    value: form.noticeReference,
    disabled: busy,
    placeholder: "\uC608: \uB9B4\uB9AC\uC2A4 \uACF5\uC9C0 URL \uB610\uB294 \uACF5\uC9C0 \uAE30\uB85D \uBC88\uD638",
    onChange: event => {
      setForm({
        ...form,
        noticeReference: event.target.value
      });
      setNotice('');
    }
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "field-hint"
  }, "\uC774 \uD654\uBA74\uC740 \uACF5\uC9C0\uB97C \uC804\uC1A1\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC885\uB8CC\uC77C\xB7\uACF5\uC9C0 \uB0B4\uC6A9\uC744 \uBCC0\uACBD\uD558\uBA74 \uACF5\uC9C0 \uC720\uC608 \uAE30\uAC04\uC744 \uC800\uC7A5 \uC2DC\uC810\uBD80\uD130 \uB2E4\uC2DC \uACC4\uC0B0\uD569\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uACF5\uC9C0 \uAE30\uB85D \uC2DC\uAC01 ", stamp(release.lifecycle.noticeRecordedAt)), form.revision !== release.lifecycle.revision ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "history-reason"
  }, "\uB2E4\uB978 \uACF3\uC5D0\uC11C \uC815\uCC45\uC744 \uBCC0\uACBD\uD588\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uC815\uCC45\uC744 \uBD88\uB7EC\uC628 \uB4A4 \uB2E4\uC2DC \uC785\uB825\uD558\uC138\uC694.") : null, error ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "alert",
    className: "form-error",
    "data-testid": "lifecycle-error"
  }, error) : null, notice ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "status",
    className: "form-success",
    "data-testid": "lifecycle-saved"
  }, notice) : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "support-actions"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "text-button",
    disabled: busy,
    onClick: () => {
      setForm(release.lifecycle);
      setError('');
      setNotice('');
    }
  }, "\uCD5C\uC2E0 \uC815\uCC45 \uBD88\uB7EC\uC624\uAE30"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "submit",
    className: "button primary",
    disabled: busy
  }, busy ? '저장 중…' : '지원 정책 저장')));
}
function ReleaseDetail({
  release,
  catalog,
  request,
  csrfToken,
  onSaved,
  compositionId
}) {
  const a = release.artifact;
  const open = release.sessions.filter(item => !['closed', 'released'].includes(item.status));
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "surface release-detail",
    "aria-label": "\uC120\uD0DD\uD55C \uBC30\uD3EC\uBB3C \uC0C1\uC138",
    "data-testid": "release-detail"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "eyebrow"
  }, "RELEASE DETAIL"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", null, names[a.service] || a.service, " ", a.version), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    className: "full-artifact-id"
  }, a.id), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "detail-section"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uD604\uC7AC \uC0AC\uC6A9\uD558\uB294 \uC11C\uBE44\uC2A4"), release.currentPaths.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "usage-paths"
  }, release.currentPaths.map((item, index) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: index
  }, pathLabel(item.path, catalog)))) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "muted small"
  }, "\uD604\uC7AC \uC870\uD569\uC5D0\uC11C\uB294 \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "detail-section",
    "data-testid": "saved-subscription-references"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uC800\uC7A5\uB41C \uC0AC\uC6A9\uC790 \uAD6C\uB3C5"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uB85C\uADF8\uC778\xB7\uC811\uC18D \uC5EC\uBD80\uC640 \uAD00\uACC4\uC5C6\uC774 \uAD6C\uB3C5\uC744 \uD574\uC81C\uD558\uAC70\uB098 \uB2E4\uB978 \uBC84\uC804\uC73C\uB85C \uC804\uD658\uD560 \uB54C\uAE4C\uC9C0 \uBCF4\uD638\uD569\uB2C8\uB2E4."), release.subscriptions?.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", null, release.subscriptions.map(sub => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: sub.userId
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, sub.userName), " \xB7 \uBCC0\uACBD \uBC88\uD638 ", sub.revision, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, sub.paths.map(item => pathLabel(item.path, catalog)).join(' / '))))) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC774 \uBC30\uD3EC\uBB3C\uC744 \uC0AC\uC6A9\uD558\uB294 \uC800\uC7A5\uB41C \uAD6C\uB3C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "detail-section"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uC5F4\uB9B0 \uD0ED\uC5D0\uC11C \uD544\uC694\uD55C \uBC84\uC804"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uCD5C\uADFC \uC751\uB2F5 ", release.recentTabs, " \xB7 \uC751\uB2F5 \uB04A\uAE40 ", release.unknownTabs, " \xB7 \uCD5C\uADFC \uD0ED \uC911 \uCF54\uB4DC \uB85C\uB4DC \uD655\uC778 ", release.loadedTabs), open.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "session-list"
  }, open.map(session => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: session.id
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: `pill ${session.status === 'recent' ? 'blue' : 'amber'}`
  }, session.status === 'recent' ? '최근 응답' : '종료 여부 확인 불가'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "small muted"
  }, session.loaded ? '코드 로드 확인' : '아직 로드되지 않음 · 지연 로딩 보호')), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, session.paths.map(item => pathLabel(item.path, catalog)).join(' / ')), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", null, (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(session.compositionId)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "small muted"
  }, " \xB7 \uB9C8\uC9C0\uB9C9 \uC751\uB2F5 ", stamp(session.lastSeenAt))))) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uAD00\uCE21\uB41C \uC5F4\uB9B0 \uD0ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uCD94\uC801 \uB3C4\uC785 \uC804 \uD0ED\uACFC \uC678\uBD80 \uD638\uC2A4\uD2B8\uB294 \uD655\uC778 \uBC94\uC704 \uBC16\uC785\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "detail-section deletion-assessment"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "review-title"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uC0AD\uC81C \uAC00\uB2A5 \uC5EC\uBD80"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: `pill ${release.deletion.eligibleForReview ? 'green' : 'amber'}`,
    "data-testid": "deletion-state"
  }, release.registrationState === 'deleted' ? '파일 삭제 완료' : release.deletion.eligibleForReview ? '삭제 검토 가능' : '삭제 보류')), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "blocker-list"
  }, release.deletion.blockers.map(item => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: item.code,
    "data-blocker": item.code
  }, item.message))), release.deletion.earliestReviewAt ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uAE30\uAC04 \uC870\uAC74 \uCDA9\uC871 \uC608\uC0C1: ", stamp(release.deletion.earliestReviewAt), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "\uC0AC\uC6A9\xB7\uCC38\uC870 \uC870\uAC74\uB3C4 \uBAA8\uB450 \uD574\uC18C\uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4.") : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "field-hint"
  }, "\uC0AD\uC81C \uAC80\uD1A0 \uAC00\uB2A5\uC740 \uAD00\uCE21 \uBC94\uC704\uC758 \uD6C4\uBCF4 \uD310\uC815\uC785\uB2C8\uB2E4. \uC2E4\uD589 \uC9C1\uC804\uC5D0 \uCC38\uC870\uB97C \uB2E4\uC2DC \uD655\uC778\uD558\uBA70, \uAD00\uCE21 \uBC94\uC704 \uBC16\uC758 \uC0AC\uC6A9 \uD655\uC778\uB3C4 \uD544\uC694\uD569\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_SessionActions__WEBPACK_IMPORTED_MODULE_3__["default"], {
    sessions: release.sessions,
    request: request,
    csrfToken: csrfToken,
    onSaved: onSaved
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_LegacyControls__WEBPACK_IMPORTED_MODULE_4__["default"], {
    release: release,
    compositionId: compositionId,
    request: request,
    csrfToken: csrfToken,
    onSaved: onSaved
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_RetirementActions__WEBPACK_IMPORTED_MODULE_2__["default"], {
    release: release,
    compositionId: compositionId,
    request: request,
    csrfToken: csrfToken,
    onSaved: onSaved
  }), release.registrationState === 'registered' ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SupportEditor, {
    release: release,
    request: request,
    csrfToken: csrfToken,
    onSaved: onSaved
  }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uC9C0\uC6D0 \uC885\uB8CC\uC77C ", release.lifecycle.supportEndsOn, " \xB7 \uB4F1\uB85D \uD574\uC81C \uD6C4\uC5D0\uB294 \uC9C0\uC6D0 \uC815\uCC45\uC744 \uC218\uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."));
}
function LifecyclePanel({
  request,
  csrfToken,
  onChanged
}) {
  const [data, setData] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [busy, setBusy] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [query, setQuery] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [service, setService] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('all'),
    [filter, setFilter] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('all'),
    [selected, setSelected] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const detail = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  async function reload(signal) {
    try {
      const next = await request('lifecycle', null, null, signal);
      setData(next);
      setError('');
    } catch (cause) {
      if (cause.name !== 'AbortError') setError(`사용 현황을 갱신하지 못했습니다. ${cause.message}`);
    }
  }
  async function afterMutation() {
    await reload();
    await onChanged?.();
  }
  ;(0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const controller = new AbortController();
    let timer;
    async function poll() {
      await reload(controller.signal);
      if (!controller.signal.aborted) timer = setTimeout(poll, 10000);
    }
    poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (detail.current) detail.current.scrollTop = 0;
    if (selected && matchMedia('(max-width: 1200px)').matches) detail.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, [selected]);
  const catalog = Object.fromEntries((data?.releases || []).map(item => [item.artifact.id, item.artifact]));
  const releases = [...(data?.releases || [])].sort((a, b) => Number(Boolean(b.currentPaths.length)) - Number(Boolean(a.currentPaths.length)) || a.artifact.service.localeCompare(b.artifact.service) || b.artifact.version.localeCompare(a.artifact.version, undefined, {
    numeric: true
  }) || a.artifact.id.localeCompare(b.artifact.id));
  const visible = releases.filter(item => (service === 'all' || item.artifact.service === service) && `${names[item.artifact.service]} ${item.artifact.version} ${item.artifact.id}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || filter === 'current' && item.currentPaths.length || filter === 'tabs' && item.recentTabs + item.unknownTabs > 0 || filter === 'ended' && item.supportStatus === 'ended' || filter === 'candidate' && item.deletion.eligibleForReview || ['unregistered', 'deleting', 'deleted'].includes(filter) && item.registrationState === filter));
  const focused = releases.find(item => item.artifact.id === selected);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "lifecycle-panel",
    "data-testid": "lifecycle-panel"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "surface lifecycle-intro"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "section-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "eyebrow"
  }, "USAGE & SUPPORT"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", null, "\uBC84\uC804\uBCC4 \uC0AC\uC6A9 \uD604\uD669\uACFC \uC9C0\uC6D0 \uC885\uB8CC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "muted"
  }, "\uD604\uC7AC \uC120\uD0DD, \uC0AC\uC6A9\uC790 \uAD6C\uB3C5, \uC5F4\uB9B0 \uD0ED, \uB864\uBC31 \uCC38\uC870\uB97C \uD568\uAED8 \uD655\uC778\uD569\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "button secondary",
    disabled: busy,
    onClick: async () => {
      setBusy(true);
      await reload();
      setBusy(false);
    }
  }, "\uC0AC\uC6A9 \uD604\uD669 \uC0C8\uB85C\uACE0\uCE68")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "lifecycle-stats"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, releases.filter(item => item.currentPaths.length).length), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uD604\uC7AC \uC870\uD569\uC758 \uBC30\uD3EC\uBB3C")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, releases.filter(item => item.recentTabs + item.unknownTabs > 0).length), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC5F4\uB9B0 \uD0ED\uC5D0\uC11C \uD544\uC694\uD55C \uBC30\uD3EC\uBB3C")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, releases.filter(item => item.supportStatus === 'scheduled').length), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC9C0\uC6D0 \uC885\uB8CC \uC608\uC815")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, releases.filter(item => item.deletion.eligibleForReview).length), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC0AD\uC81C \uAC80\uD1A0 \uD6C4\uBCF4"))), data ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "footnote"
  }, "\uAD00\uCE21 \uC2DC\uC791 ", stamp(data.observationStartedAt), " \xB7 \uAC31\uC2E0 ", stamp(data.generatedAt), " \xB7 10\uCD08\uB9C8\uB2E4 \uAC31\uC2E0", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "\uACF5\uC9C0 \uAE30\uB85D \uD6C4 \uCD5C\uC18C ", data.policy.noticeDays, "\uC77C \uC720\uC608 \xB7 \uB4F1\uB85D \uD574\uC81C \uD6C4\uC5D0\uB3C4 \uCD5C\uC18C ", data.policy.retentionDays, "\uC77C \uBCF4\uC874 \xB7 \uAD00\uCE21 \uC2DC\uC791 \uD6C4 \uCD5C\uC18C ", data.policy.observationDays, "\uC77C. \uC751\uB2F5\uC774 ", data.policy.staleSeconds, "\uCD08 \uB118\uAC8C \uB04A\uACA8\uB3C4 \uBC14\uB85C \uBCF4\uD638\uB97C \uD574\uC81C\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC7AC\uAC1C \uBCF4\uD638 \uD0ED\uC740 \uC0AC\uC6A9 \uAE30\uD55C ", data.policy.leaseSeconds / 60, "\uBD84 \uB9CC\uB8CC \uD6C4 ", data.policy.sessionGraceHours, "\uC2DC\uAC04\uC774 \uC9C0\uB098\uBA74 \uBCC4\uB3C4\uB85C \uC815\uB9AC\uD560 \uC218 \uC788\uC73C\uBA70, \uC815\uB9AC \uD6C4\uC5D0\uB3C4 ", data.policy.retentionDays, "\uC77C \uBCF4\uC874\uD569\uB2C8\uB2E4.", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "\uC774 \uC11C\uBC84\uC5D0\uC11C \uCD94\uC801 \uB3C4\uC785 \uD6C4 \uC0C8\uB85C \uC5F0 \uC11C\uBE44\uC2A4 \uD654\uBA74\uC744 \uAD00\uCE21\uD569\uB2C8\uB2E4. \uC774\uC804\uBD80\uD130 \uC5F4\uB9B0 \uD0ED\xB7\uC678\uBD80 \uD638\uC2A4\uD2B8\uC758 \uC0AC\uC6A9 \uC5EC\uBD80\uB294 \uBCC4\uB3C4 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.") : null, error ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "alert",
    className: "form-error"
  }, error, " ", data ? '아래는 마지막으로 받은 정보입니다.' : '') : null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "lifecycle-filters"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "sr-only"
  }, "\uBC30\uD3EC\uBB3C \uAC80\uC0C9"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    type: "search",
    placeholder: "\uC11C\uBE44\uC2A4\xB7\uBC84\uC804\xB7\uBC30\uD3EC ID \uAC80\uC0C9",
    value: query,
    onChange: event => setQuery(event.target.value)
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "usage-service",
    className: "sr-only"
  }, "\uC11C\uBE44\uC2A4 \uD544\uD130"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
    id: "usage-service",
    value: service,
    onChange: event => setService(event.target.value)
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "all"
  }, "\uBAA8\uB4E0 \uC11C\uBE44\uC2A4"), Object.entries(names).map(([value, label]) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    key: value,
    value: value
  }, label)))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "usage-status",
    className: "sr-only"
  }, "\uC0AC\uC6A9 \uC0C1\uD0DC \uD544\uD130"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
    id: "usage-status",
    value: filter,
    onChange: event => setFilter(event.target.value)
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "all"
  }, "\uBAA8\uB4E0 \uC0C1\uD0DC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "current"
  }, "\uD604\uC7AC \uC870\uD569\uC5D0\uC11C \uC0AC\uC6A9"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "tabs"
  }, "\uC5F4\uB9B0 \uD0ED\uC5D0\uC11C \uD544\uC694"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "ended"
  }, "\uC9C0\uC6D0 \uC885\uB8CC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "candidate"
  }, "\uC0AD\uC81C \uAC80\uD1A0 \uAC00\uB2A5"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "unregistered"
  }, "\uB4F1\uB85D \uD574\uC81C \xB7 \uD30C\uC77C \uBCF4\uAD00"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "deleting"
  }, "\uC0AD\uC81C \uBBF8\uC644\uB8CC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "deleted"
  }, "\uD30C\uC77C \uC0AD\uC81C \uC644\uB8CC")))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "lifecycle-workspace"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "surface release-list",
    "aria-label": "\uBC84\uC804\uBCC4 \uBC30\uD3EC\uBB3C \uBAA9\uB85D"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, visible.length, "\uAC1C \uBC30\uD3EC\uBB3C \xB7 \uC120\uD0DD\uD558\uBA74 \uC0AC\uC6A9 \uACBD\uB85C\uC640 \uBCF4\uB958 \uC0AC\uC720\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4."), visible.map(item => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: `release-row ${selected === item.artifact.id ? 'selected' : ''}`,
    key: item.artifact.id,
    "data-testid": `release-${item.artifact.id}`,
    "aria-pressed": selected === item.artifact.id,
    onClick: () => setSelected(item.artifact.id)
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "release-name"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, names[item.artifact.service] || item.artifact.service, " ", item.artifact.version), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", null, (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(item.artifact.id))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "release-usage"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, item.currentPaths.length ? `현재 ${item.currentPaths.length}개 경로` : '현재 조합 미사용'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uCD5C\uADFC \uD0ED ", item.recentTabs, " \xB7 \uD655\uC778 \uBD88\uAC00 ", item.unknownTabs), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC800\uC7A5 \uAD6C\uB3C5 ", item.subscriptions?.length || 0, " \xB7 \uB864\uBC31 \uCC38\uC870 ", item.history.length)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "release-status"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: `pill ${item.supportStatus === 'ended' ? 'amber' : item.supportStatus === 'scheduled' ? 'blue' : ''}`
  }, supportNames[item.supportStatus]), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, item.lifecycle.supportEndsOn || '날짜 미지정'), registrationNames[item.registrationState] ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, registrationNames[item.registrationState]) : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: item.deletion.eligibleForReview ? 'eligible' : 'muted'
  }, item.registrationState === 'deleted' ? '작업 기록 보존' : item.deletion.eligibleForReview ? '삭제 검토 가능' : '삭제 보류')))), !data ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "empty"
  }, "\uC0AC\uC6A9 \uD604\uD669\uC744 \uBD88\uB7EC\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4\u2026") : !visible.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "empty"
  }, "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uBC30\uD3EC\uBB3C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.") : null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "release-detail-wrap",
    ref: detail
  }, focused ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ReleaseDetail, {
    key: focused.artifact.id,
    release: focused,
    catalog: catalog,
    request: request,
    csrfToken: csrfToken,
    onSaved: afterMutation,
    compositionId: data.compositionId
  }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "surface empty detail-placeholder"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\u25C8"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uBC30\uD3EC\uBB3C\uC744 \uC120\uD0DD\uD558\uC138\uC694"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC0AC\uC6A9 \uACBD\uB85C, \uC5F4\uB9B0 \uD0ED, \uC9C0\uC6D0 \uC885\uB8CC \uACC4\uD68D\uACFC", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "\uC0AD\uC81C \uBCF4\uB958 \uC0AC\uC720\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")))));
}

/***/ },

/***/ "./src/RetirementActions.jsx"
/*!***********************************!*\
  !*** ./src/RetirementActions.jsx ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ RetirementActions)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./model */ "./src/model.js");


const labels = {
  unregister: '등록 해제',
  delete: '파일 삭제',
  retire: '롤백 보관 해제'
};
const states = {
  registered: '등록됨',
  unregistered: '등록 해제 · 파일 보관',
  deleting: '삭제 미완료',
  deleted: '파일 삭제 완료'
};
function RetirementActions({
  release,
  compositionId,
  request,
  csrfToken,
  onSaved
}) {
  const [action, setAction] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    [confirmation, setConfirmation] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [reason, setReason] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [checked, setChecked] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [busy, setBusy] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [notice, setNotice] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  function prepare(type, id = release.artifact.id, revision = release.lifecycle.revision) {
    setAction({
      type,
      id,
      revision,
      compositionId
    });
    setConfirmation('');
    setReason('');
    setChecked(false);
    setError('');
    setNotice('');
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    let completed = false;
    try {
      const body = {
        expectedCompositionId: action.compositionId,
        expectedRevision: action.revision,
        confirmationId: confirmation,
        reason,
        externalUsageChecked: checked
      };
      const endpoint = action.type === 'retire' ? 'compositions/retire' : `releases/${action.type}`;
      if (action.type === 'retire') body.compositionId = action.id;else body.artifactId = action.id;
      await request(endpoint, body, csrfToken);
      completed = true;
      setNotice(`${labels[action.type]}를 완료했습니다.${action.type === 'unregister' ? ' 배포 파일은 보관됩니다.' : action.type === 'retire' ? ' 열린 탭의 파일 보호는 계속 적용됩니다.' : ' 배포 정보와 작업 기록은 남습니다.'}`);
      setAction(null);
      await onSaved();
    } catch (cause) {
      setError(`${completed ? '작업은 완료했지만 목록을 갱신하지 못했습니다. ' : ''}${cause.message}`);
    } finally {
      setBusy(false);
    }
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "retirement-actions detail-section",
    "aria-label": "\uB4F1\uB85D \uD574\uC81C\uC640 \uD30C\uC77C \uC0AD\uC81C"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "review-title"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uB4F1\uB85D\uACFC \uD30C\uC77C\uC744 \uB530\uB85C \uAD00\uB9AC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "pill",
    "data-testid": "registration-state"
  }, states[release.registrationState])), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uB4F1\uB85D \uD574\uC81C\uB294 \uC120\uD0DD \uBAA9\uB85D\uC5D0\uC11C \uC81C\uC678\uD558\uACE0 \uD30C\uC77C\uC744 \uB0A8\uAE41\uB2C8\uB2E4. \uC2E4\uC81C \uC0AD\uC81C\uB294 \uBCC4\uB3C4\uB85C \uD655\uC778\uD55C \uB4A4 \uC2E4\uD589\uD569\uB2C8\uB2E4."), release.lifecycle.unregisteredAt ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uB4F1\uB85D \uD574\uC81C: ", new Date(release.lifecycle.unregisteredAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul'
  })) : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "retirement-buttons"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "button secondary",
    "data-testid": "prepare-unregister",
    disabled: busy || !release.unregister.eligible,
    onClick: () => prepare('unregister')
  }, "\uB4F1\uB85D \uD574\uC81C \uC900\uBE44"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "button danger",
    "data-testid": "prepare-delete",
    disabled: busy || !release.deletion.eligibleForReview,
    onClick: () => prepare('delete')
  }, release.registrationState === 'deleting' ? '남은 파일 삭제 준비' : '파일 삭제 준비')), release.registrationState === 'registered' && release.unregister.blockers.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "blocker-list",
    "aria-label": "\uB4F1\uB85D \uD574\uC81C \uBCF4\uB958 \uC0AC\uC720"
  }, release.unregister.blockers.map(item => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: item.code
  }, item.message))) : null, release.lifecycle.lastDeleteError ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "form-error"
  }, "\uC774\uC804 \uC0AD\uC81C\uAC00 \uC644\uB8CC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC870\uAC74\uC744 \uD655\uC778\uD55C \uB4A4 \uB0A8\uC740 \uD30C\uC77C \uC0AD\uC81C\uB97C \uC7AC\uC2DC\uB3C4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.") : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("details", {
    className: "retirement-references"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("summary", null, "\uB864\uBC31 \uBCF4\uAD00\xB7\uACE0\uC815 \uCC38\uC870 (", release.history.length + release.pinnedConsumers.length, ")"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uBCF4\uAD00\uC744 \uD574\uC81C\uD55C \uC870\uD569\uC740 \uB2E4\uC2DC \uC120\uD0DD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC870\uD569 \uAE30\uB85D\uC740 \uB0A8\uAE30\uACE0, \uC5F4\uB9B0 \uD0ED\uC758 \uCC38\uC870\uB294 \uACC4\uC18D \uBCF4\uD638\uD569\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "reference-list"
  }, release.historyEntries.map(item => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: item.id
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", null, item.id), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "text-button",
    "data-testid": `prepare-retire-${item.id}`,
    disabled: busy,
    onClick: () => prepare('retire', item.id, item.revision)
  }, "\uC870\uD569 ", (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(item.id), " \uBCF4\uAD00 \uD574\uC81C \uC900\uBE44"))), release.pinnedConsumers.map(id => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: id
  }, "\uACE0\uC815 \uCC38\uC870 \uC18C\uBE44\uC790 ", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", null, id))))), action ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("form", {
    className: "retirement-confirm",
    onSubmit: submit,
    "data-testid": "retirement-confirm"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, labels[action.type], " \uD655\uC778"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small"
  }, action.type === 'delete' ? '선택한 배포물의 저장소 파일을 실제로 삭제합니다. 이 화면에서 복원할 수 없습니다.' : action.type === 'retire' ? '이 조합으로 롤백할 수 없게 됩니다. 파일은 이 작업으로 삭제하지 않습니다.' : '신규 선택에서 제외합니다. 기존 탭을 위해 배포 파일은 그대로 둡니다.'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", null, action.id), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "retirement-confirm-id"
  }, "\uC791\uC5C5 \uB300\uC0C1 \uC804\uCCB4 ID"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    id: "retirement-confirm-id",
    value: confirmation,
    disabled: busy,
    autoComplete: "off",
    onChange: event => setConfirmation(event.target.value)
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "retirement-reason"
  }, "\uC791\uC5C5 \uC0AC\uC720"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("textarea", {
    id: "retirement-reason",
    rows: "2",
    maxLength: "500",
    value: reason,
    disabled: busy,
    onChange: event => setReason(event.target.value)
  }), action.type === 'delete' ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    className: "external-confirm"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    type: "checkbox",
    checked: checked,
    disabled: busy,
    onChange: event => setChecked(event.target.checked)
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uCD94\uC801 \uB3C4\uC785 \uC804 \uD0ED\xB7\uC678\uBD80 \uD638\uC2A4\uD2B8 \uB4F1 \uAD00\uCE21 \uBC94\uC704 \uBC16\uC5D0\uC11C\uB3C4 \uBBF8\uC0AC\uC6A9\uC784\uC744 \uBCC4\uB3C4\uB85C \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4.")) : null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "support-actions"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "text-button",
    type: "button",
    disabled: busy,
    onClick: () => setAction(null)
  }, "\uCDE8\uC18C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: `button ${action.type === 'delete' ? 'danger' : 'primary'}`,
    type: "submit",
    "data-testid": "confirm-retirement",
    disabled: busy || confirmation !== action.id || !reason.trim() || action.type === 'delete' && !checked
  }, busy ? '처리 중…' : `${labels[action.type]} 실행`))) : null, error ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "alert",
    className: "form-error",
    "data-testid": "retirement-error"
  }, error) : null, notice ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "status",
    className: "form-success",
    "data-testid": "retirement-saved"
  }, notice) : null);
}

/***/ },

/***/ "./src/ServiceMenus.jsx"
/*!******************************!*\
  !*** ./src/ServiceMenus.jsx ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DependencyFields: () => (/* binding */ DependencyFields),
/* harmony export */   "default": () => (/* binding */ ServiceMenus)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _model__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./model */ "./src/model.js");


function DependencyFields({
  artifact,
  catalog,
  bindings,
  onBinding,
  disabled,
  trail = []
}) {
  if (!artifact || trail.includes(artifact.id)) return null;
  return Object.entries(artifact.runtimeDependencies || {}).map(([alias, requirement]) => {
    const value = bindings[artifact.id]?.[alias] || '';
    const candidates = Object.values(catalog).filter(item => item.service === requirement.service && item.kind === 'remote');
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      className: "menu-dependency",
      key: alias
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, artifact.service, " ", artifact.version, "\uAC00 \uC0AC\uC6A9\uD560 ", alias, " (", requirement.requires, ")", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
      value: value,
      disabled: disabled,
      onChange: event => onBinding(artifact.id, alias, event.target.value)
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
      value: ""
    }, "\uD558\uC704 \uBC84\uC804\uC744 \uC120\uD0DD\uD558\uC138\uC694"), candidates.map(item => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
      key: item.id,
      value: item.id,
      disabled: item.selectionState !== 'available'
    }, item.version, " \xB7 ", (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(item.id), item.selectionState !== 'available' ? ' · 선택 불가' : '')))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(DependencyFields, {
      artifact: catalog[value],
      catalog: catalog,
      bindings: bindings,
      onBinding: onBinding,
      disabled: disabled,
      trail: [...trail, artifact.id]
    }));
  });
}
function ServiceMenus({
  draft,
  catalog,
  current,
  disabled,
  onChange,
  onBinding
}) {
  const menus = draft.navigation || [];
  const supported = current.shell.navigationProtocol === 'registered-menu-v1';
  const locked = disabled || !supported;
  const candidates = Object.values(catalog).filter(item => item.kind === 'remote' && item.service !== 'platform');
  const update = (index, field, value) => onChange(menus.map((item, i) => i === index ? {
    ...item,
    [field]: value
  } : item));
  function add() {
    let number = 1;
    while (menus.some(item => item.id === `service-${number}`)) number++;
    onChange([...menus, {
      id: `service-${number}`,
      label: '새 서비스',
      path: `/services/service-${number}`,
      artifactId: '',
      exposedModule: './Widget'
    }]);
  }
  function move(index, offset) {
    const next = [...menus];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "menu-editor",
    "aria-labelledby": "menus-heading"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", {
    id: "menus-heading"
  }, "\uC11C\uBE44\uC2A4\uC640 \uBA54\uB274 \uB4F1\uB85D"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "muted"
  }, "\uBC1C\uD589\uB41C \uC11C\uBE44\uC2A4\uC758 \uBC84\uC804\uC744 \uACE8\uB77C \uBA54\uB274\uB97C \uB9CC\uB4DC\uC138\uC694. \uBA54\uB274\uC640 \uC758\uC874 \uAD00\uACC4\uB97C \uAC80\uC0AC\uD558\uACE0 \uC801\uC6A9\uD558\uBA74 \uC0C8 \uD0ED\uBD80\uD130 \uD45C\uC2DC\uB429\uB2C8\uB2E4."), !supported ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "status"
  }, "\uB4F1\uB85D\uD615 \uBA54\uB274\uB97C \uC9C0\uC6D0\uD558\uB294 Shell\uB85C \uCD5C\uCD08 \uD55C \uBC88 \uC804\uD658\uD574\uC57C \uD569\uB2C8\uB2E4.") : null, !menus.length ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "empty"
  }, "\uB4F1\uB85D\uD55C \uC11C\uBE44\uC2A4 \uBA54\uB274\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.") : null, menus.map((item, index) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("fieldset", {
    className: "menu-card",
    key: index,
    disabled: locked,
    "data-testid": `menu-row-${index}`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("legend", null, "\uBA54\uB274 ", index + 1), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "menu-fields"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uBA54\uB274 ID", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    "data-testid": `menu-id-${index}`,
    value: item.id,
    maxLength: 40,
    onChange: event => update(index, 'id', event.target.value)
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uBA54\uB274 \uC774\uB984", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    "data-testid": `menu-label-${index}`,
    value: item.label,
    maxLength: 60,
    onChange: event => update(index, 'label', event.target.value)
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uBA54\uB274 \uC8FC\uC18C", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    "data-testid": `menu-path-${index}`,
    value: item.path,
    placeholder: "/services/alerts",
    onChange: event => update(index, 'path', event.target.value)
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uC11C\uBE44\uC2A4\uC640 \uBC30\uD3EC \uBC84\uC804", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
    "data-testid": `menu-artifact-${index}`,
    value: item.artifactId,
    onChange: event => update(index, 'artifactId', event.target.value)
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: ""
  }, "\uBC1C\uD589\uB41C \uC11C\uBE44\uC2A4\uB97C \uC120\uD0DD\uD558\uC138\uC694"), candidates.map(artifact => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    key: artifact.id,
    value: artifact.id,
    disabled: artifact.selectionState !== 'available'
  }, artifact.service.toUpperCase(), " ", artifact.version, " \xB7 ", (0,_model__WEBPACK_IMPORTED_MODULE_1__.shortId)(artifact.id), artifact.selectionState !== 'available' ? ' · 선택 불가' : '')))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uACF5\uAC1C \uBAA8\uB4C8", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    "data-testid": `menu-module-${index}`,
    value: item.exposedModule,
    onChange: event => update(index, 'exposedModule', event.target.value)
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "field-hint"
  }, "\uBE0C\uB77C\uC6B0\uC800 \uC8FC\uC18C: /#", item.path, " \xB7 \uD654\uBA74\uC740 React default export\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4. \uBA54\uB274 ID\uB294 \uD654\uBA74 \uC0C1\uD0DC\uB97C \uAD6C\uBD84\uD558\uBBC0\uB85C \uC774\uB984\uB9CC \uBC14\uAFC0 \uB54C\uB294 \uC720\uC9C0\uD558\uC138\uC694."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(DependencyFields, {
    artifact: catalog[item.artifactId],
    catalog: catalog,
    bindings: draft.runtimeBindings,
    onBinding: onBinding,
    disabled: locked
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "menu-actions"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "button secondary compact",
    type: "button",
    disabled: locked || index === 0,
    onClick: () => move(index, -1),
    "data-testid": `menu-up-${index}`
  }, "\uC704\uB85C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "button secondary compact",
    type: "button",
    disabled: locked || index === menus.length - 1,
    onClick: () => move(index, 1),
    "data-testid": `menu-down-${index}`
  }, "\uC544\uB798\uB85C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "button secondary compact",
    type: "button",
    onClick: () => onChange(menus.filter((_, i) => i !== index)),
    "data-testid": `menu-remove-${index}`
  }, "\uBA54\uB274 \uC81C\uAC70")))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "button secondary",
    type: "button",
    onClick: add,
    disabled: locked || menus.length >= 50,
    "data-testid": "add-service-menu"
  }, "\uC11C\uBE44\uC2A4 \uBA54\uB274 \uCD94\uAC00"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "footnote"
  }, "\uB4F1\uB85D\uC740 \uD30C\uC77C \uC5C5\uB85C\uB4DC\uC640 \uBCC4\uAC1C\uC785\uB2C8\uB2E4. \uBA54\uB274 \uC81C\uAC70\uB294 \uC0C8 \uD0ED\uC758 \uC5F0\uACB0\uC744 \uC5C6\uC560\uBA70 \uBC30\uD3EC \uD30C\uC77C\uC744 \uC0AD\uC81C\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uAE30\uC874 \uD0ED\uACFC \uB864\uBC31 \uC870\uD569\uC740 \uACC4\uC18D \uBCF4\uD638\uD569\uB2C8\uB2E4."));
}

/***/ },

/***/ "./src/SessionActions.jsx"
/*!********************************!*\
  !*** ./src/SessionActions.jsx ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SessionActions)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

const stamp = value => value ? new Date(value).toLocaleString('ko-KR', {
  timeZone: 'Asia/Seoul'
}) : '없음';
function SessionActions({
  sessions,
  request,
  csrfToken,
  onSaved
}) {
  const [prepared, setPrepared] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    [confirmation, setConfirmation] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [reason, setReason] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [busy, setBusy] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [notice, setNotice] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    let completed = false;
    try {
      await request('sessions/release', {
        sessionId: prepared.id,
        expectedSequence: prepared.sequence,
        expectedLeaseExpiresAt: prepared.leaseExpiresAt,
        confirmationId: confirmation,
        reason
      }, csrfToken);
      completed = true;
      setPrepared(null);
      setNotice('탭의 파일 보호 참조를 정리했습니다. 작업 기록은 남고, 파일은 삭제하지 않습니다. 이 시점부터 최소 30일을 더 보존합니다.');
      await onSaved();
    } catch (cause) {
      setError(`${completed ? '작업은 완료했지만 목록 갱신에 실패했습니다. ' : ''}${cause.message}`);
    } finally {
      setBusy(false);
    }
  }
  const targets = sessions.filter(session => !session.closedAt);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("details", {
    className: "session-cleanup detail-section"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("summary", null, "\uC751\uB2F5 \uC5C6\uB294 \uD0ED \uC815\uB9AC (", targets.length, ")"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uC7AC\uAC1C \uBCF4\uD638\uAC00 \uC788\uB294 \uD0ED\uB9CC \uC0AC\uC6A9 \uAE30\uD55C \uB9CC\uB8CC \uD6C4 24\uC2DC\uAC04\uC774 \uC9C0\uB098\uBA74 \uC815\uB9AC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC751\uB2F5 \uC911\uC778 \uD0ED\uC740 \uAC31\uC2E0\uB429\uB2C8\uB2E4. \uAE30\uC874 \uD0ED\uC740 \uC544\uB798 \u2018\uAD6C\uD615 \uD0ED \uC804\uD658 \xB7 \uC811\uADFC \uC885\uB8CC\u2019\uB97C \uC0AC\uC6A9\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "session-list"
  }, targets.map(session => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: session.id,
    "data-testid": `session-${session.id}`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    className: "full-artifact-id"
  }, session.id), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small"
  }, session.releasedAt ? '참조 정리 완료' : session.protocol === 'lease-v1' ? '재개 보호 적용' : '기존 탭 · 재개 보호 없음'), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uB9C8\uC9C0\uB9C9 \uC751\uB2F5 ", stamp(session.lastSeenAt), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "\uC0AC\uC6A9 \uAE30\uD55C ", stamp(session.leaseExpiresAt), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("br", null), "\uC815\uB9AC \uAC00\uB2A5 \uC2DC\uC810 ", stamp(session.cleanup.earliestReleaseAt)), session.releasedAt ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small muted"
  }, "\uC815\uB9AC ", stamp(session.releasedAt), " \xB7 \uC0AC\uC720: ", session.releaseReason) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "button secondary",
    "data-testid": `prepare-session-${session.id}`,
    disabled: busy || !session.cleanup.eligible,
    onClick: () => {
      setPrepared(session);
      setConfirmation('');
      setReason('');
      setError('');
      setNotice('');
    }
  }, "\uD0ED \uCC38\uC870 \uC815\uB9AC \uC900\uBE44"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", {
    className: "blocker-list"
  }, session.cleanup.blockers.map(message => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
    key: message
  }, message))))))), prepared ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("form", {
    className: "retirement-confirm",
    onSubmit: submit
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h3", null, "\uD0ED \uCC38\uC870 \uC815\uB9AC \uD655\uC778"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "small"
  }, "\uC774 \uD0ED\uC740 \uC774\uD6C4 \uAD6C\uBC84\uC804 \uC0AC\uC6A9\uC744 \uC7AC\uAC1C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC774 \uD0ED\uC774 \uCC38\uC870\uD55C \uBAA8\uB4E0 \uBC84\uC804\uC758 \uBCF4\uD638 \uCC38\uC870\uB97C \uD568\uAED8 \uC815\uB9AC\uD558\uBA70 \uD30C\uC77C\uC740 \uB0A8\uAE41\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    className: "full-artifact-id"
  }, prepared.id), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "session-confirm"
  }, "\uC815\uB9AC\uD560 \uC804\uCCB4 \uD0ED ID"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    id: "session-confirm",
    value: confirmation,
    disabled: busy,
    autoComplete: "off",
    onChange: event => setConfirmation(event.target.value)
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    htmlFor: "session-reason"
  }, "\uD0ED \uC815\uB9AC \uC0AC\uC720"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("textarea", {
    id: "session-reason",
    rows: "2",
    maxLength: "500",
    value: reason,
    disabled: busy,
    onChange: event => setReason(event.target.value)
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "support-actions"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "button",
    className: "text-button",
    disabled: busy,
    onClick: () => setPrepared(null)
  }, "\uCDE8\uC18C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    type: "submit",
    className: "button primary",
    "data-testid": "confirm-session-release",
    disabled: busy || confirmation !== prepared.id || !reason.trim()
  }, busy ? '처리 중…' : '탭 참조 정리 실행'))) : null, error ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "alert",
    className: "form-error"
  }, error) : null, notice ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    role: "status",
    className: "form-success"
  }, notice) : null);
}

/***/ },

/***/ "./src/bootstrap.jsx"
/*!***************************!*\
  !*** ./src/bootstrap.jsx ***!
  \***************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom/client */ "webpack/sharing/consume/default/react-dom/client/react-dom/client");
/* harmony import */ var _AdminApp__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./AdminApp */ "./src/AdminApp.jsx");
/* harmony import */ var _admin_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./admin.css */ "./src/admin.css");




(0,react_dom_client__WEBPACK_IMPORTED_MODULE_1__.createRoot)(document.getElementById('root')).render(/*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_AdminApp__WEBPACK_IMPORTED_MODULE_2__["default"], null));

/***/ },

/***/ "./src/model.js"
/*!**********************!*\
  !*** ./src/model.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   changesBetween: () => (/* binding */ changesBetween),
/* harmony export */   dependencyId: () => (/* binding */ dependencyId),
/* harmony export */   makeDraft: () => (/* binding */ makeDraft),
/* harmony export */   pathFor: () => (/* binding */ pathFor),
/* harmony export */   payloadFor: () => (/* binding */ payloadFor),
/* harmony export */   shortId: () => (/* binding */ shortId)
/* harmony export */ });
const shortId = (id = '') => id.split('_').at(-1)?.slice(0, 8) || '—';
const makeDraft = composition => ({
  selected: {
    ...composition.selected
  },
  runtimeBindings: structuredClone(composition.runtimeBindings || {}),
  navigation: structuredClone(composition.navigation || []),
  dashboard: composition.dashboard === undefined ? undefined : structuredClone(composition.dashboard)
});
function dependencyId(draft, artifact, alias) {
  return draft.runtimeBindings[artifact?.id]?.[alias] || artifact?.dependencies?.[alias];
}
function pathFor(draft, catalog, role) {
  const app = catalog[draft.selected[role]];
  const b = catalog[dependencyId(draft, app, 'b')];
  const d = catalog[dependencyId(draft, b, 'd')];
  return {
    app,
    b,
    d
  };
}
function changesBetween(current, draft, catalog) {
  const changes = [];
  const add = (label, from, to) => {
    if (from !== to) changes.push({
      label,
      from: catalog[from],
      to: catalog[to]
    });
  };
  for (const [role, label] of [['platform', '공통 SDK'], ['shell', 'Shell'], ['A', '서비스 A'], ['C', '서비스 C']]) add(label, current.selected[role], draft.selected[role]);
  for (const role of ['A', 'C']) {
    const before = pathFor(current, catalog, role),
      after = pathFor(draft, catalog, role);
    add(`${role} 경로 · B`, before.b?.id, after.b?.id);
    add(`${role} 경로 · D`, before.d?.id, after.d?.id);
  }
  const beforeMenus = current.navigation || [],
    afterMenus = draft.navigation || [];
  for (const id of new Set([...beforeMenus, ...afterMenus].map(item => item.id))) {
    const before = beforeMenus.find(item => item.id === id),
      after = afterMenus.find(item => item.id === id);
    if (JSON.stringify(before) !== JSON.stringify(after) || beforeMenus.indexOf(before) !== afterMenus.indexOf(after)) {
      const describe = (item, items) => item ? `${items.indexOf(item) + 1}. ${item.label} · ${item.path} · ${catalog[item.artifactId]?.service || '?'} ${catalog[item.artifactId]?.version || '미선택'} · ${item.exposedModule}` : '없음';
      changes.push({
        label: `메뉴 ${id}`,
        textFrom: describe(before, beforeMenus),
        textTo: describe(after, afterMenus)
      });
    }
  }
  if (JSON.stringify(current.dashboard) !== JSON.stringify(draft.dashboard)) {
    const describe = items => items === undefined ? '대시보드 미설정' : items.length ? items.map((item, index) => `${index + 1}. ${item.title} · ${catalog[item.artifactId]?.service || '?'} ${catalog[item.artifactId]?.version || '미선택'} · ${item.widgetId || '위젯 미선택'} · ${item.span}칸`).join(' / ') : '빈 대시보드';
    changes.push({
      label: '대시보드 배치',
      textFrom: describe(current.dashboard),
      textTo: describe(draft.dashboard)
    });
  }
  // Include dependency changes beneath registered pages and dashboard widgets.
  const owners = new Set(Object.keys(draft.runtimeBindings || {}));
  for (const owner of owners) for (const alias of Object.keys(catalog[owner]?.runtimeDependencies || {})) {
    const before = current.runtimeBindings?.[owner]?.[alias],
      after = draft.runtimeBindings[owner]?.[alias];
    if (before !== after && !changes.some(change => change.from?.id === before && change.to?.id === after)) add(`${catalog[owner].service} ${shortId(owner)} · ${alias}`, before, after);
  }
  return changes;
}
function payloadFor(current, draft, catalog, rollbackTo) {
  const expectedCompositionId = current.compositionId;
  if (rollbackTo) return {
    expectedCompositionId,
    rollbackTo
  };
  const runtimeBindings = {};
  const visited = new Set();
  function visit(id) {
    if (!id || visited.has(id)) return;
    visited.add(id);
    const artifact = catalog[id];
    if (!artifact) return;
    Object.values(artifact.dependencies || {}).forEach(visit);
    for (const alias of Object.keys(artifact.runtimeDependencies || {})) {
      const target = draft.runtimeBindings[id]?.[alias];
      if (target) {
        (runtimeBindings[id] ||= {})[alias] = target;
        visit(target);
      }
    }
  }
  Object.values(draft.selected).forEach(visit);
  (draft.navigation || []).forEach(item => visit(item.artifactId));
  (draft.dashboard || []).forEach(item => visit(item.artifactId));
  return {
    expectedCompositionId,
    selected: draft.selected,
    runtimeBindings,
    navigation: draft.navigation || [],
    dashboard: draft.dashboard
  };
}

/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js!./src/admin.css"
/*!*************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/admin.css ***!
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
___CSS_LOADER_EXPORT___.push([module.id, `:root { color-scheme:light; --ink:#23314a; --muted:#718096; --line:#e1e7ef; --blue:#315ee8; --paper:#fff; }
* { box-sizing:border-box; }
body { margin:0; background:#f5f7fb; color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif; font-size:14px; line-height:1.65; word-break:keep-all; }
button,input,select { font:inherit; }
button,a,select,input { -webkit-tap-highlight-color:transparent; }
button,a { touch-action:manipulation; }
button { cursor:pointer; }
button:disabled,select:disabled { cursor:default; opacity:.48; }
:focus-visible { outline:3px solid #94b7ff; outline-offset:3px; }
a { color:var(--blue); }
.sidebar { position:fixed; inset:0 auto 0 0; width:218px; padding:26px 18px; background:#111d30; color:#b8c7dd; display:flex; flex-direction:column; }
.brand { display:flex; align-items:center; gap:10px; color:white; text-decoration:none; font-weight:730; font-size:16px; margin-bottom:49px; }
.brand-icon { width:30px; height:30px; display:grid; place-items:center; border-radius:8px; background:#435add; }
.nav-label { font-size:10px; letter-spacing:.15em; font-weight:700; color:#7c8ca5; padding:0 12px; margin-bottom:14px; }
.nav-item { display:flex; gap:12px; padding:13px 12px; border-radius:7px; color:inherit; text-decoration:none; font-size:12px; margin:5px 0; }
.nav-item:hover { background:#1b2a40; }
.nav-item.active { background:#263852; color:white; }
.nav-item span { font-size:15px; }
.sidebar-foot { margin-top:auto; font-size:10px; padding:12px; line-height:2.2; letter-spacing:.05em; }
.sidebar-foot>span:last-child { color:#7c8ca5; letter-spacing:0; }
.live-dot,.environment i,.pill i { width:6px; height:6px; display:inline-block; border-radius:50%; background:#14a279; margin-right:7px; }
.workspace { margin-left:218px; min-width:0; }
.topbar { height:68px; background:white; border-bottom:1px solid var(--line); padding:0 40px; display:flex; align-items:center; justify-content:space-between; color:#69778c; font-size:12px; }
.slash { color:#c0cad9; padding:0 13px; }
.environment { padding:5px 11px; border:1px solid var(--line); border-radius:6px; font-size:11px; }
main { max-width:1260px; margin:auto; padding:40px; }
.page-heading { display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:28px; }
.eyebrow { font-size:10px; letter-spacing:.14em; font-weight:750; color:#7788a6; }
h1 { font-size:29px; letter-spacing:-.04em; margin:7px 0 9px; line-height:1.4; }
.page-heading p { margin:0; color:var(--muted); font-size:13px; }
.heading-actions { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
.button { min-height:40px; border:1px solid #d7dfec; border-radius:7px; padding:8px 14px; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:12px; font-weight:600; text-decoration:none; white-space:nowrap; }
.button.secondary { background:white; color:#4b5b74; }
.button.secondary:hover:not(:disabled) { background:#f0f4fc; border-color:#bccce8; }
.button.primary { background:var(--blue); color:white; border-color:var(--blue); box-shadow:0 2px 4px #315ee819; min-width:104px; }
.button.primary:hover:not(:disabled) { background:#244ed2; }
.button.compact { font-size:11px; min-height:35px; padding:6px 12px; }
.surface { background:var(--paper); border:1px solid var(--line); border-radius:13px; padding:25px 28px; margin-bottom:24px; box-shadow:0 3px 12px #23314a03; }
.section-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:21px; }
h2 { font-size:19px; line-height:1.45; letter-spacing:-.025em; margin:5px 0 0; }
h3 { font-size:14px; letter-spacing:-.02em; margin:0; }
.section-heading p { font-size:12px; margin:7px 0 0; }
.pill { display:inline-flex; align-items:center; flex-shrink:0; background:#edf1f6; color:#758299; font-weight:650; font-size:10px; padding:4px 9px; border-radius:5px; }
.pill.green { background:#e8f6ef; color:#19825f; }
.pill.blue { background:#edf2ff; color:#315ee8; }
.pill.amber { background:#fff5e2; color:#a16b18; }
.muted { color:var(--muted); }
.small { font-size:11px; }
code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px; color:#8491a5; overflow-wrap:anywhere; }
.sdk-rail { background:#f3f6fe; border:1px solid #e1e8fa; border-radius:9px; padding:14px 19px; display:flex; align-items:center; gap:13px; margin-bottom:16px; }
.sdk-rail strong { display:block; font-size:15px; color:#3f588d; }
.sdk-rail>code { margin-left:auto; }
.node-symbol { width:35px; height:35px; display:inline-grid; place-items:center; background:#e2eaff; border-radius:9px; color:#5275cc; font-size:20px; }
.current-paths { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.current-path { display:grid; grid-template-columns:minmax(85px,1.2fr) 24px minmax(65px,1fr) 24px minmax(65px,1fr); gap:4px; align-items:center; border:1px solid #e3e9f2; border-radius:9px; padding:17px 14px; }
.path-service { display:flex; align-items:center; gap:10px; }
.service-letter { display:grid; place-items:center; flex-shrink:0; background:#e8f0ff; color:#3d6acb; font-weight:700; font-size:14px; border-radius:8px; width:32px; height:32px; }
.path-c .service-letter { background:#e1f5ee; color:#2c8d71; }
.path-service strong { display:block; font-size:12px; }
.path-service div>span { font-size:11px; color:var(--muted); }
.connector { color:#b8c4d5; text-align:center; }
.path-node>span { display:block; font-size:10px; color:var(--muted); }
.path-node>strong { font-size:17px; display:block; letter-spacing:-.02em; }
.path-node code { font-size:9px; }
.metadata { margin-top:17px; font-size:11px; color:#8190a7; }
summary { cursor:pointer; width:fit-content; }
dl { display:grid; grid-template-columns:70px minmax(0,1fr); gap:7px; font-size:11px; margin-bottom:0; }
dd { margin:0; overflow-wrap:anywhere; font-family:ui-monospace,monospace; }
.editor-surface { scroll-margin-top:20px; }
.sdk-editor { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:24px; border-bottom:1px solid var(--line); padding:2px 0 21px; margin-bottom:23px; align-items:center; }
.sdk-editor>div:first-child { display:grid; grid-template-columns:35px 1fr; gap:2px 12px; }
.sdk-editor .node-symbol { grid-row:1/3; }
.sdk-editor p { margin:0; color:var(--muted); font-size:11px; }
.sdk-editor h3 { align-self:end; }
.edit-paths { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.path-editor { border:1px solid var(--line); border-radius:10px; padding:19px; }
.path-editor-heading { display:flex; align-items:center; gap:11px; margin-bottom:19px; }
.path-editor-heading p { font-size:10px; color:var(--muted); margin:1px 0 0; }
.version-field { min-width:0; }
.version-field label { display:block; font-weight:600; font-size:11px; color:#55657c; margin-bottom:6px; }
select { width:100%; max-width:100%; background:white; padding:10px 30px 10px 12px; border:1px solid #d5deeb; border-radius:6px; font-size:12px; color:#37485f; min-height:41px; }
select:not(:disabled):hover { border-color:#9cb4da; }
.field-hint { margin:6px 0 0!important; font-size:10px!important; color:#8793a6!important; overflow-wrap:anywhere; }
.dependency-line { color:#a3b1c6; font-size:15px; margin:10px 0 9px; }
.dependency-line span { font-size:10px; padding-left:8px; }
.fixed-version { background:#f7f9fc; padding:12px; border-radius:7px; color:#7d8899; font-size:12px; }
.fixed-version p { font-size:10px; margin:6px 0 0; }
.footnote { color:#8a96a8; font-size:10px; margin:13px 0 0; line-height:1.8; }
.review-panel { margin-top:23px; padding-top:20px; border-top:1px solid var(--line); }
.review-title { display:flex; align-items:center; gap:12px; margin-bottom:9px; }
.review-panel>p { font-size:12px; }
.changes { list-style:none; padding:0; margin:12px 0 16px; }
.changes li { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px dashed #e6ebf2; font-size:12px; }
.changes li>div { display:flex; align-items:center; gap:14px; }
.artifact-label { display:inline-flex; gap:7px; align-items:center; }
.artifact-label strong { font-size:12px; font-weight:600; }
.change-arrow { color:#9dacbf; }
.apply-bar { border:1px solid #dee7f7; background:#f6f8ff; border-radius:9px; display:flex; align-items:center; justify-content:space-between; gap:18px; padding:17px 18px; margin-top:20px; }
.apply-bar strong { font-size:12px; }
.apply-bar p { font-size:10px; color:var(--muted); margin:3px 0 0; }
.apply-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.text-button { background:none; border:0; color:#7b8aa2; font-size:11px; padding:10px 8px; }
.text-button:hover:not(:disabled) { color:var(--blue); }
.search input { border:1px solid var(--line); border-radius:7px; min-height:37px; padding:8px 11px; font-size:11px; width:195px; background:#fafbfd; }
.history-row { display:flex; align-items:center; gap:16px; border-top:1px solid #edf0f5; padding:17px 0; }
.history-row .button { margin-left:auto; flex-shrink:0; }
.history-marker { align-self:flex-start; padding-top:5px; color:#a6b3c6; font-size:17px; }
.is-current .history-marker { color:#22a17a; font-size:12px; }
.history-info { min-width:0; }
.history-title { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
.history-title>strong { font-size:12px; }
.history-info>p { color:#6f7e94; font-size:11px; margin:5px 0 2px; }
.history-date { color:#9aa4b5; font-size:10px; }
.history-reason { color:#ab813d!important; }
.history-info code { color:#9aa4b5; }
.alert { border-radius:9px; padding:15px 20px; margin-bottom:20px; font-size:12px; }
.alert strong { font-size:13px; }
.alert p { margin:4px 0 0; }
.alert.error { background:#fff1ef; border:1px solid #f3d5d0; color:#a74638; }
.alert.success { background:#edf8f2; border:1px solid #d4ebdf; color:#2b7a59; }
.empty,.loading { text-align:center; padding:50px 20px; color:var(--muted); font-size:13px; }
footer { display:flex; justify-content:space-between; gap:15px; color:#96a1b2; font-size:10px; padding:2px 0 18px; }
footer a { color:#8493ae; text-decoration:none; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
@media(max-width:1190px) { main { padding:30px 25px; } .page-heading { align-items:flex-start; } .heading-actions { max-width:180px; } .current-paths { grid-template-columns:1fr; } .current-path { grid-template-columns:minmax(120px,1fr) 45px 1fr 45px 1fr; } .apply-bar { flex-direction:column; align-items:stretch; } .apply-actions { justify-content:flex-end; } }
@media(max-width:850px) { .sidebar { width:185px; padding:25px 12px; } .workspace { margin-left:185px; } .edit-paths,.sdk-editor { grid-template-columns:1fr; } .sdk-editor { gap:18px; } .surface { padding:23px 21px; } .section-heading { flex-wrap:wrap; } .page-heading { flex-direction:column; } .heading-actions { max-width:none; } }
@media(max-width:620px) { .sidebar { position:static; width:auto; padding:15px 18px 10px; } .brand { margin:0 0 12px; font-size:14px; } .sidebar nav { display:flex; gap:6px; overflow:auto; } .nav-item { flex-shrink:0; padding:8px 10px; font-size:11px; margin:0; gap:7px; } .nav-label,.sidebar-foot { display:none; } .workspace { margin:0; } .topbar { height:50px; padding:0 18px; font-size:11px; } main { padding:26px 17px; } h1 { font-size:26px; } .page-heading { gap:16px; } .page-heading p { font-size:12px; } .surface { padding:20px 17px; border-radius:10px; } h2 { font-size:18px; } .current-path { grid-template-columns:1fr 23px 1fr; padding:14px 15px; gap:8px; } .path-service { grid-column:1/-1; border-bottom:1px solid var(--line); padding-bottom:11px; margin-bottom:4px; } .path-service+.connector { display:none; } .path-node { text-align:center; } .path-node>strong { font-size:19px; } .sdk-rail { padding:13px 12px; gap:10px; } .sdk-rail>code { display:none; } .sdk-rail strong { font-size:14px; } .edit-paths { gap:16px; } .path-editor { padding:16px; } .apply-bar { padding:15px 12px; } .apply-actions { flex-wrap:wrap; justify-content:flex-start; } .apply-actions .text-button { flex-basis:100%; text-align:left; padding:0 0 4px; } .apply-actions .button { flex:1; } .changes li { align-items:flex-start; flex-direction:column; gap:5px; } .changes li>div { justify-content:space-between; width:100%; gap:8px; } .artifact-label { gap:5px; } .history-row { gap:10px; flex-wrap:wrap; } .history-info { flex:1; } .history-row .button { margin-left:24px; } .history-title { gap:8px; } .search { width:100%; } .search input { width:100%; } .history-surface .section-heading { gap:15px; } footer { flex-direction:column; gap:6px; } }
@media(prefers-reduced-motion:reduce) { * { scroll-behavior:auto!important; } }
.management-tabs { display:flex; gap:24px; border-bottom:1px solid var(--line); margin:-6px 0 25px; }
.management-tabs a { padding:10px 2px 13px; color:var(--muted); text-decoration:none; font-weight:650; font-size:13px; border-bottom:3px solid transparent; }
.management-tabs a[aria-current] { color:var(--blue); border-color:var(--blue); }
.lifecycle-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:18px; padding:16px 0; border-top:1px solid var(--line); }
.lifecycle-stats strong { display:block; font-size:27px; font-weight:650; color:#385b95; }
.lifecycle-stats span { display:block; font-size:11px; color:var(--muted); }
.lifecycle-filters { display:grid; grid-template-columns:minmax(0,1fr) 145px 175px; gap:10px; margin-bottom:17px; }
.lifecycle-filters input { width:100%; min-height:41px; border:1px solid #d5deeb; border-radius:7px; background:white; padding:9px 13px; font-size:12px; }
.lifecycle-workspace { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); gap:20px; align-items:start; }
.release-list { padding:14px; }
.release-list>p { padding:0 9px; }
.release-row { display:grid; grid-template-columns:minmax(80px,.85fr) minmax(100px,1.2fr) minmax(80px,.8fr); gap:10px; padding:17px 12px; width:100%; background:white; border:1px solid transparent; border-top-color:#edf0f5; text-align:left; color:var(--ink); border-radius:7px; }
.release-row:hover { background:#f7f9fe; }
.release-row.selected { background:#f1f5ff; border-color:#bdcffa; }
.release-name strong { display:block; font-size:13px; }
.release-name code { display:block; margin-top:4px; }
.release-usage { font-size:10px; color:var(--muted); }
.release-usage strong { display:block; font-weight:550; color:#586b87; font-size:11px; }
.release-usage>span { display:block; margin-top:3px; }
.release-status>span { display:block; width:fit-content; font-size:10px; margin-bottom:3px; }
.release-status>span:not(.pill) { color:var(--muted); }
.release-status .eligible { color:#19825f!important; }
.release-detail-wrap { position:sticky; top:20px; min-width:0; scroll-margin-top:20px; max-height:calc(100vh - 40px); overflow-y:auto; scrollbar-width:thin; }
.release-detail { padding:24px; }
.full-artifact-id { display:block; margin-top:8px; }
.detail-section { border-top:1px solid var(--line); margin-top:20px; padding-top:18px; }
.usage-paths,.blocker-list { padding-left:17px; margin:10px 0; font-size:11px; color:#62718a; }
.usage-paths li,.blocker-list li { margin:7px 0; }
.session-list { padding:0; margin:0; list-style:none; }
.session-list li { padding:11px; background:#f8faff; border-radius:7px; margin-bottom:8px; }
.session-list li>div { display:flex; flex-wrap:wrap; gap:7px; }
.session-list p { font-size:11px; margin:8px 0 3px; overflow-wrap:anywhere; }
.deletion-assessment details { font-size:11px; margin-top:12px; }
.reference-list { padding-left:15px; color:var(--muted); }
.reference-list li { margin:7px 0; }
.reference-list code { display:block; }
.support-editor { margin-top:22px; padding-top:20px; border-top:1px solid var(--line); }
.support-editor label { display:block; font-size:11px; font-weight:650; margin:14px 0 6px; }
.support-editor label span { display:block; font-size:10px; font-weight:400; color:var(--muted); }
.support-editor input,.support-editor textarea { font:inherit; font-size:12px; width:100%; max-width:100%; border:1px solid #d5deeb; border-radius:6px; padding:10px; background:white; color:var(--ink); }
.support-editor textarea { resize:vertical; }
.support-actions { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:14px; }
.form-error,.form-success { padding:10px 12px; border-radius:6px; font-size:11px; }
.form-error { background:#fff1ef; color:#a74638; }
.form-success { background:#edf8f2; color:#2b7a59; }
.button.danger { background:#b63d36; border-color:#b63d36; color:white; }
.button.danger:hover:not(:disabled) { background:#982e29; }
.retirement-buttons { display:flex; flex-wrap:wrap; gap:8px; }
.retirement-actions .review-title { flex-wrap:wrap; }
.retirement-references { margin-top:18px; font-size:11px; }
.retirement-confirm { background:#fff9f4; border:1px solid #eddbcc; padding:16px; border-radius:8px; margin-top:18px; }
.retirement-confirm>code { display:block; margin:10px 0; }
.retirement-confirm>label { display:block; margin:12px 0 6px; font-size:11px; font-weight:600; }
.retirement-confirm input:not([type="checkbox"]),.retirement-confirm textarea { font:inherit; font-size:12px; width:100%; max-width:100%; padding:9px; border:1px solid #d5deeb; border-radius:6px; background:white; }
.retirement-confirm textarea { resize:vertical; }
.retirement-confirm .external-confirm { display:flex; align-items:flex-start; gap:8px; line-height:1.7; }
.external-confirm input { margin-top:3px; flex-shrink:0; }
.detail-placeholder { padding:65px 12px; }
.detail-placeholder>span { font-size:32px; color:#9db2d8; display:block; margin-bottom:15px; }
.detail-placeholder p { font-size:12px; }
@media(max-width:1200px) { .lifecycle-workspace { grid-template-columns:minmax(0,1fr); } .release-detail-wrap { position:static; max-height:none; overflow:visible; } }
@media(max-width:620px) { .management-tabs { gap:18px; } .management-tabs a { font-size:12px; } .lifecycle-stats { grid-template-columns:1fr 1fr; gap:10px; } .lifecycle-filters { grid-template-columns:1fr 1fr; } .lifecycle-filters>label { grid-column:1/-1; } .lifecycle-filters select { font-size:11px; padding-left:9px; } .release-list { padding:10px; } .release-row { grid-template-columns:minmax(70px,.8fr) minmax(100px,1.3fr) minmax(70px,.8fr); gap:7px; padding:14px 8px; } .release-name strong { font-size:12px; } .release-usage>span,.release-status>span { font-size:9px; } .release-status .pill { padding:3px 6px; } .release-detail { padding:20px 17px; } }

.menu-editor{margin:24px 0}.menu-card{min-width:0;border:1px solid #dce3ed;border-radius:12px;padding:20px;margin:18px 0}.menu-card legend{font-weight:700;padding:0 8px}.menu-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.menu-fields label,.menu-dependency label{display:grid;gap:8px;font-size:14px;font-weight:600}.menu-fields input,.menu-fields select,.menu-dependency select{width:100%;min-width:0;font:inherit;padding:10px;border:1px solid #aab8cb;border-radius:6px;background:white;color:#172438}.menu-actions{display:flex;gap:8px;margin-top:16px}.menu-dependency{padding:12px;border-left:2px solid #cbd5ea;margin-top:12px}.management-tabs{flex-wrap:wrap}.changes li>div{flex-wrap:wrap;overflow-wrap:anywhere}@media(max-width:650px){.menu-fields{grid-template-columns:1fr}.menu-card{padding:14px}}

.dashboard-preview { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; padding: 16px; border: 1px dashed #b6c6df; border-radius: 12px; background: #f6f8fd; margin-top: 20px; }
.preview-tile { min-width: 0; display: grid; gap: 6px; padding: 20px; border-radius: 8px; border: 1px solid #d8e3f4; background: white; overflow-wrap: anywhere; }
.preview-tile span { color: #64748b; font-size: 12px; }
.preview-span-2 { grid-column: span 2; }
@media(max-width:650px) { .dashboard-preview { grid-template-columns: minmax(0,1fr); } .preview-span-2 { grid-column: span 1; } }
`, "",{"version":3,"sources":["webpack://./src/admin.css"],"names":[],"mappings":"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","sourcesContent":[":root { color-scheme:light; --ink:#23314a; --muted:#718096; --line:#e1e7ef; --blue:#315ee8; --paper:#fff; }\n* { box-sizing:border-box; }\nbody { margin:0; background:#f5f7fb; color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,\"Apple SD Gothic Neo\",\"Malgun Gothic\",sans-serif; font-size:14px; line-height:1.65; word-break:keep-all; }\nbutton,input,select { font:inherit; }\nbutton,a,select,input { -webkit-tap-highlight-color:transparent; }\nbutton,a { touch-action:manipulation; }\nbutton { cursor:pointer; }\nbutton:disabled,select:disabled { cursor:default; opacity:.48; }\n:focus-visible { outline:3px solid #94b7ff; outline-offset:3px; }\na { color:var(--blue); }\n.sidebar { position:fixed; inset:0 auto 0 0; width:218px; padding:26px 18px; background:#111d30; color:#b8c7dd; display:flex; flex-direction:column; }\n.brand { display:flex; align-items:center; gap:10px; color:white; text-decoration:none; font-weight:730; font-size:16px; margin-bottom:49px; }\n.brand-icon { width:30px; height:30px; display:grid; place-items:center; border-radius:8px; background:#435add; }\n.nav-label { font-size:10px; letter-spacing:.15em; font-weight:700; color:#7c8ca5; padding:0 12px; margin-bottom:14px; }\n.nav-item { display:flex; gap:12px; padding:13px 12px; border-radius:7px; color:inherit; text-decoration:none; font-size:12px; margin:5px 0; }\n.nav-item:hover { background:#1b2a40; }\n.nav-item.active { background:#263852; color:white; }\n.nav-item span { font-size:15px; }\n.sidebar-foot { margin-top:auto; font-size:10px; padding:12px; line-height:2.2; letter-spacing:.05em; }\n.sidebar-foot>span:last-child { color:#7c8ca5; letter-spacing:0; }\n.live-dot,.environment i,.pill i { width:6px; height:6px; display:inline-block; border-radius:50%; background:#14a279; margin-right:7px; }\n.workspace { margin-left:218px; min-width:0; }\n.topbar { height:68px; background:white; border-bottom:1px solid var(--line); padding:0 40px; display:flex; align-items:center; justify-content:space-between; color:#69778c; font-size:12px; }\n.slash { color:#c0cad9; padding:0 13px; }\n.environment { padding:5px 11px; border:1px solid var(--line); border-radius:6px; font-size:11px; }\nmain { max-width:1260px; margin:auto; padding:40px; }\n.page-heading { display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:28px; }\n.eyebrow { font-size:10px; letter-spacing:.14em; font-weight:750; color:#7788a6; }\nh1 { font-size:29px; letter-spacing:-.04em; margin:7px 0 9px; line-height:1.4; }\n.page-heading p { margin:0; color:var(--muted); font-size:13px; }\n.heading-actions { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }\n.button { min-height:40px; border:1px solid #d7dfec; border-radius:7px; padding:8px 14px; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:12px; font-weight:600; text-decoration:none; white-space:nowrap; }\n.button.secondary { background:white; color:#4b5b74; }\n.button.secondary:hover:not(:disabled) { background:#f0f4fc; border-color:#bccce8; }\n.button.primary { background:var(--blue); color:white; border-color:var(--blue); box-shadow:0 2px 4px #315ee819; min-width:104px; }\n.button.primary:hover:not(:disabled) { background:#244ed2; }\n.button.compact { font-size:11px; min-height:35px; padding:6px 12px; }\n.surface { background:var(--paper); border:1px solid var(--line); border-radius:13px; padding:25px 28px; margin-bottom:24px; box-shadow:0 3px 12px #23314a03; }\n.section-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:21px; }\nh2 { font-size:19px; line-height:1.45; letter-spacing:-.025em; margin:5px 0 0; }\nh3 { font-size:14px; letter-spacing:-.02em; margin:0; }\n.section-heading p { font-size:12px; margin:7px 0 0; }\n.pill { display:inline-flex; align-items:center; flex-shrink:0; background:#edf1f6; color:#758299; font-weight:650; font-size:10px; padding:4px 9px; border-radius:5px; }\n.pill.green { background:#e8f6ef; color:#19825f; }\n.pill.blue { background:#edf2ff; color:#315ee8; }\n.pill.amber { background:#fff5e2; color:#a16b18; }\n.muted { color:var(--muted); }\n.small { font-size:11px; }\ncode { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px; color:#8491a5; overflow-wrap:anywhere; }\n.sdk-rail { background:#f3f6fe; border:1px solid #e1e8fa; border-radius:9px; padding:14px 19px; display:flex; align-items:center; gap:13px; margin-bottom:16px; }\n.sdk-rail strong { display:block; font-size:15px; color:#3f588d; }\n.sdk-rail>code { margin-left:auto; }\n.node-symbol { width:35px; height:35px; display:inline-grid; place-items:center; background:#e2eaff; border-radius:9px; color:#5275cc; font-size:20px; }\n.current-paths { display:grid; grid-template-columns:1fr 1fr; gap:16px; }\n.current-path { display:grid; grid-template-columns:minmax(85px,1.2fr) 24px minmax(65px,1fr) 24px minmax(65px,1fr); gap:4px; align-items:center; border:1px solid #e3e9f2; border-radius:9px; padding:17px 14px; }\n.path-service { display:flex; align-items:center; gap:10px; }\n.service-letter { display:grid; place-items:center; flex-shrink:0; background:#e8f0ff; color:#3d6acb; font-weight:700; font-size:14px; border-radius:8px; width:32px; height:32px; }\n.path-c .service-letter { background:#e1f5ee; color:#2c8d71; }\n.path-service strong { display:block; font-size:12px; }\n.path-service div>span { font-size:11px; color:var(--muted); }\n.connector { color:#b8c4d5; text-align:center; }\n.path-node>span { display:block; font-size:10px; color:var(--muted); }\n.path-node>strong { font-size:17px; display:block; letter-spacing:-.02em; }\n.path-node code { font-size:9px; }\n.metadata { margin-top:17px; font-size:11px; color:#8190a7; }\nsummary { cursor:pointer; width:fit-content; }\ndl { display:grid; grid-template-columns:70px minmax(0,1fr); gap:7px; font-size:11px; margin-bottom:0; }\ndd { margin:0; overflow-wrap:anywhere; font-family:ui-monospace,monospace; }\n.editor-surface { scroll-margin-top:20px; }\n.sdk-editor { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:24px; border-bottom:1px solid var(--line); padding:2px 0 21px; margin-bottom:23px; align-items:center; }\n.sdk-editor>div:first-child { display:grid; grid-template-columns:35px 1fr; gap:2px 12px; }\n.sdk-editor .node-symbol { grid-row:1/3; }\n.sdk-editor p { margin:0; color:var(--muted); font-size:11px; }\n.sdk-editor h3 { align-self:end; }\n.edit-paths { display:grid; grid-template-columns:1fr 1fr; gap:20px; }\n.path-editor { border:1px solid var(--line); border-radius:10px; padding:19px; }\n.path-editor-heading { display:flex; align-items:center; gap:11px; margin-bottom:19px; }\n.path-editor-heading p { font-size:10px; color:var(--muted); margin:1px 0 0; }\n.version-field { min-width:0; }\n.version-field label { display:block; font-weight:600; font-size:11px; color:#55657c; margin-bottom:6px; }\nselect { width:100%; max-width:100%; background:white; padding:10px 30px 10px 12px; border:1px solid #d5deeb; border-radius:6px; font-size:12px; color:#37485f; min-height:41px; }\nselect:not(:disabled):hover { border-color:#9cb4da; }\n.field-hint { margin:6px 0 0!important; font-size:10px!important; color:#8793a6!important; overflow-wrap:anywhere; }\n.dependency-line { color:#a3b1c6; font-size:15px; margin:10px 0 9px; }\n.dependency-line span { font-size:10px; padding-left:8px; }\n.fixed-version { background:#f7f9fc; padding:12px; border-radius:7px; color:#7d8899; font-size:12px; }\n.fixed-version p { font-size:10px; margin:6px 0 0; }\n.footnote { color:#8a96a8; font-size:10px; margin:13px 0 0; line-height:1.8; }\n.review-panel { margin-top:23px; padding-top:20px; border-top:1px solid var(--line); }\n.review-title { display:flex; align-items:center; gap:12px; margin-bottom:9px; }\n.review-panel>p { font-size:12px; }\n.changes { list-style:none; padding:0; margin:12px 0 16px; }\n.changes li { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px dashed #e6ebf2; font-size:12px; }\n.changes li>div { display:flex; align-items:center; gap:14px; }\n.artifact-label { display:inline-flex; gap:7px; align-items:center; }\n.artifact-label strong { font-size:12px; font-weight:600; }\n.change-arrow { color:#9dacbf; }\n.apply-bar { border:1px solid #dee7f7; background:#f6f8ff; border-radius:9px; display:flex; align-items:center; justify-content:space-between; gap:18px; padding:17px 18px; margin-top:20px; }\n.apply-bar strong { font-size:12px; }\n.apply-bar p { font-size:10px; color:var(--muted); margin:3px 0 0; }\n.apply-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }\n.text-button { background:none; border:0; color:#7b8aa2; font-size:11px; padding:10px 8px; }\n.text-button:hover:not(:disabled) { color:var(--blue); }\n.search input { border:1px solid var(--line); border-radius:7px; min-height:37px; padding:8px 11px; font-size:11px; width:195px; background:#fafbfd; }\n.history-row { display:flex; align-items:center; gap:16px; border-top:1px solid #edf0f5; padding:17px 0; }\n.history-row .button { margin-left:auto; flex-shrink:0; }\n.history-marker { align-self:flex-start; padding-top:5px; color:#a6b3c6; font-size:17px; }\n.is-current .history-marker { color:#22a17a; font-size:12px; }\n.history-info { min-width:0; }\n.history-title { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }\n.history-title>strong { font-size:12px; }\n.history-info>p { color:#6f7e94; font-size:11px; margin:5px 0 2px; }\n.history-date { color:#9aa4b5; font-size:10px; }\n.history-reason { color:#ab813d!important; }\n.history-info code { color:#9aa4b5; }\n.alert { border-radius:9px; padding:15px 20px; margin-bottom:20px; font-size:12px; }\n.alert strong { font-size:13px; }\n.alert p { margin:4px 0 0; }\n.alert.error { background:#fff1ef; border:1px solid #f3d5d0; color:#a74638; }\n.alert.success { background:#edf8f2; border:1px solid #d4ebdf; color:#2b7a59; }\n.empty,.loading { text-align:center; padding:50px 20px; color:var(--muted); font-size:13px; }\nfooter { display:flex; justify-content:space-between; gap:15px; color:#96a1b2; font-size:10px; padding:2px 0 18px; }\nfooter a { color:#8493ae; text-decoration:none; }\n.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }\n@media(max-width:1190px) { main { padding:30px 25px; } .page-heading { align-items:flex-start; } .heading-actions { max-width:180px; } .current-paths { grid-template-columns:1fr; } .current-path { grid-template-columns:minmax(120px,1fr) 45px 1fr 45px 1fr; } .apply-bar { flex-direction:column; align-items:stretch; } .apply-actions { justify-content:flex-end; } }\n@media(max-width:850px) { .sidebar { width:185px; padding:25px 12px; } .workspace { margin-left:185px; } .edit-paths,.sdk-editor { grid-template-columns:1fr; } .sdk-editor { gap:18px; } .surface { padding:23px 21px; } .section-heading { flex-wrap:wrap; } .page-heading { flex-direction:column; } .heading-actions { max-width:none; } }\n@media(max-width:620px) { .sidebar { position:static; width:auto; padding:15px 18px 10px; } .brand { margin:0 0 12px; font-size:14px; } .sidebar nav { display:flex; gap:6px; overflow:auto; } .nav-item { flex-shrink:0; padding:8px 10px; font-size:11px; margin:0; gap:7px; } .nav-label,.sidebar-foot { display:none; } .workspace { margin:0; } .topbar { height:50px; padding:0 18px; font-size:11px; } main { padding:26px 17px; } h1 { font-size:26px; } .page-heading { gap:16px; } .page-heading p { font-size:12px; } .surface { padding:20px 17px; border-radius:10px; } h2 { font-size:18px; } .current-path { grid-template-columns:1fr 23px 1fr; padding:14px 15px; gap:8px; } .path-service { grid-column:1/-1; border-bottom:1px solid var(--line); padding-bottom:11px; margin-bottom:4px; } .path-service+.connector { display:none; } .path-node { text-align:center; } .path-node>strong { font-size:19px; } .sdk-rail { padding:13px 12px; gap:10px; } .sdk-rail>code { display:none; } .sdk-rail strong { font-size:14px; } .edit-paths { gap:16px; } .path-editor { padding:16px; } .apply-bar { padding:15px 12px; } .apply-actions { flex-wrap:wrap; justify-content:flex-start; } .apply-actions .text-button { flex-basis:100%; text-align:left; padding:0 0 4px; } .apply-actions .button { flex:1; } .changes li { align-items:flex-start; flex-direction:column; gap:5px; } .changes li>div { justify-content:space-between; width:100%; gap:8px; } .artifact-label { gap:5px; } .history-row { gap:10px; flex-wrap:wrap; } .history-info { flex:1; } .history-row .button { margin-left:24px; } .history-title { gap:8px; } .search { width:100%; } .search input { width:100%; } .history-surface .section-heading { gap:15px; } footer { flex-direction:column; gap:6px; } }\n@media(prefers-reduced-motion:reduce) { * { scroll-behavior:auto!important; } }\n.management-tabs { display:flex; gap:24px; border-bottom:1px solid var(--line); margin:-6px 0 25px; }\n.management-tabs a { padding:10px 2px 13px; color:var(--muted); text-decoration:none; font-weight:650; font-size:13px; border-bottom:3px solid transparent; }\n.management-tabs a[aria-current] { color:var(--blue); border-color:var(--blue); }\n.lifecycle-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:18px; padding:16px 0; border-top:1px solid var(--line); }\n.lifecycle-stats strong { display:block; font-size:27px; font-weight:650; color:#385b95; }\n.lifecycle-stats span { display:block; font-size:11px; color:var(--muted); }\n.lifecycle-filters { display:grid; grid-template-columns:minmax(0,1fr) 145px 175px; gap:10px; margin-bottom:17px; }\n.lifecycle-filters input { width:100%; min-height:41px; border:1px solid #d5deeb; border-radius:7px; background:white; padding:9px 13px; font-size:12px; }\n.lifecycle-workspace { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); gap:20px; align-items:start; }\n.release-list { padding:14px; }\n.release-list>p { padding:0 9px; }\n.release-row { display:grid; grid-template-columns:minmax(80px,.85fr) minmax(100px,1.2fr) minmax(80px,.8fr); gap:10px; padding:17px 12px; width:100%; background:white; border:1px solid transparent; border-top-color:#edf0f5; text-align:left; color:var(--ink); border-radius:7px; }\n.release-row:hover { background:#f7f9fe; }\n.release-row.selected { background:#f1f5ff; border-color:#bdcffa; }\n.release-name strong { display:block; font-size:13px; }\n.release-name code { display:block; margin-top:4px; }\n.release-usage { font-size:10px; color:var(--muted); }\n.release-usage strong { display:block; font-weight:550; color:#586b87; font-size:11px; }\n.release-usage>span { display:block; margin-top:3px; }\n.release-status>span { display:block; width:fit-content; font-size:10px; margin-bottom:3px; }\n.release-status>span:not(.pill) { color:var(--muted); }\n.release-status .eligible { color:#19825f!important; }\n.release-detail-wrap { position:sticky; top:20px; min-width:0; scroll-margin-top:20px; max-height:calc(100vh - 40px); overflow-y:auto; scrollbar-width:thin; }\n.release-detail { padding:24px; }\n.full-artifact-id { display:block; margin-top:8px; }\n.detail-section { border-top:1px solid var(--line); margin-top:20px; padding-top:18px; }\n.usage-paths,.blocker-list { padding-left:17px; margin:10px 0; font-size:11px; color:#62718a; }\n.usage-paths li,.blocker-list li { margin:7px 0; }\n.session-list { padding:0; margin:0; list-style:none; }\n.session-list li { padding:11px; background:#f8faff; border-radius:7px; margin-bottom:8px; }\n.session-list li>div { display:flex; flex-wrap:wrap; gap:7px; }\n.session-list p { font-size:11px; margin:8px 0 3px; overflow-wrap:anywhere; }\n.deletion-assessment details { font-size:11px; margin-top:12px; }\n.reference-list { padding-left:15px; color:var(--muted); }\n.reference-list li { margin:7px 0; }\n.reference-list code { display:block; }\n.support-editor { margin-top:22px; padding-top:20px; border-top:1px solid var(--line); }\n.support-editor label { display:block; font-size:11px; font-weight:650; margin:14px 0 6px; }\n.support-editor label span { display:block; font-size:10px; font-weight:400; color:var(--muted); }\n.support-editor input,.support-editor textarea { font:inherit; font-size:12px; width:100%; max-width:100%; border:1px solid #d5deeb; border-radius:6px; padding:10px; background:white; color:var(--ink); }\n.support-editor textarea { resize:vertical; }\n.support-actions { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:14px; }\n.form-error,.form-success { padding:10px 12px; border-radius:6px; font-size:11px; }\n.form-error { background:#fff1ef; color:#a74638; }\n.form-success { background:#edf8f2; color:#2b7a59; }\n.button.danger { background:#b63d36; border-color:#b63d36; color:white; }\n.button.danger:hover:not(:disabled) { background:#982e29; }\n.retirement-buttons { display:flex; flex-wrap:wrap; gap:8px; }\n.retirement-actions .review-title { flex-wrap:wrap; }\n.retirement-references { margin-top:18px; font-size:11px; }\n.retirement-confirm { background:#fff9f4; border:1px solid #eddbcc; padding:16px; border-radius:8px; margin-top:18px; }\n.retirement-confirm>code { display:block; margin:10px 0; }\n.retirement-confirm>label { display:block; margin:12px 0 6px; font-size:11px; font-weight:600; }\n.retirement-confirm input:not([type=\"checkbox\"]),.retirement-confirm textarea { font:inherit; font-size:12px; width:100%; max-width:100%; padding:9px; border:1px solid #d5deeb; border-radius:6px; background:white; }\n.retirement-confirm textarea { resize:vertical; }\n.retirement-confirm .external-confirm { display:flex; align-items:flex-start; gap:8px; line-height:1.7; }\n.external-confirm input { margin-top:3px; flex-shrink:0; }\n.detail-placeholder { padding:65px 12px; }\n.detail-placeholder>span { font-size:32px; color:#9db2d8; display:block; margin-bottom:15px; }\n.detail-placeholder p { font-size:12px; }\n@media(max-width:1200px) { .lifecycle-workspace { grid-template-columns:minmax(0,1fr); } .release-detail-wrap { position:static; max-height:none; overflow:visible; } }\n@media(max-width:620px) { .management-tabs { gap:18px; } .management-tabs a { font-size:12px; } .lifecycle-stats { grid-template-columns:1fr 1fr; gap:10px; } .lifecycle-filters { grid-template-columns:1fr 1fr; } .lifecycle-filters>label { grid-column:1/-1; } .lifecycle-filters select { font-size:11px; padding-left:9px; } .release-list { padding:10px; } .release-row { grid-template-columns:minmax(70px,.8fr) minmax(100px,1.3fr) minmax(70px,.8fr); gap:7px; padding:14px 8px; } .release-name strong { font-size:12px; } .release-usage>span,.release-status>span { font-size:9px; } .release-status .pill { padding:3px 6px; } .release-detail { padding:20px 17px; } }\n\n.menu-editor{margin:24px 0}.menu-card{min-width:0;border:1px solid #dce3ed;border-radius:12px;padding:20px;margin:18px 0}.menu-card legend{font-weight:700;padding:0 8px}.menu-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.menu-fields label,.menu-dependency label{display:grid;gap:8px;font-size:14px;font-weight:600}.menu-fields input,.menu-fields select,.menu-dependency select{width:100%;min-width:0;font:inherit;padding:10px;border:1px solid #aab8cb;border-radius:6px;background:white;color:#172438}.menu-actions{display:flex;gap:8px;margin-top:16px}.menu-dependency{padding:12px;border-left:2px solid #cbd5ea;margin-top:12px}.management-tabs{flex-wrap:wrap}.changes li>div{flex-wrap:wrap;overflow-wrap:anywhere}@media(max-width:650px){.menu-fields{grid-template-columns:1fr}.menu-card{padding:14px}}\n\n.dashboard-preview { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; padding: 16px; border: 1px dashed #b6c6df; border-radius: 12px; background: #f6f8fd; margin-top: 20px; }\n.preview-tile { min-width: 0; display: grid; gap: 6px; padding: 20px; border-radius: 8px; border: 1px solid #d8e3f4; background: white; overflow-wrap: anywhere; }\n.preview-tile span { color: #64748b; font-size: 12px; }\n.preview-span-2 { grid-column: span 2; }\n@media(max-width:650px) { .dashboard-preview { grid-template-columns: minmax(0,1fr); } .preview-span-2 { grid-column: span 1; } }\n"],"sourceRoot":""}]);
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

/***/ "./src/admin.css"
/*!***********************!*\
  !*** ./src/admin.css ***!
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
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_admin_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./admin.css */ "./node_modules/css-loader/dist/cjs.js!./src/admin.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_admin_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_admin_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_admin_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_admin_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


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
//# sourceMappingURL=src_bootstrap_jsx.29c4f2aa6d2c9678d388.js.map