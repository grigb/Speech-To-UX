import { AST, PatchOp, UINode } from './types';

// Simplified JSON-Patch-like applicator for specific AST structure
export function applyPatch(ast: AST, op: PatchOp): AST {
  const newNodes = { ...ast.nodes };
  
  // Helper to parse simple paths like /nodes/{id}/children/-
  const pathParts = op.path.split('/').filter(Boolean);
  const [collection, id, field, index] = pathParts;

  if (collection !== 'nodes') return ast; // Only supporting node manipulation for MVP

  if (op.op === 'add') {
    if (field === 'children') {
      const parent = newNodes[id];
      if (!parent) return ast;
      
      const rawNode = op.value as UINode;
      // Sanitize node to ensure structure integrity
      const newNode: UINode = {
        ...rawNode,
        children: Array.isArray(rawNode.children) ? rawNode.children : [],
        props: rawNode.props || {}
      };

      // Register new node
      newNodes[newNode.id] = { ...newNode, parentId: id };
      
      // Update parent children array
      const parentChildren = parent.children || [];
      const newChildren = [...parentChildren];
      
      if (index === '-' || index === undefined) {
        newChildren.push(newNode.id);
      } else {
        const idx = parseInt(index);
        if (!isNaN(idx)) {
          newChildren.splice(idx, 0, newNode.id);
        } else {
          newChildren.push(newNode.id);
        }
      }
      
      newNodes[id] = { ...parent, children: newChildren };
    }
  } else if (op.op === 'remove') {
    // Remove node from map and from parent's children
    const nodeToRemove = newNodes[id];
    if (!nodeToRemove) return ast;
    
    // Remove from parent
    if (nodeToRemove.parentId && newNodes[nodeToRemove.parentId]) {
      const parent = newNodes[nodeToRemove.parentId];
      const parentChildren = parent.children || [];
      newNodes[parent.id] = {
        ...parent,
        children: parentChildren.filter(childId => childId !== id)
      };
    }
    
    // Recursive delete (simple version)
    delete newNodes[id];
  } else if (op.op === 'replace') {
    if (field === 'props') {
       const node = newNodes[id];
       if (!node) return ast;
       // Assuming value is the specific prop key/value or the whole object. 
       // For MVP patch, let's assume value is partial props object
       newNodes[id] = {
         ...node,
         props: { ...node.props, ...op.value }
       };
    } else if (field === 'isCollapsed') {
       const node = newNodes[id];
       newNodes[id] = { ...node, isCollapsed: op.value };
    }
  }

  return { ...ast, nodes: newNodes };
}

export function generatePatchSet(description: string, ast: AST): PatchOp[] {
  // MOCK AI LOGIC: Generates a patch based on simple keyword matching
  // In a real app, this calls Gemini
  const ops: PatchOp[] = [];
  return ops;
}
