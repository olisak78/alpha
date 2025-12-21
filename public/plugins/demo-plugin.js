// Demo plugin bundle (ES module)
// This bundle expects `React` to be available globally from the host application.

const DemoPlugin = ({ context }) => {
  const { useEffect, useMemo, useState } = React;
  const [count, setCount] = useState(0);

  const colors = useMemo(() => ({
    background: context.theme.colors.background,
    border: context.theme.colors.border,
    text: context.theme.colors.foreground,
    accent: context.theme.colors.accent,
  }), [context.theme]);

  useEffect(() => {
    context.utils.toast(`Loaded ${context.metadata.title}`, 'success');
  }, [context]);

  return React.createElement(
    'div',
    {
      style: {
        background: colors.background,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      },
    },
    [
      React.createElement('div', { key: 'header', style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
        React.createElement('span', { key: 'badge', style: {
          background: colors.accent,
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
        } }, 'Demo Plugin'),
        React.createElement('span', { key: 'title', style: { fontSize: '16px', fontWeight: 600 } }, context.metadata.title),
      ]),
      React.createElement('p', { key: 'description', style: { margin: 0, fontSize: '14px', lineHeight: 1.5 } }, context.metadata.description),
      React.createElement('button', {
        key: 'button',
        onClick: () => setCount((value) => value + 1),
        style: {
          background: colors.accent,
          color: '#fff',
          padding: '10px 12px',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontWeight: 600,
        },
      }, `Clicks: ${count}`),
      React.createElement('div', { key: 'footer', style: { display: 'flex', gap: '8px', fontSize: '12px', color: '#6b7280' } }, [
        React.createElement('span', { key: 'author' }, `Author: ${context.metadata.createdBy}`),
        React.createElement('span', { key: 'version' }, `Version: ${context.metadata.version}`),
      ]),
    ],
  );
};

export default {
  component: DemoPlugin,
  metadata: {
    name: 'demo-plugin',
    version: '1.0.0',
    author: 'Portal Team',
  },
  hooks: {
    onMount() {
      console.log('[Demo Plugin] mounted');
    },
    onUnmount() {
      console.log('[Demo Plugin] unmounted');
    },
  },
};