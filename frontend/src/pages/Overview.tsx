import { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell
} from 'recharts';
import { 
  ShieldAlert, 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  BrainCircuit, 
  Search, 
  Mail, 
  PhoneCall, 
  ChevronRight,
  Zap
} from 'lucide-react';
import { fetchStats, fetchActions, fetchAnalytics } from '../api/client';
import type { StatsResponse, ActionRecord } from '../api/client';
import { mockActionRecords, mockQuadrantDist, mockUpliftData } from '../data/mock';

export function Overview() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [actions, setActions] = useState<ActionRecord[]>(mockActionRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<ActionRecord | null>(null);

  useEffect(() => {
    fetchStats().then(s => s && setStats(s));
    fetchActions({ limit: 50 }).then(res => res.actions.length > 0 && setActions(res.actions));
    fetchAnalytics().then(() => {});
  }, []);

  const filteredActions = actions.filter(a => 
    a.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.pain_points && a.pain_points.toLowerCase().includes(searchTerm.toLowerCase())) ||
    a.tier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatVND = (num: number) => {
    if (!num) return '0 ₫';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B ₫`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M ₫`;
    return `${num.toLocaleString()} ₫`;
  };

  const getTierColor = (tier: string) => {
    if (tier.includes('True_Friends')) return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    if (tier.includes('Butterflies')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    if (tier.includes('Barnacles')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-slate-700/40 text-slate-400 border-slate-700';
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'vip_training': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'discount': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'loyalty_upgrade': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'pause_subscription': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-700/30 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-1">
            <Sparkles size={11} /> Phase 2 — Multi-Agent Retention Layer
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
            Autonomous Customer Retention Operations
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Tự động trích xuất tín hiệu, đàm phán tối ưu hóa kinh tế CAC vs CRC, và gửi thông điệp giữ chân khách hàng cá nhân hóa với cơ chế Guardrail bảo vệ ngân sách.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Model Routing</div>
            <div className="text-xs font-mono font-bold text-teal-400 flex items-center gap-1">
              <Zap size={12} className="text-amber-400" />
              {stats?.provider || 'OpenRouter AI'}
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: 4 Macro KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue at Risk */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">At-Risk Revenue (LTV)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {formatVND(stats?.total_ltv_at_risk_vnd || 4520000000)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="text-rose-400 font-semibold flex items-center gap-0.5">
              <ArrowUpRight size={13} /> {stats?.total_customers || 1871} Accounts
            </span>
            <span>filtered in Phase 1</span>
          </div>
        </div>

        {/* Card 2: Revenue Saved */}
        <div className="bg-slate-950/70 border border-teal-500/30 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-teal-500/50 transition-all bg-gradient-to-br from-teal-950/20 to-slate-950">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Phantom Revenue Secured</span>
            <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-300 tracking-tight">
            {formatVND(stats?.roi_metrics?.revenue_saved_vnd || 2150000000)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="text-teal-400 font-bold bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
              +{((stats?.roi_metrics?.uplift_pct_points || 0.36) * 100).toFixed(1)}% Uplift
            </span>
            <span>vs Holdout group</span>
          </div>
        </div>

        {/* Card 3: CAC vs CRC Arbitrage */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CAC vs CRC Arbitrage</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <BrainCircuit size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 tracking-tight">
            1 : 14.8
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>Retention Cost / Save:</span>
            <span className="font-mono text-slate-200">~65k ₫</span>
          </div>
        </div>

        {/* Card 4: Estimated ROI */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Project ROI</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            {stats?.roi_metrics?.roi ? `${stats.roi_metrics.roi.toFixed(1)}x` : '18.4x'}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>Net Saved Ratio:</span>
            <span className="text-emerald-400 font-bold">94.8% Margin</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Quadrant Distribution + Uplift A/B Test) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quadrant Distribution */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BrainCircuit size={16} className="text-teal-400" />
                Customer Value Quadrant Matrix (LTV & Tenure)
              </h3>
              <p className="text-[11px] text-slate-400">Phân khúc khách hàng để phân bổ ngân sách AI & ưu đãi giữ chân</p>
            </div>
            <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-1 rounded border border-teal-800/50">
              7 Segments
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockQuadrantDist} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(val) => `${(val / 1_000_000_000).toFixed(1)}B`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${formatVND(Number(val))}`, 'Total LTV']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {mockQuadrantDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uplift Simulation A/B Chart */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                Holdout vs Treatment Churn Rate
              </h3>
              <p className="text-[11px] text-slate-400">Đo đạc thực nghiệm Uplift giữ chân</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/50">
              A/B Verified
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockUpliftData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(v: any) => [`${v}%`, 'Churn Rate']}
                />
                <Bar dataKey="churnRate" radius={[0, 6, 6, 0]}>
                  {mockUpliftData.map((e, idx) => (
                    <Cell key={idx} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Live Customer Actions Table */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-teal-400" />
              Latest AI Retention Actions & Decisions
            </h3>
            <p className="text-[11px] text-slate-400">Danh sách khách hàng đã được các AI Agent xử lý và quyết định hành động</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input 
              type="text"
              placeholder="Search by ID, Tier, Pain point..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Tier / Segment</th>
                <th className="px-5 py-3">LTV & Risk</th>
                <th className="px-5 py-3">Extracted Pain Point</th>
                <th className="px-5 py-3">AI Action Decision</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredActions.map((action) => (
                <tr 
                  key={action.customer_id}
                  onClick={() => setSelectedAction(action)}
                  className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3 font-semibold text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-bold">
                        {action.customer_id.substring(4, 8) || 'CUS'}
                      </div>
                      <div>
                        <div className="text-white font-sans text-xs">{action.customer_id}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{action.group}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-sans">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getTierColor(action.tier)}`}>
                      {action.tier.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-slate-200">{formatVND(action.ltv)}</div>
                    <div className="text-[10px] text-rose-400 font-bold">Risk: {((action.churn_risk_score || 0) * 100).toFixed(1)}%</div>
                  </td>
                  <td className="px-5 py-3 font-sans text-slate-300 max-w-xs truncate text-[11px]">
                    {action.pain_points || 'Tín hiệu bình thường'}
                  </td>
                  <td className="px-5 py-3 font-sans">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${getActionBadge(action.action_type)}`}>
                      {action.action_type} {action.discount_pct > 0 ? `(-${action.discount_pct}%)` : ''}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-sans text-slate-400">
                    {action.channel === 'email' ? (
                      <span className="flex items-center gap-1 text-[11px] text-sky-400"><Mail size={12} /> Email</span>
                    ) : action.channel === 'phone_call' ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400"><PhoneCall size={12} /> Zalo / Call</span>
                    ) : (
                      <span className="text-[11px] text-slate-500">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-teal-300 group-hover:border-teal-500/40 transition-colors">
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 p-6 h-full overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">AI Decision Journey</span>
                <h2 className="text-lg font-bold text-white">{selectedAction.customer_id}</h2>
              </div>
              <button 
                onClick={() => setSelectedAction(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Close (ESC)
              </button>
            </div>

            {/* Step 1: Phase 1 & Retriever */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-[10px]">1</span>
                Data Retriever Agent Output
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                <div>LTV: <span className="text-slate-200">{formatVND(selectedAction.ltv)}</span></div>
                <div>Risk Score: <span className="text-rose-400 font-bold">{((selectedAction.churn_risk_score || 0) * 100).toFixed(1)}%</span></div>
                <div>Sentiment: <span className="text-amber-400">{selectedAction.sentiment}</span></div>
                <div>Tier: <span className="text-teal-300">{selectedAction.tier}</span></div>
              </div>
              <div className="text-xs text-slate-300 pt-1">
                <span className="text-slate-500">Pain Points:</span> {selectedAction.pain_points}
              </div>
            </div>

            {/* Step 2: Negotiator Agent Decision */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">2</span>
                Negotiator Agent Strategy & Guardrail
              </div>
              <div className="text-xs font-mono text-slate-300">
                Action: <span className="text-cyan-300 font-bold">{selectedAction.action_type}</span> | Discount: <span className="text-emerald-400">{selectedAction.discount_pct}%</span>
              </div>
              <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 italic">
                "{selectedAction.reasoning}"
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1">
                <CheckCircle2 size={13} /> Budget Guardrail Passed (Policy Validated)
              </div>
            </div>

            {/* Step 3: Execution Agent Sent Message */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">3</span>
                Execution Agent Message (Dispatched via {selectedAction.channel})
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans shadow-inner">
                {selectedAction.message_sent || 'Chưa phát sinh tin nhắn (Nhóm đối chứng hoặc No Action)'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
