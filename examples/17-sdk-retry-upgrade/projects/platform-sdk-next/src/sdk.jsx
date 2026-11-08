import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import styles from './Layout.module.css';

export const ReactIdentity = React;
export const PlatformContext = createContext(null);

const PLATFORM_VERSION = __SERVICE_VERSION__;
const WidgetScopeContext = createContext(null);
const activeScopes = new Set();

const defaultUser = Object.freeze({ name: '김개발', id: 'demo' });

export function PlatformProvider({ children, user = defaultUser, theme = 'light' }) {
  const value = useMemo(
    () => ({
      platformVersion: PLATFORM_VERSION,
      user,
      theme,
    }),
    [user, theme],
  );

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

export function PageContainer({ title, description, actions, children, width = 'standard' }) {
  const titleId = useId();
  return (
    <section className={`${styles.page} ${width === 'wide' ? styles.wide : ''}`} aria-labelledby={title ? titleId : undefined} data-page-container>
      {(title || description || actions) && <header className={styles.pageHeader}>
        <div>{title && <h1 id={titleId} className={styles.title}>{title}</h1>}{description && <p className={styles.description}>{description}</p>}</div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>}
      <div className={styles.content}>{children}</div>
    </section>
  );
}

// A development-only shell lookalike. Production navigation stays with the Shell.
export function DevLayout({ serviceName, children, tools }) {
  const platform = usePlatform();
  const contentId = useId();
  return (
    <div className={styles.layout} data-dev-layout data-theme={platform.theme}>
      <a className={styles.skip} href={`#${contentId}`}>콘텐츠로 이동</a>
      <aside className={styles.sidebar} aria-label="개발 환경">
        <div className={styles.brand}><span className={styles.mark}>M</span> Platform Dev</div>
        <span className={styles.label}>LOCAL WORKSPACE</span>
        <div className={styles.selected}>{serviceName}</div>
        <p className={styles.note}>서비스 단독 개발<br />SDK {platform.platformVersion} · MF</p>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.header}><span>개발 미리보기 <strong>{serviceName}</strong></span><span>{platform.user.name}</span></header>
        {tools && <div className={styles.tools}>{tools}</div>}
        <main id={contentId} tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}

export function usePlatform() {
  const platform = useContext(PlatformContext);
  if (!platform) {
    throw new Error('usePlatform requires PlatformProvider.');
  }
  return platform;
}

export function WidgetBoundary({ instanceId, artifactId, children }) {
  const [count, setCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [portalRoot, setPortalRoot] = useState(null);
  const [runtime] = useState(() => ({
    instanceId,
    artifactId,
    count: 0,
    eventCount: 0,
    cache: new Map(),
    subscriptions: new Set(),
    incrementEventCount() {
      this.eventCount += 1;
      setEventCount(this.eventCount);
    },
  }));

  const subscribe = useCallback(
    (handler) => {
      if (typeof handler !== 'function') {
        throw new TypeError('subscribe requires a function.');
      }
      const subscription = { handler };
      runtime.subscriptions.add(subscription);
      return () => {
        runtime.subscriptions.delete(subscription);
      };
    },
    [runtime],
  );

  useLayoutEffect(() => {
    runtime.instanceId = instanceId;
    runtime.artifactId = artifactId;
    runtime.count = count;
  }, [runtime, instanceId, artifactId, count]);

  useEffect(() => {
    activeScopes.add(runtime);
    return () => {
      activeScopes.delete(runtime);
      runtime.subscriptions.clear();
    };
  }, [runtime]);

  const scope = useMemo(
    () => ({
      instanceId,
      artifactId,
      count,
      setCount,
      eventCount,
      cache: runtime.cache,
      portalRoot,
      subscribe,
    }),
    [instanceId, artifactId, count, eventCount, runtime, portalRoot, subscribe],
  );

  return (
    <WidgetScopeContext.Provider value={scope}>
      <div data-widget-scope={instanceId}>
        {children}
        <div data-portal-scope={instanceId} ref={setPortalRoot} />
      </div>
    </WidgetScopeContext.Provider>
  );
}

export function useWidgetScope() {
  const scope = useContext(WidgetScopeContext);
  if (!scope) {
    throw new Error('useWidgetScope requires WidgetBoundary.');
  }
  return scope;
}

export function getRuntimeSnapshot() {
  const instances = [...activeScopes];
  return {
    activeInstances: instances.map((scope) => ({
      instanceId: scope.instanceId,
      artifactId: scope.artifactId,
      count: scope.count,
      eventCount: scope.eventCount,
      cacheSize: scope.cache.size,
    })),
    activeSubscriptions: instances.reduce(
      (total, scope) => total + scope.subscriptions.size,
      0,
    ),
    eventCounts: Object.fromEntries(
      instances.map((scope) => [scope.instanceId, scope.eventCount]),
    ),
    platformVersion: PLATFORM_VERSION,
  };
}

export function emitDemoEvent() {
  let notified = 0;
  for (const scope of [...activeScopes]) {
    if (!activeScopes.has(scope) || scope.subscriptions.size === 0) continue;
    scope.incrementEventCount();
    const event = {
      type: 'demo',
      instanceId: scope.instanceId,
      artifactId: scope.artifactId,
    };
    for (const subscription of [...scope.subscriptions]) {
      if (!scope.subscriptions.has(subscription)) continue;
      subscription.handler(event);
      notified += 1;
    }
  }
  return notified;
}

export { default as RemoteRegion } from './RemoteRegion';
export { getRemoteRecoveryLog } from './remote-loader';
