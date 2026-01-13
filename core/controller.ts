import { AST, WorkOrder, AppState } from './types';
import { generatePatchFromInput } from './ai';

// Helper to execute a command against the state
export async function executeCommand(
  input: string, 
  ast: AST, 
  dispatch: any,
  isTest = false
): Promise<{ success: boolean; patchId?: string; error?: string }> {
  
  // 1. Create a Work Order (if not test, or purely for logging)
  let woId = '';
  if (!isTest) {
    const wo: WorkOrder = {
      id: `wo-${Date.now()}`,
      title: input.length > 40 ? input.slice(0, 40) + '...' : input,
      description: input,
      status: 'in-progress',
      priority: 'medium',
      createdAt: Date.now()
    };
    dispatch({ type: 'ADD_WORK_ORDER', order: wo });
    woId = wo.id;
  }

  try {
    // 2. Call AI
    const patchSet = await generatePatchFromInput(input, ast);
    
    if (patchSet) {
      patchSet.author = isTest ? 'system' : 'ai';
      patchSet.timestamp = Date.now();

      dispatch({
        type: 'APPLY_PATCHSET',
        payload: patchSet
      });
      
      if (!isTest) {
        dispatch({
          type: 'UPDATE_WORK_ORDER',
          id: woId,
          updates: { status: 'complete' }
        });
      }
      return { success: true, patchId: patchSet.id };
    } else {
      if (!isTest) {
        dispatch({
          type: 'UPDATE_WORK_ORDER',
          id: woId,
          updates: { status: 'review', description: 'AI failed to generate a valid patch.' }
        });
      }
      return { success: false, error: 'No patch generated' };
    }
  } catch (e: any) {
    console.error(e);
    if (!isTest) {
      dispatch({
          type: 'UPDATE_WORK_ORDER',
          id: woId,
          updates: { status: 'review', description: 'System error during generation.' }
      });
    }
    return { success: false, error: e.message };
  }
}
