import React, { useState } from 'react';
import { useAppStore } from '../core/store';
import { executeCommand } from '../core/controller';

export const CommandBar = () => {
  const { state, dispatch } = useAppStore();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    await executeCommand(input, state.ast, dispatch);
    setInput('');
    setIsProcessing(false);
  };

  return (
    <div style={{ 
      height: '60px', 
      background: 'var(--bg-panel)', 
      borderTop: '1px solid var(--border-color)', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 16px',
      gap: '12px'
    }}>
      <button 
        className={`icon-btn ${state.isRecording ? 'recording' : ''}`}
        onClick={() => dispatch({ type: 'TOGGLE_RECORDING' })}
        title="Voice Input (Stub - Live API pending)"
        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-color)' }}
      >
        {state.isRecording ? '●' : 'mic'}
      </button>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isProcessing ? "AI is Thinking..." : state.isRecording ? "Listening..." : "Type a command (e.g. 'Add a red delete button to header')"}
          disabled={isProcessing}
          style={{
            flex: 1,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            outline: 'none',
            opacity: isProcessing ? 0.5 : 1
          }}
        />
      </form>

      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'right' }}>
        <div>HISTORY: {state.history.length}</div>
        <div>MODE: {state.dspMode.toUpperCase()}</div>
      </div>
    </div>
  );
};
