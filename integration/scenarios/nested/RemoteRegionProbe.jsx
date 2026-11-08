// Browser verification harness only. No loading, isolation or retry logic lives here.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PlatformProvider, RemoteRegion } from 'platform/sdk';

export function mount(element, regions) {
  const root = createRoot(element);
  const render = (next) => root.render(
    <PlatformProvider>{next.map((props) => <RemoteRegion key={props.instanceId} {...props} />)}</PlatformProvider>,
  );
  render(regions);
  return { render, unmount: () => root.unmount() };
}
