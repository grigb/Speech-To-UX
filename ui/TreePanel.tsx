import React from 'react';
import { useAppStore } from '../core/store';
import { UINode } from '../core/types';

const TreeNode: React.FC<{ nodeId: string; depth?: number }> = ({ nodeId, depth = 0 }) => {
  const { state, dispatch } = useAppStore();
  const node = state.ast.nodes[nodeId];

  if (!node) return null;

  const isSelected = state.selection === nodeId;
  // Defensive check for children
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const isCollapsed = node.isCollapsed;

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ 
        type: 'APPLY_PATCHSET', 
        payload: {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            author: 'system',
            description: 'Toggle Collapse',
            ops: [{ op: 'replace', path: `/nodes/${nodeId}/isCollapsed`, value: !isCollapsed }]
        }
    });
  };

  return (
    <div>
      <div 
        onClick={() => dispatch({ type: 'SELECT_NODE', id: nodeId })}
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          paddingRight: '8px',
          paddingTop: '4px',
          paddingBottom: '4px',
          cursor: 'pointer',
          background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          fontSize: '13px',
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
        }}
      >
        <span 
          onClick={toggleCollapse}
          style={{ 
            width: '16px', 
            display: 'inline-block', 
            cursor: 'pointer',
            opacity: hasChildren ? 1 : 0.2 
          }}
        >
          {hasChildren ? (isCollapsed ? '▶' : '▼') : '•'}
        </span>
        <span style={{ color: 'var(--accent-primary)', marginRight: '6px' }}>&lt;{node.type}&gt;</span>
        <span style={{ opacity: 0.6 }}>#{node.id.slice(0, 6)}</span>
      </div>
      {!isCollapsed && children.map(childId => (
        <TreeNode key={childId} nodeId={childId} depth={depth + 1} />
      ))}
    </div>
  );
};

export const TreePanel = () => {
  const { state } = useAppStore();
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <TreeNode nodeId={state.ast.rootId} />
    </div>
  );
};
