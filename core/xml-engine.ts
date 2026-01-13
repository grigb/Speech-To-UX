import { AST } from './types';

// Deterministic XML Generator
export function projectXML(ast: AST): string {
  const indentSize = 2;
  
  function renderProps(props: Record<string, any>): string {
    return Object.entries(props)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Stable sort
      .map(([key, value]) => {
        if (value === true) return ` ${key}`;
        return ` ${key}="${String(value)}"`;
      })
      .join('');
  }

  function renderNode(nodeId: string, depth: number): string {
    const node = ast.nodes[nodeId];
    if (!node) return `<!-- Missing Node: ${nodeId} -->`;

    const indent = ' '.repeat(depth * indentSize);
    const propsString = renderProps(node.props || {});
    const children = node.children || [];
    
    if (children.length === 0) {
      return `${indent}<${node.type} id="${node.id}"${propsString} />`;
    }

    const childrenString = children
      .map(childId => renderNode(childId, depth + 1))
      .join('\n');

    return `${indent}<${node.type} id="${node.id}"${propsString}>\n${childrenString}\n${indent}</${node.type}>`;
  }

  return renderNode(ast.rootId, 0);
}

// Very basic XML parser stub for the "XML Editor" validation
// In a real app this would use a SAX parser to rebuild AST
export function validateXML(xml: string): boolean {
  return xml.startsWith('<') && xml.endsWith('>');
}
