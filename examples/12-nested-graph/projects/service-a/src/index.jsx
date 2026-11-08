import React, { useState } from 'react';
import BWidget, { getIdentity as getBIdentity } from 'b/Widget';
import CWidget from 'c/Widget';
import styles from './Nested.module.css';

export function getIdentity() {
  return {
    ...getBIdentity(),
    consumerArtifact: __ARTIFACT_ID__,
    consumerVersion: __SERVICE_VERSION__,
    consumerReact: React,
    
  };
}

export default function ConsumerWidget({ instanceId, onMounted }) {
  const [showC, setShowC] = useState(true);
  const direct = getBIdentity();
  // A's direct B and the B inside C are separate mounted instances.
  // Dependency versions are resolved by consumer artifact, not by this UI ID.
  const childId = `${instanceId}--c`;
  return (
    <section className={styles.group} data-testid={`nested-${instanceId}`}>
      <div className={styles.heading}>
        <strong>A의 직접·간접 B 사용</strong>
        <p>A의 B {direct.version}와 C 서비스</p>
        <button type="button" data-testid={`toggle-c-${instanceId}`} aria-expanded={showC}
          aria-controls={`nested-c-${instanceId}`} onClick={() => setShowC((value) => !value)}>
          {showC ? 'A 안의 C 제거' : 'A 안의 C 다시 표시'}
        </button>
      </div>
      <BWidget instanceId={instanceId} onMounted={onMounted} />
      <div id={`nested-c-${instanceId}`}>
        {showC && <CWidget instanceId={childId} onMounted={onMounted} />}
      </div>
    </section>
  );
}
