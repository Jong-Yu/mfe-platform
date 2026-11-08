"use strict";
(self["webpackChunksubscriptions_1_0_0_1b9bbc0f539d"] = self["webpackChunksubscriptions_1_0_0_1b9bbc0f539d"] || []).push([["src_bootstrap_jsx"],{

/***/ "./src/bootstrap.jsx"
/*!***************************!*\
  !*** ./src/bootstrap.jsx ***!
  \***************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom/client */ "webpack/sharing/consume/default/react-dom/client/react-dom/client");
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./style.css */ "./src/style.css");



async function request(endpoint, body, token) {
  const response = await fetch('/api/subscriptions/' + endpoint, {
    method: body ? 'POST' : 'GET',
    cache: 'no-store',
    headers: body ? {
      'Content-Type': 'application/json',
      ...(token ? {
        'X-MFE-CSRF': token
      } : {})
    } : {},
    ...(body ? {
      body: JSON.stringify(body)
    } : {})
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || '요청을 처리하지 못했습니다.');
  return result;
}
function App() {
  const [session, setSession] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    [identity, setIdentity] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('alice');
  const [data, setData] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    [draft, setDraft] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),
    [review, setReview] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [busy, setBusy] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [notice, setNotice] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(''),
    [confirm, setConfirm] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  function accept(next) {
    setData(next);
    setDraft({
      expectedRevision: next.subscription.revision,
      baseCompositionId: next.subscription.baseCompositionId || next.bases.find(b => !b.retired)?.compositionId || '',
      dashboard: next.subscription.dashboard || []
    });
    setReview(null);
    setConfirm(false);
  }
  async function load() {
    const s = await request('session');
    setSession(s);
    if (s.user) {
      setIdentity(s.user.id);
      accept(await request('state'));
    } else {
      setData(null);
      setDraft(null);
    }
  }
  ;(0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    let alive = true;
    request('session').then(async s => {
      if (!alive) return;
      setSession(s);
      if (s.user) {
        setIdentity(s.user.id);
        const next = await request('state');
        if (alive) accept(next);
      }
    }).catch(e => {
      if (alive) setError(e.message);
    });
    return () => {
      alive = false;
    };
  }, []);
  async function action(work) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
    } catch (e) {
      setError(e.message);
      setReview(null);
    } finally {
      setBusy(false);
    }
  }
  function edit(value) {
    setDraft(value);
    setReview(null);
    setNotice('');
    setError('');
    setConfirm(false);
  }
  function update(index, change) {
    edit({
      ...draft,
      dashboard: draft.dashboard.map((w, i) => i === index ? {
        ...w,
        ...change
      } : w)
    });
  }
  function add() {
    const first = data.widgets.find(w => w.selectionState === 'available');
    if (!first) return;
    let number = 1;
    while (draft.dashboard.some(w => w.id === `widget-${number}`)) number++;
    edit({
      ...draft,
      dashboard: [...draft.dashboard, {
        id: `widget-${number}`,
        title: first.title,
        artifactId: first.artifactId,
        widgetId: first.id,
        span: 1
      }]
    });
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "app"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("header", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    className: "brand",
    href: "/subscriptions"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "M"), " Platform Lab"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("nav", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "/admin#lifecycle"
  }, "\uC0AC\uC6A9 \uD604\uD669\xB7\uC0AD\uC81C \uAD00\uB9AC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    href: "/guide"
  }, "\uC124\uBA85\uC11C"))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("main", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "eyebrow"
  }, "PERSONAL SUBSCRIPTIONS \xB7 EXAMPLE 20"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", null, "\uB0B4\uAC00 \uC0AC\uC6A9\uD558\uB294 \uC704\uC82F\uACFC \uBC84\uC804"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "intro"
  }, "\uBC30\uD3EC \uC870\uD569\uC744 \uACE0\uB974\uACE0 \uD544\uC694\uD55C \uC704\uC82F\uC744 \uC800\uC7A5\uD558\uC138\uC694. \uAE30\uC874 \uD0ED\uC740 \uC720\uC9C0\uD558\uACE0, \uC0C8\uB85C \uC5EC\uB294 \uD654\uBA74\uBD80\uD130 \uC801\uC6A9\uD569\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "identity"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", null, "\uB370\uBAA8 \uC0AC\uC6A9\uC790"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC2E4\uC11C\uBE44\uC2A4 \uB85C\uADF8\uC778 \uB300\uC2E0 \uC0AC\uC6A9\uD558\uB294 \uB85C\uCEEC \uC608\uC81C\uC785\uB2C8\uB2E4. \uB2E4\uB978 \uC0AC\uC6A9\uC790\uB97C \uB3D9\uC2DC\uC5D0 \uBE44\uAD50\uD558\uB824\uBA74 \uBCC4\uB3C4 \uBE0C\uB77C\uC6B0\uC800 \uD504\uB85C\uD544\uC744 \uC0AC\uC6A9\uD558\uC138\uC694.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "controls"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uC0AC\uC6A9\uC790", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
    "data-testid": "demo-user",
    value: identity,
    disabled: busy,
    onChange: e => setIdentity(e.target.value)
  }, (session?.users || [{
    id: 'alice',
    name: 'Alice'
  }, {
    id: 'bob',
    name: 'Bob'
  }, {
    id: 'carol',
    name: 'Carol'
  }]).map(u => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    key: u.id,
    value: u.id
  }, u.name)))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "login",
    disabled: busy,
    onClick: () => action(async () => {
      await request('login', {
        userId: identity
      });
      await load();
    })
  }, "\uC774 \uC0AC\uC6A9\uC790\uB85C \uACC4\uC18D"))), error && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "alert",
    role: "alert",
    "data-testid": "subscription-error"
  }, error), notice && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "success",
    role: "status",
    "data-testid": "subscription-notice"
  }, notice), data && draft ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "saved"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: "eyebrow"
  }, "SAVED FOR ", data.user.name.toUpperCase()), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", {
    "data-testid": "saved-user"
  }, data.user.name, "\uC758 \uAD6C\uB3C5"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    "data-testid": "saved-status"
  }, data.subscription.active ? `저장됨 · 위젯 ${data.subscription.dashboard.length}개 · 변경 번호 ${data.subscription.revision}` : '저장된 구독이 없습니다.'), data.subscription.active && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("details", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("summary", null, "\uACE0\uC815\uD55C \uBC30\uD3EC \uC870\uD569 \uD655\uC778"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("code", {
    "data-testid": "saved-composition"
  }, data.subscription.compositionId))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "controls"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "secondary",
    disabled: busy,
    "data-testid": "reload-subscription",
    onClick: () => action(load)
  }, "\uC800\uC7A5\uB41C \uAD6C\uB3C5 \uBD88\uB7EC\uC624\uAE30"), data.subscription.active && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("a", {
    className: "button",
    "data-testid": "open-dashboard",
    href: "/",
    target: "_blank",
    rel: "noreferrer"
  }, "\uB0B4 \uB300\uC2DC\uBCF4\uB4DC \uC0C8 \uD0ED \u2197"))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", null, "1. \uC0AC\uC6A9\uD560 \uBC30\uD3EC \uC870\uD569"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "SDK\uC640 \uC11C\uBE44\uC2A4\uC758 \uD558\uC704 \uBC84\uC804\uC740 \uC774 \uC870\uD569\uC744 \uAE30\uC900\uC73C\uB85C \uACE0\uC815\uB429\uB2C8\uB2E4."))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uBC30\uD3EC \uC870\uD569", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
    "data-testid": "subscription-base",
    disabled: busy,
    value: draft.baseCompositionId,
    onChange: e => edit({
      ...draft,
      baseCompositionId: e.target.value
    })
  }, data.bases.map(b => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    key: b.compositionId,
    value: b.compositionId,
    disabled: b.retired
  }, b.label, " \xB7 SDK ", b.platformVersion, b.retired ? ' · 선택 종료' : ''))))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", null, "2. \uAD6C\uB3C5\uD560 \uC704\uC82F \uBC84\uC804"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC11C\uBE44\uC2A4\uAC00 \uACF5\uAC1C\uD55C \uC704\uC82F\uB9CC \uC120\uD0DD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uC704\uC82F\uB3C4 \uC11C\uB85C \uB2E4\uB978 \uBC84\uC804\uC73C\uB85C \uCD94\uAC00\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "add-subscription-widget",
    disabled: busy || draft.dashboard.length >= 24,
    onClick: add
  }, "\uC704\uC82F \uCD94\uAC00")), !draft.dashboard.length && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "empty"
  }, "\uC704\uC82F\uC744 \uCD94\uAC00\uD558\uBA74 \uB0B4 \uB300\uC2DC\uBCF4\uB4DC\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "widgets"
  }, draft.dashboard.map((item, index) => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("fieldset", {
    key: item.id,
    disabled: busy,
    "data-testid": `subscription-row-${index}`
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("legend", null, "\uC704\uC82F ", index + 1), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uACF5\uAC1C \uC704\uC82F\xB7\uBC84\uC804", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
    "data-testid": `subscription-widget-${index}`,
    value: item.artifactId + '|' + item.widgetId,
    onChange: e => {
      const selected = data.widgets.find(w => w.artifactId + '|' + w.id === e.target.value);
      update(index, {
        artifactId: selected.artifactId,
        widgetId: selected.id,
        title: selected.title
      });
    }
  }, data.widgets.map(w => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    key: w.artifactId + '|' + w.id,
    value: w.artifactId + '|' + w.id,
    disabled: w.selectionState !== 'available'
  }, w.service.toUpperCase(), " ", w.version, " \xB7 ", w.title, w.selectionState !== 'available' ? ' · 신규 선택 불가' : '')))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uD45C\uC2DC \uC81C\uBAA9", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    maxLength: "60",
    "data-testid": `subscription-title-${index}`,
    value: item.title,
    onChange: e => update(index, {
      title: e.target.value
    })
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "\uB108\uBE44", /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", {
    value: item.span,
    onChange: e => update(index, {
      span: Number(e.target.value)
    })
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "1"
  }, "\uD55C \uCE78"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", {
    value: "2"
  }, "\uC804\uCCB4 \uB108\uBE44"))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "controls"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "secondary",
    disabled: index === 0,
    onClick: () => {
      const items = [...draft.dashboard];
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      edit({
        ...draft,
        dashboard: items
      });
    }
  }, "\uC704\uB85C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "secondary",
    "data-testid": `remove-subscription-widget-${index}`,
    onClick: () => edit({
      ...draft,
      dashboard: draft.dashboard.filter((_, i) => i !== index)
    })
  }, "\uC81C\uAC70")))))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "review"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", null, "3. \uAC80\uC0AC\uD558\uACE0 \uC800\uC7A5"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC800\uC7A5\uD574\uB3C4 \uB2E4\uB978 \uC0AC\uC6A9\uC790\uC758 \uAD6C\uB3C5\uC774\uB098 \uC5F4\uB824 \uC788\uB294 \uD0ED\uC740 \uBC14\uB00C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."), review && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "success",
    "data-testid": "subscription-preview"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, "\uC870\uD569 \uAC80\uC0AC \uD1B5\uACFC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC704\uC82F ", review.dashboard.length, "\uAC1C \xB7 SDK ", review.platformVersion, " \xB7 \uC9C1\uC811\xB7\uD558\uC704 \uC758\uC874\uC131\uAE4C\uC9C0 \uACE0\uC815"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("details", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("summary", null, "\uC2E4\uC81C \uC704\uC82F \uC758\uC874 \uBC84\uC804"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("ul", null, review.dashboard.map(w => {
    const a = review.artifacts[w.artifactId],
      edges = review.runtimeBindings[a.id] || {};
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("li", {
      key: w.id
    }, w.title, ": ", a.service.toUpperCase(), " ", a.version, Object.entries(edges).map(([alias, id]) => ` → ${alias.toUpperCase()} ${review.artifacts[id].version}`).join(''));
  })))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "controls"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "secondary",
    "data-testid": "preview-subscription",
    disabled: busy,
    onClick: () => action(async () => setReview((await request('preview', draft, data.csrfToken)).composition))
  }, "\uC870\uD569 \uAC80\uC0AC"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    "data-testid": "save-subscription",
    disabled: busy || !review,
    onClick: () => action(async () => {
      await request('save', {
        ...draft,
        previewedCompositionId: review.compositionId
      }, data.csrfToken);
      await load();
      setNotice('내 구독을 저장했습니다. 새 탭부터 적용됩니다.');
    })
  }, "\uB0B4 \uAD6C\uB3C5 \uC800\uC7A5"))), data.subscription.active && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("section", {
    className: "cancel"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h2", null, "\uAD6C\uB3C5 \uD574\uC81C"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", null, "\uC800\uC7A5\uB41C \uAD6C\uB3C5\uC758 \uCC38\uC870\uB97C \uD574\uC81C\uD569\uB2C8\uB2E4. \uAE30\uC874 \uD0ED\uACFC \uACF5\uC9C0\xB7\uBCF4\uAD00 \uAE30\uAC04\uC740 \uACC4\uC18D \uBCF4\uD638\uD569\uB2C8\uB2E4."), !confirm ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "secondary",
    "data-testid": "cancel-subscription",
    disabled: busy,
    onClick: () => setConfirm(true)
  }, "\uB0B4 \uAD6C\uB3C5 \uD574\uC81C") : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "controls"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, "\uC800\uC7A5\uB41C \uAD6C\uB3C5\uC744 \uD574\uC81C\uD560\uAE4C\uC694?"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "danger",
    "data-testid": "confirm-cancel-subscription",
    disabled: busy,
    onClick: () => action(async () => {
      await request('cancel', {
        expectedRevision: data.subscription.revision
      }, data.csrfToken);
      await load();
      setNotice('저장된 구독을 해제했습니다. 기존 탭은 계속 보호합니다.');
    })
  }, "\uD574\uC81C \uD655\uC778"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "secondary",
    onClick: () => setConfirm(false)
  }, "\uC720\uC9C0")))) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "empty"
  }, "\uC0AC\uC6A9\uC790\uB97C \uC120\uD0DD\uD558\uBA74 \uC800\uC7A5\uB41C \uAD6C\uB3C5\uC744 \uBD88\uB7EC\uC635\uB2C8\uB2E4.")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("footer", null, "\uC800\uC7A5\uB41C \uAD6C\uB3C5\uC740 \uC811\uC18D \uC5EC\uBD80\uC640 \uAD00\uACC4\uC5C6\uC774 \uBCF4\uD638\uB429\uB2C8\uB2E4. \uD30C\uC77C \uC0AD\uC81C\uB294 \uBCC4\uB3C4\uC758 \uAD00\uB9AC \uC808\uCC28\uB97C \uAC70\uCE69\uB2C8\uB2E4."));
}
;(0,react_dom_client__WEBPACK_IMPORTED_MODULE_1__.createRoot)(document.getElementById('root')).render(/*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(App, null));

/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js!./src/style.css"
/*!*************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/style.css ***!
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
___CSS_LOADER_EXPORT___.push([module.id, `*{box-sizing:border-box}body{margin:0;color:#1b2b45;background:#f3f6fb;font:15px/1.7 system-ui,-apple-system,sans-serif}button,input,select{font:inherit}a{color:#3358bd;text-underline-offset:3px}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 5%;background:#17263f;color:white}header a{color:inherit}.brand{display:flex;gap:12px;align-items:center;text-decoration:none;font-weight:750;font-size:20px}.brand span{background:#6384f4;padding:0 10px;border-radius:8px}nav{display:flex;gap:24px;font-size:14px}main{max-width:1120px;padding:38px 24px 50px;margin:auto}.eyebrow{font-size:12px;letter-spacing:.12em;color:#536bb8;font-weight:700}h1{font-size:clamp(28px,4vw,40px);letter-spacing:-.035em;margin:10px 0}h2{font-size:20px;margin:0 0 8px}.intro{font-size:17px;color:#586a83;margin-bottom:28px}section{padding:26px;background:white;border:1px solid #dce4ef;border-radius:15px;margin:20px 0;box-shadow:0 4px 10px #14243c04}section p{margin:6px 0 16px;color:#586a83}.identity,.saved,.section-head{display:flex;gap:24px;justify-content:space-between;align-items:center}.identity>div:first-child{max-width:620px}.controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}label{display:flex;flex-direction:column;gap:7px;font-weight:600;font-size:14px}input,select{background:white;color:#1b2b45;padding:10px 12px;border:1px solid #bfccdf;border-radius:8px;min-width:0;max-width:100%}button,.button{display:inline-block;border:1px solid #3458c7;background:#3458c7;color:white;border-radius:8px;padding:10px 16px;font-weight:600;text-decoration:none;cursor:pointer;white-space:normal}button.secondary{color:#30476a;background:white;border-color:#c4cfdf}button.danger{background:#a62d42;border-color:#a62d42}button:disabled{opacity:.5;cursor:default}.widgets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}fieldset{border:1px solid #dce4ef;border-radius:12px;min-width:0;padding:18px;display:grid;gap:14px}legend{font-weight:700;padding:0 6px}.success,.alert{padding:16px 20px;border-radius:10px;background:#e7f5ec;color:#215a37;margin:16px 0}.success p{color:inherit}.alert{background:#fff0ec;color:#903929}.empty{text-align:center;padding:24px;color:#667790}details{font-size:14px}summary{cursor:pointer}code{font-size:12px;overflow-wrap:anywhere}footer{max-width:1120px;padding:0 24px 40px;margin:auto;color:#687990;font-size:13px}.cancel{box-shadow:none;background:#f8fafc}.saved{border-left:4px solid #5375d9}@media(max-width:720px){header,nav{flex-wrap:wrap;gap:12px}main{padding:24px 14px}.identity,.saved,.section-head{align-items:stretch;flex-direction:column;gap:12px}section{padding:20px}.widgets{grid-template-columns:1fr}select{width:100%}.controls{align-items:stretch}h1{font-size:28px}}
`, "",{"version":3,"sources":["webpack://./src/style.css"],"names":[],"mappings":"AAAA,EAAE,qBAAqB,CAAC,KAAK,QAAQ,CAAC,aAAa,CAAC,kBAAkB,CAAC,gDAAgD,CAAC,oBAAoB,YAAY,CAAC,EAAE,aAAa,CAAC,yBAAyB,CAAC,OAAO,YAAY,CAAC,kBAAkB,CAAC,6BAA6B,CAAC,QAAQ,CAAC,eAAe,CAAC,kBAAkB,CAAC,WAAW,CAAC,SAAS,aAAa,CAAC,OAAO,YAAY,CAAC,QAAQ,CAAC,kBAAkB,CAAC,oBAAoB,CAAC,eAAe,CAAC,cAAc,CAAC,YAAY,kBAAkB,CAAC,cAAc,CAAC,iBAAiB,CAAC,IAAI,YAAY,CAAC,QAAQ,CAAC,cAAc,CAAC,KAAK,gBAAgB,CAAC,sBAAsB,CAAC,WAAW,CAAC,SAAS,cAAc,CAAC,oBAAoB,CAAC,aAAa,CAAC,eAAe,CAAC,GAAG,8BAA8B,CAAC,sBAAsB,CAAC,aAAa,CAAC,GAAG,cAAc,CAAC,cAAc,CAAC,OAAO,cAAc,CAAC,aAAa,CAAC,kBAAkB,CAAC,QAAQ,YAAY,CAAC,gBAAgB,CAAC,wBAAwB,CAAC,kBAAkB,CAAC,aAAa,CAAC,+BAA+B,CAAC,UAAU,iBAAiB,CAAC,aAAa,CAAC,+BAA+B,YAAY,CAAC,QAAQ,CAAC,6BAA6B,CAAC,kBAAkB,CAAC,0BAA0B,eAAe,CAAC,UAAU,YAAY,CAAC,kBAAkB,CAAC,QAAQ,CAAC,cAAc,CAAC,MAAM,YAAY,CAAC,qBAAqB,CAAC,OAAO,CAAC,eAAe,CAAC,cAAc,CAAC,aAAa,gBAAgB,CAAC,aAAa,CAAC,iBAAiB,CAAC,wBAAwB,CAAC,iBAAiB,CAAC,WAAW,CAAC,cAAc,CAAC,eAAe,oBAAoB,CAAC,wBAAwB,CAAC,kBAAkB,CAAC,WAAW,CAAC,iBAAiB,CAAC,iBAAiB,CAAC,eAAe,CAAC,oBAAoB,CAAC,cAAc,CAAC,kBAAkB,CAAC,iBAAiB,aAAa,CAAC,gBAAgB,CAAC,oBAAoB,CAAC,cAAc,kBAAkB,CAAC,oBAAoB,CAAC,gBAAgB,UAAU,CAAC,cAAc,CAAC,SAAS,YAAY,CAAC,6CAA6C,CAAC,QAAQ,CAAC,SAAS,wBAAwB,CAAC,kBAAkB,CAAC,WAAW,CAAC,YAAY,CAAC,YAAY,CAAC,QAAQ,CAAC,OAAO,eAAe,CAAC,aAAa,CAAC,gBAAgB,iBAAiB,CAAC,kBAAkB,CAAC,kBAAkB,CAAC,aAAa,CAAC,aAAa,CAAC,WAAW,aAAa,CAAC,OAAO,kBAAkB,CAAC,aAAa,CAAC,OAAO,iBAAiB,CAAC,YAAY,CAAC,aAAa,CAAC,QAAQ,cAAc,CAAC,QAAQ,cAAc,CAAC,KAAK,cAAc,CAAC,sBAAsB,CAAC,OAAO,gBAAgB,CAAC,mBAAmB,CAAC,WAAW,CAAC,aAAa,CAAC,cAAc,CAAC,QAAQ,eAAe,CAAC,kBAAkB,CAAC,OAAO,6BAA6B,CAAC,wBAAwB,WAAW,cAAc,CAAC,QAAQ,CAAC,KAAK,iBAAiB,CAAC,+BAA+B,mBAAmB,CAAC,qBAAqB,CAAC,QAAQ,CAAC,QAAQ,YAAY,CAAC,SAAS,yBAAyB,CAAC,OAAO,UAAU,CAAC,UAAU,mBAAmB,CAAC,GAAG,cAAc,CAAC","sourcesContent":["*{box-sizing:border-box}body{margin:0;color:#1b2b45;background:#f3f6fb;font:15px/1.7 system-ui,-apple-system,sans-serif}button,input,select{font:inherit}a{color:#3358bd;text-underline-offset:3px}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 5%;background:#17263f;color:white}header a{color:inherit}.brand{display:flex;gap:12px;align-items:center;text-decoration:none;font-weight:750;font-size:20px}.brand span{background:#6384f4;padding:0 10px;border-radius:8px}nav{display:flex;gap:24px;font-size:14px}main{max-width:1120px;padding:38px 24px 50px;margin:auto}.eyebrow{font-size:12px;letter-spacing:.12em;color:#536bb8;font-weight:700}h1{font-size:clamp(28px,4vw,40px);letter-spacing:-.035em;margin:10px 0}h2{font-size:20px;margin:0 0 8px}.intro{font-size:17px;color:#586a83;margin-bottom:28px}section{padding:26px;background:white;border:1px solid #dce4ef;border-radius:15px;margin:20px 0;box-shadow:0 4px 10px #14243c04}section p{margin:6px 0 16px;color:#586a83}.identity,.saved,.section-head{display:flex;gap:24px;justify-content:space-between;align-items:center}.identity>div:first-child{max-width:620px}.controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}label{display:flex;flex-direction:column;gap:7px;font-weight:600;font-size:14px}input,select{background:white;color:#1b2b45;padding:10px 12px;border:1px solid #bfccdf;border-radius:8px;min-width:0;max-width:100%}button,.button{display:inline-block;border:1px solid #3458c7;background:#3458c7;color:white;border-radius:8px;padding:10px 16px;font-weight:600;text-decoration:none;cursor:pointer;white-space:normal}button.secondary{color:#30476a;background:white;border-color:#c4cfdf}button.danger{background:#a62d42;border-color:#a62d42}button:disabled{opacity:.5;cursor:default}.widgets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}fieldset{border:1px solid #dce4ef;border-radius:12px;min-width:0;padding:18px;display:grid;gap:14px}legend{font-weight:700;padding:0 6px}.success,.alert{padding:16px 20px;border-radius:10px;background:#e7f5ec;color:#215a37;margin:16px 0}.success p{color:inherit}.alert{background:#fff0ec;color:#903929}.empty{text-align:center;padding:24px;color:#667790}details{font-size:14px}summary{cursor:pointer}code{font-size:12px;overflow-wrap:anywhere}footer{max-width:1120px;padding:0 24px 40px;margin:auto;color:#687990;font-size:13px}.cancel{box-shadow:none;background:#f8fafc}.saved{border-left:4px solid #5375d9}@media(max-width:720px){header,nav{flex-wrap:wrap;gap:12px}main{padding:24px 14px}.identity,.saved,.section-head{align-items:stretch;flex-direction:column;gap:12px}section{padding:20px}.widgets{grid-template-columns:1fr}select{width:100%}.controls{align-items:stretch}h1{font-size:28px}}\n"],"sourceRoot":""}]);
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

/***/ "./src/style.css"
/*!***********************!*\
  !*** ./src/style.css ***!
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
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./style.css */ "./node_modules/css-loader/dist/cjs.js!./src/style.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


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
//# sourceMappingURL=src_bootstrap_jsx.ff1de543cda565bb2ef7.js.map