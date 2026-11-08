import React, { useState } from 'react';
import { PageContainer, WidgetBoundary, useWidgetScope, usePlatform, PlatformContext } from 'platform/sdk';
import styles from './Widget.module.css';

function Notifications({ instanceId }) {
  const { user, platformVersion } = usePlatform();
  const { count, setCount } = useWidgetScope();
  const [memo, setMemo] = useState('');
  return <div className={styles.panel} data-testid={`service-e-${instanceId}`}>
    <p data-testid="e-message">새 서비스의 첫 화면</p>
    <p>사용자: <span data-testid="e-user">{user.name}</span> · SDK <span data-testid="e-sdk">{platformVersion}</span></p>
    <label className={styles.field}>알림 메모
      <input data-testid="e-input" value={memo} onChange={event => setMemo(event.target.value)} />
    </label>
    <button type="button" data-testid="e-increment" onClick={() => setCount(value => value + 1)}>확인한 알림 <span data-testid="e-count">{count}</span>개</button>
  </div>;
}

export default function Widget({ instanceId }) {
  return <WidgetBoundary instanceId={instanceId} artifactId={__ARTIFACT_ID__}>
    <PageContainer title="알림 서비스 E" description="공통 SDK를 사용하는 독립 서비스">
      <Notifications instanceId={instanceId} />
    </PageContainer>
  </WidgetBoundary>;
}

// Diagnostic only: Shell integration does not require this export.
export function getIdentity() { return { react: React, context: PlatformContext, artifactId: __ARTIFACT_ID__ }; }
