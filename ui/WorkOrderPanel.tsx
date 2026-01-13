import React from 'react';
import { useAppStore } from '../core/store';

export const WorkOrderPanel = () => {
  const { state } = useAppStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'var(--accent-success)';
      case 'in-progress': return 'var(--accent-primary)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ padding: '12px', height: '100%', overflowY: 'auto' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
        TRIAGE POOL ({state.workOrders.length})
      </div>
      
      {state.workOrders.map(wo => (
        <div key={wo.id} style={{ 
          background: 'var(--bg-input)', 
          marginBottom: '8px', 
          padding: '10px', 
          borderRadius: '4px',
          borderLeft: `3px solid ${getStatusColor(wo.status)}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>{wo.title}</span>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7 }}>{wo.status}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {wo.description}
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.5 }}>
            ID: {wo.id} • Prio: {wo.priority}
          </div>
        </div>
      ))}
      
      <button 
        style={{ 
          width: '100%', 
          padding: '8px', 
          background: 'var(--bg-panel)', 
          border: '1px dashed var(--border-color)', 
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          marginTop: '8px'
        }}
      >
        + Add Manual Ticket
      </button>
    </div>
  );
};
