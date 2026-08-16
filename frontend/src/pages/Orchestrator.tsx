import React from 'react';
import { Activity, Terminal, BrainCircuit, MessageSquare, FastForward, CheckCircle2 } from 'lucide-react';

const mockLogs = [
  { time: '10:42:01.031', agent: 'Orchestrator', action: 'INITIATED', target: 'OP-9013', details: 'Customer risk threshold breached (Risk: 82%)' },
  { time: '10:42:01.085', agent: 'Data Retriever', action: 'FETCHING', target: 'Acme Studio', details: 'Querying Stripe API & Zendesk...' },
  { time: '10:42:02.102', agent: 'Data Retriever', action: 'SUCCESS', target: 'Acme Studio', details: 'LTV: $45,200 (85th pct). 2 open tickets. Usage -40%.' },
  { time: '10:42:02.105', agent: 'Negotiator', action: 'ANALYZING', target: 'Acme Studio', details: 'Segment: True Friends. Constraint: Max 30% discount.' },
  { time: '10:42:04.450', agent: 'Negotiator', action: 'DECISION', target: 'Acme Studio', details: '{"action": "discount", "pct": 15, "reasoning": "High LTV, temporary pain point. 15% sufficient to retain."}' },
  { time: '10:42:04.455', agent: 'Execution', action: 'DRAFTING', target: 'Acme Studio', details: 'Translating decision into natural language...' },
  { time: '10:42:05.120', agent: 'Execution', action: 'DISPATCHED', target: 'Acme Studio', details: 'Email sent via SendGrid. OP-9013 marked as Running.' },
];

export function Orchestrator() {
  return (
    <div className="flex flex-col h-full bg-slate-50 space-y-4">
      {/* Top Telemetry */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <div className="bg-white border border-slate-200 rounded p-3 flex items-center justify-between">
           <div>
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Live Agents</div>
             <div className="text-lg font-bold font-mono text-teal-700 flex items-center gap-2"><BrainCircuit size={16}/> 3 Active</div>
           </div>
           <div className="w-10 h-10 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin"></div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Token Usage (24h)</div>
           <div className="text-lg font-bold font-mono text-slate-800">4,192,840</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avg LLM Latency</div>
           <div className="text-lg font-bold font-mono text-slate-800">1.24s</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Agent Cost (Est)</div>
           <div className="text-lg font-bold font-mono text-slate-800">$14.20 <span className="text-[10px] text-slate-400 font-sans font-normal">/ day</span></div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Live Terminal Log */}
        <div className="flex-1 bg-[#0f172a] rounded shadow-inner border border-slate-800 flex flex-col overflow-hidden font-mono text-xs">
           <div className="bg-[#1e293b] border-b border-slate-800 p-2 flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                 <Terminal size={14} /> Agent Execution Log (Live)
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Websocket Connected
              </div>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mockLogs.map((log, i) => (
                <div key={i} className="flex gap-3">
                   <div className="text-slate-500 shrink-0 w-24">[{log.time}]</div>
                   <div className={`font-bold w-32 shrink-0
                     ${log.agent === 'Orchestrator' ? 'text-purple-400' : log.agent === 'Data Retriever' ? 'text-blue-400' : log.agent === 'Negotiator' ? 'text-emerald-400' : 'text-amber-400'}`}>
                     {log.agent}
                   </div>
                   <div className="text-slate-300 flex-1">
                     <span className="text-white bg-slate-800 px-1 rounded mr-2">{log.action}</span>
                     {log.target && <span className="text-teal-300 mr-2">{log.target}</span>}
                     {log.details}
                   </div>
                </div>
              ))}
              <div className="flex gap-3 animate-pulse">
                   <div className="text-slate-500 shrink-0 w-24">[{new Date().toISOString().substring(11,23)}]</div>
                   <div className="font-bold w-32 shrink-0 text-slate-500">System</div>
                   <div className="text-slate-500 flex-1">Waiting for next anomaly detection...</div>
              </div>
           </div>
        </div>

        {/* Side Panel: Decision Heatmap */}
        <div className="w-80 flex flex-col gap-4">
           <div className="bg-white border border-slate-200 rounded p-4 flex-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BrainCircuit size={14} className="text-teal-600"/> Decision Matrix
              </h3>
              
              <div className="text-[10px] text-slate-500 mb-2">LTV vs Sentiment (Last 100 Actions)</div>
              
              {/* Fake Heatmap Grid */}
              <div className="grid grid-cols-4 gap-1">
                 {/* Y-axis Labels */}
                 <div className="col-span-1 flex flex-col justify-between text-[8px] text-slate-400 uppercase text-right pr-2">
                   <span>High LTV</span>
                   <span>Med LTV</span>
                   <span>Low LTV</span>
                 </div>
                 {/* Grid */}
                 <div className="col-span-3 grid grid-cols-3 gap-1 aspect-square">
                    <div className="bg-teal-500 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">12</div>
                    <div className="bg-teal-400 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">8</div>
                    <div className="bg-rose-400 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">4</div>

                    <div className="bg-teal-300 rounded-sm flex items-center justify-center text-teal-900 text-[10px] font-bold">5</div>
                    <div className="bg-slate-200 rounded-sm flex items-center justify-center text-slate-600 text-[10px] font-bold">15</div>
                    <div className="bg-rose-300 rounded-sm flex items-center justify-center text-rose-900 text-[10px] font-bold">6</div>

                    <div className="bg-slate-100 rounded-sm flex items-center justify-center text-slate-400 text-[10px] font-bold">0</div>
                    <div className="bg-slate-200 rounded-sm flex items-center justify-center text-slate-600 text-[10px] font-bold">22</div>
                    <div className="bg-rose-200 rounded-sm flex items-center justify-center text-rose-800 text-[10px] font-bold">28</div>
                 </div>
                 {/* X-axis Labels */}
                 <div className="col-span-1"></div>
                 <div className="col-span-3 flex justify-between text-[8px] text-slate-400 uppercase pt-1">
                   <span>Positive</span>
                   <span>Neutral</span>
                   <span>Negative</span>
                 </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                 <div className="text-[10px] font-bold text-slate-700 uppercase mb-2">Key Observations</div>
                 <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-start gap-1"><FastForward size={12} className="text-teal-500 shrink-0 mt-0.5"/> High LTV + Negative Sentiment triggers highest intervention rate (Annual Upgrade).</li>
                    <li className="flex items-start gap-1"><CheckCircle size={12} className="text-slate-400 shrink-0 mt-0.5"/> Low LTV + Negative Sentiment defaults to "No Action" (Fire Client).</li>
                 </ul>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
