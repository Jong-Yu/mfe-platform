import React from 'react';
import BWidget, { getIdentity as getBIdentity } from 'b/Widget';

export function getIdentity() {
  const identity = getBIdentity();
  return { ...identity, consumerArtifact: __ARTIFACT_ID__, consumerReact: React };
}

export default function ConsumerWidget(props) {
  return <BWidget {...props} />;
}
