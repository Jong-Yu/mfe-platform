import React from 'react';
import { RemoteRegion } from 'platform/sdk';

export default function ServiceSlot() {
  return <section aria-label="새 알림 서비스">
    <RemoteRegion consumerId={__ARTIFACT_ID__} alias="e" exposedModule="./Widget"
      instanceId="E" label="알림 서비스 E" componentProps={{ instanceId: 'E' }} />
  </section>;
}
