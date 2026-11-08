import React from 'react';
import BWidget, { getIdentity as getBIdentity } from 'b/Widget';

export function getIdentity() {
  return { ...getBIdentity(), consumerArtifact: __ARTIFACT_ID__, consumerVersion: __SERVICE_VERSION__, consumerReact: React };
}

export default function ConsumerWidget(props) {
  return (
    <section data-testid={`consumer-c-${props.instanceId}`}>
      <p>C <strong data-testid={`c-version-${props.instanceId}`}>{__SERVICE_VERSION__}</strong>가 선택한 B</p>
      <BWidget {...props} />
    </section>
  );
}
