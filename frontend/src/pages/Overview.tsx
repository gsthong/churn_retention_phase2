import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowUpRight, 
  Search,
  Check
} from 'lucide-react';
import { fetchActions, fetchStats } from '../api/client';
import type { StatsResponse } from '../api/client';
import { mockHighRiskCustomers, mockPortfolioGrowth } from '../data/mock';

export function Overview() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(mockHighRiskCustomers[0]);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    fetchStats().then(s => s && setStats(s));
    fetchActions({ limit: 20 }).then(() => {});
  }, []);

  const handleExecuteAction = () => {
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 font-sans">
      {/* Top Greeting Bar */}
      <div className="flex items-center justify-between pb-0.5">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Account Portfolio Overview
          </h1>
          <div className="text-xs text-slate-400">High-risk customer tracking and planned interventions</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="text-slate-400 absolute left-2.5 top-2.5" />
            <input 
              type="text" 
              placeholder="Search account..." 
              className="pl-7 pr-3 py-1.5 border border-slate-200 rounded text-xs w-56 focus:outline-none focus:border-slate-400 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Row 1: 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Saved Revenue */}
        <div className="bg-white p-3.5 rounded border border-slate-200">
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            SECURED REVENUE (SAVED ARR)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              {stats?.roi_metrics?.revenue_saved_vnd 
                ? `$${(stats.roi_metrics.revenue_saved_vnd / 24000 / 1000).toFixed(1)}k`
                : '$153.1k'}
            </span>
            <span className="flex items-center text-emerald-600 text-[10px] font-mono font-semibold">
              <ArrowUpRight size={10} className="mr-0.5" /> 
              +{((stats?.roi_metrics?.uplift_pct_points || 0.339) * 100).toFixed(1)}% Uplift
            </span>
          </div>
        </div>

        {/* Card 2: Cost Per Save (CPS) */}
        <div className="bg-white p-3.5 rounded border border-slate-200">
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            COST PER SAVE (CPS)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              {stats?.roi_metrics?.cost_per_save_vnd 
                ? `$${Math.round(stats.roi_metrics.cost_per_save_vnd / 24000)}` 
                : '$33.5'}
            </span>
            <span className="flex items-center text-indigo-600 text-[10px] font-mono">
              ~{stats?.roi_metrics?.cost_per_save_vnd ? `${Math.round(stats.roi_metrics.cost_per_save_vnd / 1000)}k VND` : '806k VND'}
            </span>
          </div>
        </div>

        {/* Card 3: Active Retention Plans */}
        <div className="bg-white p-3.5 rounded border border-slate-200">
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            ACTIVE RETENTION QUEUE
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              {stats?.total_customers ? `${stats.treatment_count} Accounts` : '180 Accounts'}
            </span>
            <span className="text-slate-400 text-[10px] font-mono">
              10% Holdout
            </span>
          </div>
        </div>

        {/* Card 4: Net Revenue Retention (NRR) */}
        <div className="bg-white p-3.5 rounded border border-slate-200">
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            NET REVENUE RETENTION (NRR)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-indigo-900 tracking-tight font-mono">
              {stats?.roi_metrics?.nrr_pct || 118.5}%
            </span>
            <span className="text-emerald-600 text-[10px] font-mono font-semibold">
              GRR {stats?.roi_metrics?.grr_pct || 53.9}%
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Left Column (35%) & Right Detail (65%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-1">
        {/* Left Column (Col 5) */}
        <div className="lg:col-span-5 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">Priority Accounts</h2>
              <span className="text-rose-600 bg-rose-50 border border-rose-200 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded">
                3 Flags
              </span>
            </div>
            
            <div className="space-y-1.5">
              {mockHighRiskCustomers.map((cus: any) => {
                const isSelected = selectedCustomer.id === cus.id;
                return (
                  <div 
                    key={cus.id} 
                    onClick={() => setSelectedCustomer(cus)}
                    className={`p-2.5 rounded border transition-colors cursor-pointer flex items-start justify-between ${
                      isSelected 
                        ? 'border-slate-800 bg-slate-50' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900 text-xs">{cus.name}</h3>
                      <div className="text-[10px] text-slate-400 font-mono">{cus.fee} • Health: {cus.health}/100</div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        cus.risk === 'High Risk' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {cus.risk}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">Last active: {cus.lastSeen}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Portfolio Growth Chart */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">MRR Trajectory (6M)</h2>
              <span className="text-[9px] font-mono text-emerald-600 font-semibold">+18.5%</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPortfolioGrowth}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#334155" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#334155" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8.5, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '2px', border: '1px solid #e2e8f0', fontSize: '9px' }} />
                  <Area type="monotone" dataKey="value" stroke="#334155" strokeWidth={1.5} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Detail */}
        <div className="lg:col-span-7 bg-white rounded border border-slate-200 p-4 space-y-3.5 flex flex-col justify-between">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{selectedCustomer.name}</h2>
                <span className="text-[9px] font-mono font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                  Score: {selectedCustomer.health}/100
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Account ID: {selectedCustomer.id} • Tenure: 14M</div>
            </div>

            <button className="px-2.5 py-1 rounded border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Direct Contact
            </button>
          </div>

          {/* Diagnostic Box */}
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-0.5">
            <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Diagnostic Summary
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {selectedCustomer.name} has shown a 40% reduction in weekly usage and recently submitted ticket regarding network stability and tier pricing.
            </p>
          </div>

          {/* 4 Metrics Strip */}
          <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
            <div className="bg-slate-50 border border-slate-200 rounded p-2">
              <div className="text-[8.5px] text-slate-400 uppercase">Usage Drop</div>
              <div className="text-xs font-bold text-rose-600 mt-0.5">-40%</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2">
              <div className="text-[8.5px] text-slate-400 uppercase">Tickets (30D)</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">2</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2">
              <div className="text-[8.5px] text-slate-400 uppercase">LTV</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">${selectedCustomer.ltv.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2">
              <div className="text-[8.5px] text-slate-400 uppercase">Last Login</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">14d ago</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="border border-slate-200 rounded p-2.5 space-y-1.5">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Activity History</span>
            <div className="space-y-1 text-xs">
              <div className="flex items-start gap-1.5 text-slate-700">
                <span className="text-slate-400">•</span>
                <div>
                  <span className="font-medium text-slate-800">Support Ticket #4492 submitted</span>
                  <span className="text-[10px] text-slate-400 font-mono ml-1.5">(3 days ago)</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 text-slate-700">
                <span className="text-slate-400">•</span>
                <div>
                  <span className="font-medium text-slate-800">Billing inquiry logged</span>
                  <span className="text-[10px] text-slate-400 font-mono ml-1.5">(7 days ago)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Proposition */}
          <div className="border border-slate-200 bg-slate-50/60 rounded p-3 space-y-2">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-700 uppercase">
              <span>Proposed Action: Annual Plan Optimization (-15%)</span>
              <span className="text-slate-400">Budget Enforced</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
              "Chào {selectedCustomer.name}, chúng tôi đã hoàn tất rà soát đường truyền kỹ thuật và xin gửi gói ưu đãi gia hạn năm giảm 15% kèm quyền ưu tiên phản hồi kỹ thuật trong 15 phút."
            </p>

            <div className="flex items-center justify-between pt-0.5">
              <div className="text-[9px] text-slate-400 font-mono">
                Guardrail: Verified ✓
              </div>
              <div className="flex items-center gap-1.5">
                <button className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
                  Edit
                </button>
                <button 
                  onClick={handleExecuteAction}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                    sentSuccess 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {sentSuccess ? <Check size={12} /> : null}
                  {sentSuccess ? 'Executed' : 'Execute Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
