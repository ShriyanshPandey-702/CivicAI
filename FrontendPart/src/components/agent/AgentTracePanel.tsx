import { useEffect, useRef } from 'react';
import { Copy, Download } from 'lucide-react';

interface AgentTracePanelProps {
  logs: string[];
  isRunning: boolean;
}

const AgentTracePanel = ({ logs, isRunning }: AgentTracePanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
  };

  return (
    <div className="terminal-window h-full flex flex-col" role="log" aria-live="polite" aria-label="Agent trace logs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-muted-foreground/20">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-destructive" />
          <span className="w-3 h-3 rounded-full bg-warning" />
          <span className="w-3 h-3 rounded-full bg-ashoka-green" />
          <span className="ml-2 text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Agent Trace</span>
        </div>
        <div className="flex gap-2">
          <button onClick={copyLogs} className="text-muted-foreground hover:text-ashoka-green p-1" aria-label="Copy logs">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button className="text-muted-foreground hover:text-ashoka-green p-1" aria-label="Download report">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 text-xs font-mono leading-6 min-h-[300px] max-h-[500px]">
        {logs.length === 0 && (
          <div className="text-muted-foreground">Waiting for agent pipeline to start...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap">
            <span>{log}</span>
          </div>
        ))}
        {isRunning && (
          <div className="mt-1">
            [LIVE] <span className="animate-blink">▌</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentTracePanel;
