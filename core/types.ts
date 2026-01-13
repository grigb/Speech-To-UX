
export type NodeType = 
  | 'app_shell' 
  | 'view' 
  | 'region' 
  | 'container' 
  | 'button' 
  | 'text' 
  | 'input' 
  | 'list' 
  | 'item'
  | 'dialog'
  | 'feed';

export interface UINode {
  id: string;
  type: NodeType;
  props: Record<string, any>;
  children: string[]; // Child IDs
  parentId?: string;
  isCollapsed?: boolean; // Editor state stored on node for simplicity in MVP
}

export type AST = {
  rootId: string;
  nodes: Record<string, UINode>;
};

export type PatchOp = 
  | { op: 'add'; path: string; value: any } // Path: /nodes/{id}/children/- or /nodes/{id}
  | { op: 'replace'; path: string; value: any }
  | { op: 'remove'; path: string }
  | { op: 'move'; from: string; path: string };

export interface PatchSet {
  id: string;
  timestamp: number;
  author: 'user' | 'ai' | 'system';
  description: string;
  ops: PatchOp[];
  requiresConfirmation?: boolean;
}

export type WorkOrderStatus = 'triage' | 'in-progress' | 'review' | 'complete';

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface Report {
  id: string;
  timestamp: number;
  title: string;
  content: string;
}

export interface TestResult {
  stepIndex: number;
  command: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'fixed';
  logs: string[];
}

export interface AppState {
  ast: AST;
  history: PatchSet[];
  future: PatchSet[]; // For redo
  workOrders: WorkOrder[];
  reports: Report[];
  selection: string | null; // Selected Node ID
  activePanel: 'xml' | 'triage' | 'history' | 'reports' | 'tests';
  isRecording: boolean;
  dspMode: 'fallback' | 'mui';
}
