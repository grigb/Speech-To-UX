import React, { useRef } from 'react';
import { useAppStore } from '../core/store';
import { TreePanel } from './TreePanel';
import { RenderEngine } from './RenderEngine';
import { XmlPanel } from './XmlPanel';
import { WorkOrderPanel } from './WorkOrderPanel';
import { ReportPanel } from './ReportPanel';
import { TestPanel } from './TestPanel';
import { CommandBar } from './CommandBar';

export const App = () => {
  const { state, dispatch } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "uix_session_" + new Date().toISOString().slice(0,19).replace(/[:T]/g,"-") + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation: check if it has 'ast'
        if (json.ast && json.ast.rootId) {
          dispatch({ type: 'LOAD_STATE', state: json });
        } else {
          alert("Invalid session file format.");
        }
      } catch (err) {
        console.error("Failed to parse session file", err);
        alert("Failed to parse session file.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const NavTab = ({ id, label }: { id: typeof state.activePanel, label: string }) => (
    <button 
      style={{ 
        flex: 1, 
        padding: '8px', 
        background: state.activePanel === id ? 'var(--bg-input)' : 'transparent', 
        border: 'none', 
        color: state.activePanel === id ? 'var(--text-primary)' : 'var(--text-secondary)', 
        cursor: 'pointer', 
        fontSize: '10px', 
        fontWeight: 600, 
        borderBottom: state.activePanel === id ? '2px solid var(--accent-primary)' : '2px solid transparent'
      }}
      onClick={() => dispatch({ type: 'SET_PANEL', panel: id })}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <div style={{ height: '40px', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>UIX BUILDER <span style={{fontSize:'10px', opacity:0.5}}>v0.3</span></div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="icon-btn" 
            onClick={() => dispatch({ type: 'RESET_SESSION' })}
            title="New Session"
          >
            New
          </button>
          
          <button 
            className="icon-btn" 
            onClick={() => fileInputRef.current?.click()}
            title="Open Session File"
          >
            Open
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} style={{display:'none'}} accept=".json" />

          <button 
            className="icon-btn" 
            onClick={handleExport}
            title="Save Session to File"
          >
            Save
          </button>

          <div style={{width:'1px', height:'16px', background:'var(--border-color)', margin:'0 4px'}}></div>

          <button className="icon-btn" onClick={() => dispatch({ type: 'UNDO' })} disabled={state.history.length === 0}>Undo</button>
          <button className="icon-btn" onClick={() => dispatch({ type: 'REDO' })} disabled={state.future.length === 0}>Redo</button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left: Tree */}
        <div style={{ width: '250px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
          <div className="panel-header">Component Tree</div>
          <TreePanel />
        </div>

        {/* Center: Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000' }}>
          <div className="panel-header" style={{background: '#111'}}>Preview: {state.ast.rootId}</div>
          <div style={{ flex: 1, overflow: 'hidden', padding: '20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <RenderEngine />
            </div>
          </div>
        </div>

        {/* Right: XML / Triage / Reports */}
        <div style={{ width: '350px', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            <NavTab id="tests" label="TESTS" />
            <NavTab id="xml" label="XML" />
            <NavTab id="triage" label="TRIAGE" />
            <NavTab id="reports" label="REPORTS" />
          </div>
          
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {state.activePanel === 'xml' && <XmlPanel />}
            {state.activePanel === 'triage' && <WorkOrderPanel />}
            {state.activePanel === 'reports' && <ReportPanel />}
            {state.activePanel === 'tests' && <TestPanel />}
          </div>
        </div>

      </div>

      {/* Bottom: Command */}
      <CommandBar />
    </div>
  );
};
