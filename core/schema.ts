import { AST, UINode } from './types';

// Helper to create node
export const createNode = (type: string, props = {}, children: string[] = []): UINode => ({
  id: crypto.randomUUID(),
  type: type as any,
  props,
  children
});

// Minimal Blank Slate
const rootId = 'root_shell';

export const INITIAL_AST: AST = {
  rootId,
  nodes: {
    [rootId]: {
      id: rootId,
      type: 'app_shell',
      props: { label: 'App Shell' },
      children: []
    }
  }
};