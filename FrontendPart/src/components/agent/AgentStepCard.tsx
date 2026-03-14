import { CheckCircle, Clock, Zap, AlertCircle, Loader2 } from 'lucide-react';
import type { AgentStep } from '@/lib/types';

const statusConfig = {
  idle: { color: 'bg-muted', border: 'border-border', icon: Clock, textColor: 'text-muted-foreground' },
  queued: { color: 'bg-muted', border: 'border-dashed border-border', icon: Clock, textColor: 'text-muted-foreground' },
  running: { color: 'bg-primary', border: 'border-primary', icon: Zap, textColor: 'text-primary' },
  complete: { color: 'bg-ashoka-green', border: 'border-ashoka-green', icon: CheckCircle, textColor: 'text-ashoka-green' },
  error: { color: 'bg-destructive', border: 'border-destructive', icon: AlertCircle, textColor: 'text-destructive' },
};

const AgentStepCard = ({ step }: { step: AgentStep }) => {
  const config = statusConfig[step.status];
  const StatusIcon = config.icon;

  return (
    <div className={`relative flex gap-4 ${step.status === 'running' ? 'agent-step-running' : ''}`}>
      {/* Step number circle */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          step.status === 'complete' ? 'bg-ashoka-green text-accent-foreground' :
          step.status === 'running' ? 'bg-primary text-primary-foreground' :
          'bg-muted text-muted-foreground'
        }`}>
          {step.status === 'running' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : step.status === 'complete' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            step.step
          )}
        </div>
        {/* Connector line */}
        {step.step < 7 && (
          <div className={`w-0.5 flex-1 min-h-[20px] mt-1 ${
            step.status === 'complete' ? 'bg-ashoka-green' : 'bg-border'
          }`} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-6 border rounded-lg p-4 mb-2 ${config.border}`}>
        <div className="flex items-center justify-between mb-1">
          <h4 className={`font-body font-semibold text-sm ${config.textColor}`}>{step.agent_name}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            step.status === 'complete' ? 'bg-ashoka-green/10 text-ashoka-green' :
            step.status === 'running' ? 'bg-primary/10 text-primary' :
            'bg-muted text-muted-foreground'
          }`}>
            {step.status === 'running' ? '⚡ Running...' :
             step.status === 'complete' ? '✅ Complete' :
             step.status === 'queued' ? '⏳ Queued' : '⏳ Waiting'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{step.message}</p>
        {step.status === 'running' && (
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentStepCard;
