import React, { useState } from 'react';
import { useAppStore } from '../core/store';
import { runDiagnostics } from '../core/diagnostics';
import { Report } from '../core/types';

export const ReportPanel = () => {
  const { state, dispatch } = useAppStore();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleRunTest = () => {
    const content = runDiagnostics(state);
    const report: Report = {
      id: `rep-${Date.now()}`,
      timestamp: Date.now(),
      title: `Diagnostic Run #${state.reports.length + 1}`,
      content
    };
    dispatch({ type: 'ADD_REPORT', report });
    setSelectedReportId(report.id);
  };

  const selectedReport = state.reports.find(r => r.id === selectedReportId) || state.reports[0];

  const handleCopy = () => {
    if (selectedReport) {
      navigator.clipboard.writeText(selectedReport.content);
      // Optional: Add a toast notification here if we had a toast system
    }
  };

  const handleDownload = () => {
    if (!selectedReport) return;
    const blob = new Blob([selectedReport.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Sandbox blocks confirm(), proceeding directly
    dispatch({ type: 'DELETE_REPORT', id });
    if (selectedReportId === id) setSelectedReportId(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
        <button 
          onClick={handleRunTest}
          style={{
            flex: 1,
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '12px'
          }}
        >
          RUN SYSTEM TEST
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List */}
        <div style={{ width: '120px', borderRight: '1px solid var(--border-color)', overflowY: 'auto', background: 'var(--bg-app)' }}>
          {state.reports.length === 0 && (
             <div style={{padding:'12px', fontSize:'11px', opacity:0.5}}>No reports generated.</div>
          )}
          {state.reports.map(r => (
            <div 
              key={r.id}
              onClick={() => setSelectedReportId(r.id)}
              style={{
                padding: '10px 8px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                background: selectedReport?.id === r.id ? 'var(--bg-input)' : 'transparent',
                fontSize: '11px',
                position: 'relative',
                group: 'report-item' // JSX doesn't support group, simulated via CSS if needed or layout
              }}
            >
              <div style={{fontWeight:600}}>{new Date(r.timestamp).toLocaleTimeString()}</div>
              <div style={{opacity:0.6}}>{r.title}</div>
              <div 
                 onClick={(e) => handleDelete(e, r.id)}
                 style={{
                     position: 'absolute', top: '4px', right: '4px', 
                     fontSize: '10px', color: 'var(--accent-destructive)', cursor: 'pointer',
                     opacity: 0.5
                 }}
                 title="Delete"
              >✕</div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-input)' }}>
          {selectedReport ? (
            <>
              <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{selectedReport.title}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                    onClick={handleDownload}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                    >
                    SAVE FILE
                    </button>
                    <button 
                    onClick={handleCopy}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                    >
                    COPY
                    </button>
                </div>
              </div>
              <textarea 
                readOnly
                value={selectedReport.content}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  resize: 'none',
                  outline: 'none',
                  whiteSpace: 'pre-wrap'
                }}
              />
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '12px', opacity: 0.5 }}>
              Select a report to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
