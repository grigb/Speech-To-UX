import { AppState, AST } from './types';

export function runDiagnostics(state: AppState): string {
  const { ast, history, workOrders } = state;
  const lines: string[] = [];
  
  const log = (msg: string) => lines.push(msg);
  const header = (msg: string) => lines.push(`\n[ ${msg.toUpperCase()} ]`);

  log(`UIX DIAGNOSTIC REPORT`);
  log(`Generated: ${new Date().toISOString()}`);
  log(`Session ID: ${history.length > 0 ? history[0].id : 'New Session'}`);
  log(`----------------------------------------`);

  // 1. AST Structural Integrity
  header("Structure Check");
  const nodeCount = Object.keys(ast.nodes).length;
  log(`Total Nodes: ${nodeCount}`);

  if (!ast.nodes[ast.rootId]) {
    log(`[CRITICAL] Root node '${ast.rootId}' is missing!`);
  } else {
    log(`Root Node: Present (${ast.rootId})`);
  }

  const nodes = ast.nodes;
  let missingChildren = 0;
  let orphans = 0;
  let maxDepth = 0;
  const typeDistribution: Record<string, number> = {};

  // Set of all children IDs referenced
  const referencedChildren = new Set<string>();

  // Check references and collect stats
  Object.values(nodes).forEach(node => {
    // Type stats
    typeDistribution[node.type] = (typeDistribution[node.type] || 0) + 1;

    if (node.children) {
      node.children.forEach(childId => {
        referencedChildren.add(childId);
        if (!nodes[childId]) {
          log(`[ERROR] Node ${node.id} references missing child ${childId}`);
          missingChildren++;
        }
      });
    }
  });

  // Check orphans (nodes that exist but are not root and not referenced by any parent)
  Object.keys(nodes).forEach(id => {
    if (id !== ast.rootId && !referencedChildren.has(id)) {
      log(`[WARN] Orphaned Node detected: ${id} (${nodes[id].type})`);
      orphans++;
    }
  });

  // Calculate Depth
  function calcDepth(id: string, currentDepth: number) {
    maxDepth = Math.max(maxDepth, currentDepth);
    const node = nodes[id];
    if (node && node.children) {
      node.children.forEach(c => {
        if (nodes[c]) calcDepth(c, currentDepth + 1);
      });
    }
  }
  if (nodes[ast.rootId]) calcDepth(ast.rootId, 1);

  log(`Maximum Nesting Depth: ${maxDepth}`);
  log(`Missing References: ${missingChildren}`);
  log(`Orphaned Nodes: ${orphans}`);
  log(`Integrity Status: ${missingChildren === 0 && orphans === 0 ? 'PASS' : 'WARN'}`);

  // 2. Component Distribution
  header("Component Distribution");
  Object.entries(typeDistribution)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      log(`${type.padEnd(15)}: ${count}`);
    });

  // 3. History Stats
  header("Session Stats");
  log(`Total Patches Applied: ${history.length}`);
  log(`Undos Available: ${history.length}`);
  log(`Redos Available: ${state.future.length}`);
  
  // 4. Work Order Stats
  header("Project Tracking");
  const completed = workOrders.filter(w => w.status === 'complete').length;
  log(`Total Work Orders: ${workOrders.length}`);
  log(`Completed: ${completed}`);
  log(`Pending: ${workOrders.length - completed}`);
  
  // 5. Memory / Store Estimate
  header("System Resource Est.");
  const jsonSize = JSON.stringify(state).length;
  log(`State Size: ~${(jsonSize / 1024).toFixed(2)} KB`);

  log(`\n----------------------------------------`);
  log(`End of Report`);

  return lines.join('\n');
}
