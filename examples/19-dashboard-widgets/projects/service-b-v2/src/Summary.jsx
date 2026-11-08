import React from 'react';
import {WidgetBoundary,useWidgetScope,usePlatform} from 'platform/sdk';
import {describe} from 'd/data';
function Content(){const scope=useWidgetScope(),platform=usePlatform();return <div data-testid={`summary-${scope.instanceId}`}><p>차량 요약 · {describe()} · {platform.user.name}</p><button data-testid="summary-increment" onClick={()=>scope.setCount(n=>n+1)}>요약 확인 <span data-testid="summary-count">{scope.count}</span></button></div>;}
export default function Summary({instanceId}){return <WidgetBoundary instanceId={instanceId} artifactId={__ARTIFACT_ID__}><Content/></WidgetBoundary>;}
