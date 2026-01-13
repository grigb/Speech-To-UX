import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, PatchSet, WorkOrder, Report } from './types';
import { INITIAL_AST } from './schema';
import { applyPatch } from './patch-engine';

// Initial State
const initialState: AppState = {
  ast: INITIAL_AST,
  history: [],
  future: [],
  workOrders: [],
  reports: [],
  selection: null,
  activePanel: 'tests',
  isRecording: false,
  dspMode: 'fallback'
};

// Actions
type Action =
  | { type: 'APPLY_PATCHSET'; payload: PatchSet }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SELECT_NODE'; id: string | null }
  | { type: 'SET_PANEL'; panel: AppState['activePanel'] }
  | { type: 'TOGGLE_RECORDING' }
  | { type: 'ADD_WORK_ORDER'; order: WorkOrder }
  | { type: 'UPDATE_WORK_ORDER'; id: string; updates: Partial<WorkOrder> }
  | { type: 'ADD_REPORT'; report: Report }
  | { type: 'DELETE_REPORT'; id: string }
  | { type: 'LOAD_STATE'; state: AppState }
  | { type: 'RESET_SESSION' };

// Reducer
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'APPLY_PATCHSET':
      let newAst = state.ast;
      // Apply all ops in patchset
      for (const op of action.payload.ops) {
        newAst = applyPatch(newAst, op);
      }
      return {
        ...state,
        ast: newAst,
        history: [...state.history, action.payload],
        future: [] // Clear redo stack on new change
      };
    
    case 'UNDO':
      if (state.history.length === 0) return state;
      const patchToUndo = state.history[state.history.length - 1];
      // Rebuild AST from scratch to undo (Naïve but robust for MVP)
      // Ideally we would have inverse patches
      // For this MVP, we will rely on replaying history minus last one.
      // Optimization: Snapshotting (omitted for brevity)
      let rebuiltAst = INITIAL_AST; 
      const newHistory = state.history.slice(0, -1);
      for (const p of newHistory) {
         for (const op of p.ops) {
           rebuiltAst = applyPatch(rebuiltAst, op);
         }
      }
      return {
        ...state,
        ast: rebuiltAst,
        history: newHistory,
        future: [patchToUndo, ...state.future]
      };

    case 'REDO':
       if (state.future.length === 0) return state;
       const patchToRedo = state.future[0];
       let redoneAst = state.ast;
       for (const op of patchToRedo.ops) {
         redoneAst = applyPatch(redoneAst, op);
       }
       return {
         ...state,
         ast: redoneAst,
         history: [...state.history, patchToRedo],
         future: state.future.slice(1)
       };

    case 'SELECT_NODE':
      return { ...state, selection: action.id };

    case 'SET_PANEL':
      return { ...state, activePanel: action.panel };

    case 'TOGGLE_RECORDING':
      return { ...state, isRecording: !state.isRecording };

    case 'ADD_WORK_ORDER':
      return { ...state, workOrders: [action.order, ...state.workOrders] };
      
    case 'UPDATE_WORK_ORDER':
      return {
        ...state,
        workOrders: state.workOrders.map(wo => wo.id === action.id ? { ...wo, ...action.updates } : wo)
      };

    case 'ADD_REPORT':
      return { ...state, reports: [action.report, ...state.reports] };

    case 'DELETE_REPORT':
      return { ...state, reports: state.reports.filter(r => r.id !== action.id) };

    case 'LOAD_STATE':
      // Ensure reports exists on loaded state if importing legacy file
      return {
        ...action.state,
        reports: action.state.reports || []
      };

    case 'RESET_SESSION':
      return {
        ...initialState,
        // Ensure AST is fresh clone of INITIAL_AST
        ast: JSON.parse(JSON.stringify(INITIAL_AST))
      };

    default:
      return state;
  }
}

// Persistence Wrapper
const STORAGE_KEY = 'uix_builder_v1';

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState, (initial) => {
    // Try hydrate
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : initial;
      // Migration for new reports field if missing
      if (!parsed.reports) parsed.reports = [];
      return parsed;
    } catch (e) {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};