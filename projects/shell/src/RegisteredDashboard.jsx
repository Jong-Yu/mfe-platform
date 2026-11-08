import React from 'react';
import { RemoteRegion } from 'platform/sdk';

export default function RegisteredDashboard({ placements, artifacts }) {
  return <div data-testid="registered-dashboard">
    <div className="dashboardHeading"><div><div className="pageEyebrow">WORKSPACE</div><h1>대시보드</h1><p className="intro">서비스가 공개한 위젯을 한곳에서 확인합니다.</p></div><a href="/admin#dashboard">위젯 배치 관리 ↗</a></div>
    {!placements.length ? <div className="dashboardEmpty" role="status">표시할 위젯이 없습니다. 관리 화면에서 공개 위젯을 선택해 배치하세요.</div> : null}
    <div className="dashboardGrid" data-testid="dashboard-grid">
      {placements.map(item => {
        const widget = artifacts[item.artifactId].widgets.find(value => value.id === item.widgetId);
        return <section className={`dashboardTile dashboardSpan${item.span}`} key={item.id} aria-label={item.title} data-testid={`dashboard-tile-${item.id}`}>
          <h2 className="dashboardTileTitle">{item.title}</h2>
          <RemoteRegion consumerId={__ARTIFACT_ID__} alias={`dashboard/${item.id}`} exposedModule={widget.exposedModule}
            instanceId={`dashboard-${item.id}`} label={item.title} componentProps={{ instanceId:`dashboard-${item.id}` }} />
        </section>;
      })}
    </div>
  </div>;
}
