module.exports = {
  service: 'e', kind: 'remote', port: 4207,
  exposes: { './Widget': './src/Widget.jsx' },
  widgets: [{ id: 'notifications', title: '알림', exposedModule: './Widget', contract: 'platform-widget-v1' }],
};
