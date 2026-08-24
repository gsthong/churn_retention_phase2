import { useEffect, useState } from 'react';
import { 
  Terminal, 
  BrainCircuit, 
  ShieldCheck, 
  Send, 
  Search, 
  Cpu, 
  Layers, 
  Database,
  Radio
} from 'lucide-react';
import { fetchAgentGraph, fetchStats } from '../api/client';
import type { StatsResponse } from '../api/client';

const mockTraces = [
  {
    step: 1,
    time: '10:42:01.031',
    agent: 'Data Retriever Agent',
    badge: 'LLM: openrouter/free',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    title: 'Interaction Log Ingestion & Pain Point Mining',
    details: 'Đã phân tích 3 sự kiện hỗ trợ từ data/logs/CUS-0002.txt. Trích xuất: ["Ứng dụng bị văng", "Giao diện khó dùng"]. Sentiment: frustrated.',
    status: 'success'
  },
  {
    step: 2,
    time: '10:42:02.145',
    agent: 'Strategic Negotiator Agent',
    badge: 'LLM: openrouter/free',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'CAC vs CRC Arbitrage & Action Synthesis',
    details: 'Phân khúc: True_Friends_Standard (LTV 32.5M, Risk 60.5%). Đề xuất: VIP Training + 1 tháng miễn phí. Lý do: Giữ chân High LTV với chi phí phục vụ thấp.',
    status: 'success'
  },
  {
    step: 3,
    time: '10:42:02.150',
    agent: 'Policy Guardrail Layer',
    badge: 'Deterministic Engine',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'Hard Budget Guardrail Verification',
    details: 'Kiểm tra quy tắc Guardrail Tier True_Friends_Standard: Max discount 25%, Max free months: 1. Đề xuất HỢP LỆ (0% discount, 1 free month). Đã phê duyệt.',
    status: 'success'
  },
  {
    step: 4,
    time: '10:42:03.420',
    agent: 'Execution Agent',
    badge: 'LLM: openrouter/free',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    title: 'Personalized Message Generation & Dispatch',
    details: 'Sinh tin nhắn tiếng Việt đồng cảm gửi chị Phương qua Zalo OA/Phone call. Đã lưu trữ tin nhắn vào outputs/messages/CUS-0002.txt.',
    status: 'success'
  }
];

export function Orchestrator() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetchAgentGraph().then(() => {});
    fetchStats().then(s => s && setStats(s));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu size={20} className="text-teal-400" />
            Multi-Agent Architecture & Execution Graph
          </h1>
          <p className="text-xs text-slate-400">
            Sơ đồ phối hợp và luồng dữ liệu tự động giữa 3 AI Agents, Guardrail ngân sách và Kênh gửi đa nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            <Radio size={12} className="animate-pulse" /> 3 Agents Online
          </span>
          <span className="text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            Provider: {stats?.provider || 'OpenRouter'}
          </span>
        </div>
      </div>

      {/* Visual Multi-Agent Pipeline Graph */}
      <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Layers size={15} className="text-teal-400" />
          Autonomous Multi-Agent Workflow Pipeline
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Card 1: Phase 1 Input */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 relative group hover:border-slate-700 transition-all">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Input Source</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Database size={15} className="text-blue-400" />
              Phase 1 ML Risk
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Dự báo rủi ro rời bỏ (Risk Score), LTV và thông tin hợp đồng.
            </p>
            <div className="text-[10px] font-mono text-blue-400 bg-blue-950/60 p-1.5 rounded border border-blue-900/50">
              XGBoost / LightGBM
            </div>
          </div>

          {/* Card 2: Retriever Agent */}
          <div className="bg-slate-900 border border-blue-500/30 p-4 rounded-xl space-y-2 relative group hover:border-blue-500/60 transition-all bg-gradient-to-b from-blue-950/20 to-slate-900">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Agent 1</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Search size={15} className="text-blue-400" />
              Data Retriever
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Đọc log hỗ trợ, trích xuất pain points, tóm tắt và đánh giá sentiment.
            </p>
            <div className="text-[10px] font-mono text-blue-300 bg-blue-950/80 p-1.5 rounded border border-blue-800/60">
              {stats?.models.retriever || 'openrouter/free'}
            </div>
          </div>

          {/* Card 3: Negotiator Agent */}
          <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl space-y-2 relative group hover:border-emerald-500/60 transition-all bg-gradient-to-b from-emerald-950/20 to-slate-900">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Agent 2</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <BrainCircuit size={15} className="text-emerald-400" />
              Strategic Negotiator
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Tối ưu kinh tế CAC vs CRC, đề xuất ưu đãi phù hợp theo phân khúc LTV.
            </p>
            <div className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 p-1.5 rounded border border-emerald-800/60">
              {stats?.models.negotiator || 'openrouter/free'}
            </div>
          </div>

          {/* Card 4: Guardrail Layer */}
          <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl space-y-2 relative group hover:border-amber-500/60 transition-all bg-gradient-to-b from-amber-950/20 to-slate-900">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Constraint Layer</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-amber-400" />
              Budget Guardrail
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Ép cứng trần giảm giá % và danh mục hành động được phép theo Tier.
            </p>
            <div className="text-[10px] font-mono text-amber-300 bg-amber-950/80 p-1.5 rounded border border-amber-800/60">
              Rule-Engine (100% Enforced)
            </div>
          </div>

          {/* Card 5: Execution Agent */}
          <div className="bg-slate-900 border border-purple-500/30 p-4 rounded-xl space-y-2 relative group hover:border-purple-500/60 transition-all bg-gradient-to-b from-purple-950/20 to-slate-900">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Agent 3</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Send size={15} className="text-purple-400" />
              Execution Agent
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Soạn tin nhắn tiếng Việt tự nhiên và gửi qua Email / Zalo OA.
            </p>
            <div className="text-[10px] font-mono text-purple-300 bg-purple-950/80 p-1.5 rounded border border-purple-800/60">
              {stats?.models.execution || 'openrouter/free'}
            </div>
          </div>
        </div>
      </div>

      {/* Live Agent Execution Trace Terminal */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
        <div className="bg-[#111827] border-b border-slate-800 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Terminal size={15} className="text-teal-400" />
            Live Agent Trace & Memory Inspector (Customer: CUS-0002)
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Pipeline Latency: ~1.4s / account
          </div>
        </div>

        <div className="p-6 space-y-4 font-sans">
          {mockTraces.map((trace) => (
            <div 
              key={trace.step}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-slate-700 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-teal-400 font-mono font-bold text-[10px] flex items-center justify-center border border-slate-700">
                    {trace.step}
                  </span>
                  <span className="font-bold text-sm text-white">{trace.agent}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${trace.badgeColor}`}>
                    {trace.badge}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-300 font-mono">
                  {trace.title}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  {trace.details}
                </p>
              </div>

              <div className="text-[10px] font-mono text-slate-500 shrink-0">
                [{trace.time}]
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
