import { useEffect, useState } from 'react';
import { 
  Terminal
} from 'lucide-react';
import { fetchAgentGraph, fetchStats } from '../api/client';
import type { StatsResponse } from '../api/client';

const mockTraces = [
  {
    step: 1,
    time: '10:42:01.031',
    node: 'Data Retriever Node',
    spec: 'openrouter/free',
    title: 'Interaction Log Ingestion & Extraction',
    details: 'Read 3 support tickets for account CUS-0002. Extracted signals: ["App crash", "UI complexity"]. Sentiment: frustrated.',
  },
  {
    step: 2,
    time: '10:42:02.145',
    node: 'Negotiator Strategy Node',
    spec: 'openrouter/free',
    title: 'Arbitrage Analysis & Offer Selection',
    details: 'Segment: True_Friends_Standard (LTV 32.5M, Risk 60.5%). Proposed action: VIP Training + 1 month service extension.',
  },
  {
    step: 3,
    time: '10:42:02.150',
    node: 'Guardrail Policy Engine',
    spec: 'Deterministic Rule',
    title: 'Budget & Constraint Verification',
    details: 'Checked True_Friends_Standard policy rules: Max discount 25%, Max free months 1. Proposal VALID. Passed guardrail check.',
  },
  {
    step: 4,
    time: '10:42:03.420',
    node: 'Execution Dispatch Node',
    spec: 'openrouter/free',
    title: 'Message Formatting & Route Dispatch',
    details: 'Generated empathetic message and routed via Zalo OA / Support CRM. Stored in outputs/messages/CUS-0002.txt.',
  }
];

export function Orchestrator() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetchAgentGraph().then(() => {});
    fetchStats().then(s => s && setStats(s));
  }, []);

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Pipeline Architecture & Execution Telemetry
          </h1>
          <div className="text-xs text-slate-400">Deterministic and LLM node sequence flow</div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            Provider: {stats?.provider || 'OpenRouter'}
          </span>
        </div>
      </div>

      {/* Pipeline Node Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
        {/* Node 1 */}
        <div className="bg-white border border-slate-200 p-3 rounded space-y-1.5">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">Input Layer</div>
          <div className="text-xs font-bold text-slate-900">P1 ML Classifier</div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Predicts churn probability score and computes LTV from historical data.
          </p>
          <div className="text-[9px] font-mono text-slate-600 bg-slate-50 p-1 rounded border border-slate-100">
            Model: LightGBM
          </div>
        </div>

        {/* Node 2 */}
        <div className="bg-white border border-slate-200 p-3 rounded space-y-1.5">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">Node 01</div>
          <div className="text-xs font-bold text-slate-900">Data Retriever</div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Extracts pain points and sentiment from support ticket conversation logs.
          </p>
          <div className="text-[9px] font-mono text-slate-600 bg-slate-50 p-1 rounded border border-slate-100">
            {stats?.models.retriever || 'openrouter/free'}
          </div>
        </div>

        {/* Node 3 */}
        <div className="bg-white border border-slate-200 p-3 rounded space-y-1.5">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">Node 02</div>
          <div className="text-xs font-bold text-slate-900">Negotiator Node</div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Evaluates CAC vs CRC arbitrage and selects appropriate retention strategy.
          </p>
          <div className="text-[9px] font-mono text-slate-600 bg-slate-50 p-1 rounded border border-slate-100">
            {stats?.models.negotiator || 'openrouter/free'}
          </div>
        </div>

        {/* Node 4 */}
        <div className="bg-white border border-slate-200 p-3 rounded space-y-1.5">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">Constraint Layer</div>
          <div className="text-xs font-bold text-slate-900">Guardrail Engine</div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Enforces hard ceilings on discounts, free months, and allowed actions.
          </p>
          <div className="text-[9px] font-mono text-slate-600 bg-slate-50 p-1 rounded border border-slate-100">
            Deterministic Rule
          </div>
        </div>

        {/* Node 5 */}
        <div className="bg-white border border-slate-200 p-3 rounded space-y-1.5">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">Node 03</div>
          <div className="text-xs font-bold text-slate-900">Execution Dispatch</div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Formats personalized outreach messages and dispatches via active channels.
          </p>
          <div className="text-[9px] font-mono text-slate-600 bg-slate-50 p-1 rounded border border-slate-100">
            {stats?.models.execution || 'openrouter/free'}
          </div>
        </div>
      </div>

      {/* Execution Trace Inspector */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden font-mono text-xs">
        <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
            <Terminal size={12} className="text-slate-500" />
            Execution Trace Log (Account: CUS-0002)
          </div>
          <div className="text-[9px] text-slate-400">
            Latency: ~1.4s / account
          </div>
        </div>

        <div className="p-3.5 space-y-2 font-sans">
          {mockTraces.map((trace) => (
            <div 
              key={trace.step}
              className="p-2.5 rounded bg-slate-50/60 border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-2"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-slate-200 text-slate-700 font-mono font-bold text-[9px] flex items-center justify-center">
                    {trace.step}
                  </span>
                  <span className="font-semibold text-xs text-slate-900">{trace.node}</span>
                  <span className="text-[8.5px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded">
                    {trace.spec}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-600 font-mono">
                  {trace.title}
                </div>
                <p className="text-[10.5px] text-slate-700 font-mono bg-white p-2 rounded border border-slate-100">
                  {trace.details}
                </p>
              </div>

              <div className="text-[9px] font-mono text-slate-400 shrink-0">
                [{trace.time}]
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
