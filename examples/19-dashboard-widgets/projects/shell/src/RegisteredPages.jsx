import React, { useEffect, useState } from 'react';
import { RemoteRegion } from 'platform/sdk';

export function useServiceRoute() {
  const [route, setRoute] = useState(() => location.hash.slice(1) || '/');
  useEffect(() => {
    const update = () => setRoute(location.hash.slice(1) || '/');
    addEventListener('hashchange', update);
    return () => removeEventListener('hashchange', update);
  }, []);
  return route;
}

export default function RegisteredPages({ menus, route }) {
  const [visited, setVisited] = useState([]);
  const active = menus.find(item => item.path === route);
  const activeId = active?.id;
  useEffect(() => {
    if (activeId) setVisited(previous => previous.includes(activeId) ? previous : [...previous, activeId]);
  }, [activeId]);
  return <>
    {menus.filter(item => item.id === active?.id || visited.includes(item.id)).map(item =>
      <section key={item.id} hidden={route !== item.path} aria-label={item.label} data-testid={`menu-page-${item.id}`}>
        <RemoteRegion consumerId={__ARTIFACT_ID__} alias={`menu/${item.id}`} exposedModule={item.exposedModule}
          instanceId={`menu-${item.id}`} label={item.label} componentProps={{ instanceId: `menu-${item.id}` }} />
      </section>)}
    {route !== '/' && !active ? <div role="status" data-testid="menu-not-found"><h1>이 화면의 메뉴를 찾을 수 없습니다.</h1><p>이 탭이 시작할 때 선택한 메뉴에 없는 주소입니다.</p><a href="#/">처음 화면으로 이동</a></div> : null}
  </>;
}
