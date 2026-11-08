import React, { useEffect, useState } from 'react';
import { loadRemoteDependency } from './remote-loader';
import styles from './RemoteRegion.module.css';

function Unavailable({ instanceId, label, onRetry }) {
  return (
    <div className={styles.unavailable} role="alert" data-testid={`remote-error-${instanceId}`}>
      <strong>{label} 영역을 표시할 수 없습니다.</strong>
      <p>다른 영역은 계속 사용할 수 있습니다.</p>
      <button type="button" data-testid={`retry-${instanceId}`} onClick={onRetry}>{label} 영역 다시 시도</button>
    </div>
  );
}

class RenderBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('RemoteRegion render failed:', error); }
  render() {
    return this.state.failed ? <Unavailable instanceId={this.props.instanceId} label={this.props.label} onRetry={this.props.onRetry} /> : this.props.children;
  }
}

function LoadingRegion({ consumerId, alias, exposedModule, instanceId, label, componentProps, retry, onRetry }) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    loadRemoteDependency(consumerId, alias, exposedModule, retry).then(
      (module) => { if (active) setResult({ Component: module.default }); },
      (error) => {
        if (!active) return;
        console.error('RemoteRegion load failed:', error);
        setResult({ error });
      },
    );
    // Shared network work may finish after this particular region is removed.
    return () => { active = false; };
  }, [consumerId, alias, exposedModule, retry]);
  if (!result) return <div className={styles.loading} role="status" data-testid={`remote-loading-${instanceId}`}>{label} 영역을 불러오는 중입니다.</div>;
  if (result.error) return <Unavailable instanceId={instanceId} label={label} onRetry={onRetry} />;
  const Component = result.Component;
  return <RenderBoundary instanceId={instanceId} label={label} onRetry={onRetry}><Component {...componentProps} /></RenderBoundary>;
}

function Region(props) {
  const [attempt, setAttempt] = useState(0);
  return <LoadingRegion key={attempt} {...props} retry={attempt > 0} onRetry={() => setAttempt((value) => value + 1)} />;
}

export default function RemoteRegion({ consumerId, alias, exposedModule = './Widget', instanceId, label = '서비스', componentProps }) {
  // A different consumer or module starts a fresh region; labels and component
  // props can update without discarding a mounted remote's local state.
  return <Region key={JSON.stringify([consumerId, alias, exposedModule, instanceId])}
    consumerId={consumerId} alias={alias} exposedModule={exposedModule}
    instanceId={instanceId} label={label} componentProps={componentProps} />;
}
