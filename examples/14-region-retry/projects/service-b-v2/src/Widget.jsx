import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PlatformContext, WidgetBoundary, usePlatform, useWidgetScope } from 'platform/sdk';
import { describe, version as dependencyVersion, artifactId as dependencyArtifact } from 'd/data';
import styles from './Widget.module.css';

export function getIdentity() {
  return { react: React, context: PlatformContext, artifactId: __ARTIFACT_ID__, version: __SERVICE_VERSION__, dependencyArtifact, dependencyVersion };
}

function Content({ onMounted }) {
  const platform = usePlatform();
  const scope = useWidgetScope();
  const [input, setInput] = useState('');
  const [cached, setCached] = useState('');
  const [popup, setPopup] = useState(false);

  useEffect(() => scope.subscribe(() => {}), [scope.subscribe]);
  useEffect(() => { onMounted?.(scope.instanceId); }, [onMounted, scope.instanceId]);

  return (
    <article data-testid={`widget-${scope.instanceId}`} data-css-role="panel" className={styles.panel}>
      <div className={styles.eyebrow}>{scope.instanceId} 서비스가 사용하는 위젯</div>
      <div className={styles.titleRow}><h2>Car Picker</h2><span data-testid="version" className={styles.badge}>{__SERVICE_VERSION__}</span></div>
      <p className={styles.description}>독립 프로젝트에서 빌드한 B. 상태와 스타일은 이 인스턴스에만 적용됩니다.</p>
      <div className={styles.facts}>
        <span>간접 의존성 <strong data-testid="dependency">{describe()}</strong></span>
        <span>공통 사용자 <strong data-testid="platform-user">{platform.user.name}</strong></span>
        <span>플랫폼 <strong data-testid="platform-version">{platform.platformVersion}</strong></span>
      </div>
      <div className={styles.counterRow}>
        <div><span className={styles.label}>독립 카운터</span><strong data-testid="count" className={styles.count}>{scope.count}</strong></div>
        <button data-testid="increment" data-css-role="button" className={styles.button} onClick={() => scope.setCount((value) => value + 1)}>카운터 +1</button>
      </div>
      <label className={styles.label} htmlFor={`vehicle-${scope.instanceId}`}>차량 메모 · 인스턴스 전용 캐시</label>
      <div className={styles.inputRow}>
        <input id={`vehicle-${scope.instanceId}`} data-testid="input" className={styles.input} value={input} onChange={(event) => setInput(event.target.value)} placeholder="이 위젯에만 저장할 값" />
        <button data-testid="cache-write" className={styles.secondary} onClick={() => { scope.cache.set('selection', input); setCached(scope.cache.get('selection')); }}>저장</button>
      </div>
      <div className={styles.cache}>캐시 <output data-testid="cache-value">{cached}</output><button data-testid="cache-read" className={styles.secondary} onClick={() => setCached(scope.cache.get('selection') || '')}>다시 읽기</button></div>
      <div className={styles.actions}>
        <button data-testid="open-popup" className={styles.secondary} onClick={() => setPopup(true)}>전용 팝업 열기</button>
        <span>수신 이벤트 <strong data-testid="event-count">{scope.eventCount}</strong></span>
      </div>
      <code className={styles.artifact}>{__ARTIFACT_ID__}</code>
      {popup && scope.portalRoot && createPortal(
        <section role="dialog" aria-label={`${scope.instanceId} 위젯 팝업`} data-testid={`popup-${scope.instanceId}`} className={styles.popup}>
          <strong>{scope.instanceId} 전용 팝업 · B {__SERVICE_VERSION__}</strong>
          <p>이 위젯을 제거하면 이 팝업도 함께 제거됩니다.</p>
          <button data-testid="close-popup" className={styles.button} onClick={() => setPopup(false)}>닫기</button>
        </section>, scope.portalRoot,
      )}
    </article>
  );
}

export default function Widget({ instanceId, onMounted }) {
  return <WidgetBoundary instanceId={instanceId} artifactId={__ARTIFACT_ID__}><Content onMounted={onMounted} /></WidgetBoundary>;
}
