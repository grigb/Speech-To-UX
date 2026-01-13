import React, { useMemo } from 'react';
import { useAppStore } from '../core/store';
import { projectXML } from '../core/xml-engine';

export const XmlPanel = () => {
  const { state } = useAppStore();
  
  // Memoize projection to avoid heavy recalculation on every render
  const xmlContent = useMemo(() => projectXML(state.ast), [state.ast]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <textarea
        readOnly
        value={xmlContent}
        style={{
          flex: 1,
          background: 'var(--bg-input)',
          color: '#a5b3ce',
          border: 'none',
          padding: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          resize: 'none',
          outline: 'none',
          whiteSpace: 'pre'
        }}
      />
      <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-app)' }}>
        Canonical Projection • Read Only for MVP
      </div>
    </div>
  );
};
