import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../core/store';
import { TEST_SUITES, TestSuite } from '../core/qa';
import { executeCommand } from '../core/controller';
import { verifyIntention } from '../core/ai';
import { projectXML } from '../core/xml-engine';
import { Report, TestResult } from '../core/types';

export const TestPanel = () => {
  const { state, dispatch } = useAppStore();
  const [activeSuite, setActiveSuite] = useState<TestSuite | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Ref to access latest AST during async loop without dependency issues
  const astRef = useRef(state.ast);
  useEffect(() => { astRef.current = state.ast; }, [state.ast]);

  const runSuite = async (suite: TestSuite) => {
    // Sandbox environment blocks confirm(), executing immediately.
    setIsRunning(true);
    setActiveSuite(suite);
    
    // Initialize results
    const initialResults: TestResult[] = suite.steps.map((step, i) => ({
        stepIndex: i,
        command: step.command,
        status: 'pending',
        logs: []
    }));
    setResults(initialResults);

    for (let i = 0; i < suite.steps.length; i++) {
        const step = suite.steps[i];
        
        // Update Status: Running
        updateResult(i, { status: 'running' });
        
        // 1. Execute Command
        log(i, `> Executing: "${step.command}"`);
        const execResult = await executeCommand(step.command, astRef.current, dispatch, true);
        
        if (!execResult.success) {
            log(i, `Error: ${execResult.error}`);
            updateResult(i, { status: 'failed' });
            createFailureReport(suite.name, step.command, "Execution Failed", execResult.error || 'Unknown');
            break; // Stop suite
        }

        // Wait a tick for state to settle (though executeCommand awaits the generation, the store update is sync)
        await new Promise(r => setTimeout(r, 500)); 

        // 2. Verify
        log(i, `> Verifying XML...`);
        const xml = projectXML(astRef.current);
        const verification = await verifyIntention(step.command, xml);

        if (verification.satisfied) {
            log(i, `✔ Passed`);
            updateResult(i, { status: 'success' });
        } else {
            log(i, `✖ Check Failed: ${verification.reason}`);
            
            // 3. Attempt Self-Heal
            if (verification.fixCommand) {
                log(i, `> Attempting Fix: "${verification.fixCommand}"`);
                
                const fixResult = await executeCommand(verification.fixCommand, astRef.current, dispatch, true);
                await new Promise(r => setTimeout(r, 500));
                
                // Verify Fix
                const fixXml = projectXML(astRef.current);
                const fixVerification = await verifyIntention(step.command, fixXml);

                if (fixVerification.satisfied) {
                    log(i, `✔ Fix Successful`);
                    updateResult(i, { status: 'fixed' });
                    createFixReport(suite.name, step.command, verification.reason, verification.fixCommand);
                } else {
                    log(i, `✖ Fix Failed: ${fixVerification.reason}`);
                    updateResult(i, { status: 'failed' });
                    createFailureReport(suite.name, step.command, "Fix Failed", fixVerification.reason);
                    break; // Stop suite
                }
            } else {
                updateResult(i, { status: 'failed' });
                createFailureReport(suite.name, step.command, "Verification Failed", verification.reason);
                break;
            }
        }
    }
    setIsRunning(false);
  };

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, ...update } : r));
  };

  const log = (index: number, message: string) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, logs: [...r.logs, message] } : r));
  };

  const createFailureReport = (suiteName: string, command: string, issue: string, details: string) => {
      const report: Report = {
          id: `test-fail-${Date.now()}`,
          timestamp: Date.now(),
          title: `Test Failed: ${suiteName}`,
          content: `Command: ${command}\nIssue: ${issue}\nDetails: ${details}\n\nGenerated XML:\n${projectXML(astRef.current)}`
      };
      dispatch({ type: 'ADD_REPORT', report });
  };

  const createFixReport = (suiteName: string, command: string, issue: string, fix: string) => {
    const report: Report = {
        id: `test-fix-${Date.now()}`,
        timestamp: Date.now(),
        title: `Auto-Fix Applied: ${suiteName}`,
        content: `Command: ${command}\nOriginal Issue: ${issue}\nApplied Fix: ${fix}\nStatus: RESOLVED`
    };
    dispatch({ type: 'ADD_REPORT', report });
};

  const getStatusIcon = (status: TestResult['status']) => {
      switch(status) {
          case 'pending': return '○';
          case 'running': return '...';
          case 'success': return '✔';
          case 'failed': return '✖';
          case 'fixed': return '🔧';
      }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch(status) {
        case 'pending': return 'var(--text-secondary)';
        case 'running': return 'var(--accent-primary)';
        case 'success': return 'var(--accent-success)';
        case 'failed': return 'var(--accent-destructive)';
        case 'fixed': return 'var(--accent-primary)';
    }
};

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!activeSuite ? (
        <div style={{ padding: '12px' }}>
             <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                AVAILABLE SUITES
            </div>
            {TEST_SUITES.map(suite => (
                <div key={suite.id} style={{ marginBottom: '8px', background: 'var(--bg-input)', padding: '10px', borderRadius: '4px' }}>
                    <div style={{fontWeight: 600, fontSize:'13px'}}>{suite.name}</div>
                    <div style={{fontSize:'11px', color:'var(--text-secondary)', marginBottom: '8px'}}>{suite.description}</div>
                    <button 
                        onClick={() => runSuite(suite)}
                        disabled={isRunning}
                        style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            borderRadius: '2px'
                        }}
                    >
                        Run Suite
                    </button>
                </div>
            ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{activeSuite.name}</span>
                <button onClick={() => setActiveSuite(null)} disabled={isRunning} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {results.map((res, i) => (
                    <div key={i} style={{ marginBottom: '12px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: getStatusColor(res.status), fontWeight: 'bold', marginRight: '8px', width: '12px' }}>
                                {getStatusIcon(res.status)}
                            </span>
                            <span style={{ opacity: res.status === 'pending' ? 0.5 : 1 }}>{res.command}</span>
                        </div>
                        {res.logs.length > 0 && (
                            <div style={{ marginLeft: '20px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {res.logs.map((l, idx) => <div key={idx}>{l}</div>)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
