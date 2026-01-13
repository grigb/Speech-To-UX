import React from 'react';
import { useAppStore } from '../core/store';
import { UINode } from '../core/types';

const FallbackComponent = ({ node, isSelected, onClick }: { node: UINode; isSelected: boolean; onClick: (e: React.MouseEvent) => void }) => {
  const style: React.CSSProperties = {
    padding: '8px',
    border: isSelected ? '2px solid var(--accent-primary)' : '1px dashed var(--border-color)',
    margin: '4px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    position: 'relative',
    minHeight: '20px',
    color: 'var(--text-primary)',
    fontSize: '12px'
  };

  if (node.type === 'button') {
    return (
      <button onClick={onClick} style={{ ...style, cursor: 'pointer', background: 'var(--accent-primary)', border: 'none', color: '#fff' }}>
        {node.props.label || 'Button'}
      </button>
    );
  }

  if (node.type === 'text') {
    return <div onClick={onClick} style={style}>{node.props.content || 'Text Node'}</div>;
  }

  return (
    <div onClick={onClick} style={style}>
      <div style={{position: 'absolute', top: 0, left: 0, fontSize: '9px', background: '#333', padding: '1px 3px', color: '#aaa'}}>
        {node.type}
      </div>
      <div style={{ marginTop: '12px' }}>
        {/* Children Rendered by Parent Recursive Logic */}
      </div>
    </div>
  );
};

const RecursiveRenderer: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const { state, dispatch } = useAppStore();
  const node = state.ast.nodes[nodeId];
  
  if (!node) return <div style={{color: 'red'}}>Error: Node {nodeId} not found</div>;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_NODE', id: nodeId });
  };

  const isSelected = state.selection === nodeId;
  const children = node.children || [];

  // Container styling simulation
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: node.props.direction === 'row' ? 'row' : 'column',
    flex: node.props.flex,
    width: node.props.width,
    height: '100%',
    padding: '4px',
    gap: '8px',
    border: isSelected ? '1px solid var(--accent-primary)' : 'none'
  };

  if (node.type === 'app_shell') {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', overflow: 'hidden' }}>
        {children.map(child => <RecursiveRenderer key={child} nodeId={child} />)}
      </div>
    );
  }

  if (['container', 'region'].includes(node.type)) {
     return (
       <div onClick={handleSelect} style={containerStyle}>
         {children.map(child => <RecursiveRenderer key={child} nodeId={child} />)}
       </div>
     );
  }

  // Leaf or specific nodes
  return <FallbackComponent node={node} isSelected={isSelected} onClick={handleSelect} />;
};

export const RenderEngine = () => {
  const { state } = useAppStore();
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
      <RecursiveRenderer nodeId={state.ast.rootId} />
    </div>
  );
};
