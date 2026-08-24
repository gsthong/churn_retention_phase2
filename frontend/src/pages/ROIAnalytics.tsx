import { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  Download, 
  Search, 
  RefreshCw, 
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import { fetchAnalytics, fetchStats, fetchActions } from '../api/client';
import type { StatsResponse, ActionRecord } from '../api/client';
import { mockQuadrantDist, mockFunnel, mockInFlightOps, mockROI } from '../data/mock';

export function ROIAnalytics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedOp, setSelectedOp] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics().then(() => {});
    fetchStats().then(s => s && setStats(s));
    fetchActions({ limit: 50 }).then(res => {
      if (res.actions.length > 0) setActions(res.actions);
    });
  }, []);

  const tableData = actions.length > 0 ? actions.slice(0, 15).map((a, idx) => {
    const riskPct = Math.round((a.churn_risk_score || 0.8) * 100);
    return {
      id: `OP-${9012 - idx}`,
      agentId: a.agent_source === 'llm' ? 'Node-LLM' : 'Node-Rule',
      client: a.customer_id,
      segment: a.tier.replace(/_/g, ' '),
      risk: riskPct,
      ltv: a.ltv,
      predSave: Math.round(100 - riskPct * 0.4),
      action: `${a.action_type.toUpperCase()} ${a.discount_pct > 0 ? `-${a.discount_pct}%` : ''}`,
      cost: a.monthly_fee ? (a.monthly_fee * (a.discount_pct / 100)) : 50,
      status: a.group === 'holdout' ? 'Holdout' : (riskPct > 80 ? 'In-Flight' : 'Executed'),
      raw: a
    };
  }) : mockInFlightOps;

  const filteredOps = tableData.filter((op: any) => 
    op.client.toLowerCase().includes(filterQuery.toLowerCase()) ||
    op.segment.toLowerCase().includes(filterQuery.toLowerCase()) ||
    op.action.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In-Flight':
      case 'Running':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Running
          </span>
        );
      case 'Executed':
      case 'Success':
      case 'Saved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-slate-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Saved
          </span>
        );
      case 'Holdout':
      case 'Queued':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Holdout
          </span>
        );
      case 'Churned':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Lost
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-500 font-mono">{status}</span>;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 75) return 'bg-rose-500';
    if (risk >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="flex flex-col space-y-2.5 font-sans">
      {/* Row 1: 6 Macro KPI Tickers */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
        {/* Metric 1 */}
        <div className="bg-white p-2.5 border border-slate-200 rounded flex flex-col justify-between h-18">
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            <span>AT-RISK ACCOUNTS</span>
            <span className="text-rose-500 font-bold">●</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-slate-900">
              {stats?.total_customers ? stats.total_customers.toLocaleString() : '4,291'}
            </span>
            <span className="text-[10px] font-mono text-rose-600 flex items-center">
              <ArrowUpRight size={10} /> 12%
            </span>
          </div>
          <div className="text-[8.5px] font-mono text-slate-400">P1 Classification</div>
        </div>
        
        {/* Metric 2 */}
        <div className="bg-white p-2.5 border border-slate-200 rounded flex flex-col justify-between h-18">
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            <span>SECURED REVENUE</span>
            <span className="text-emerald-500 font-bold">●</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono text-slate-900">
                {stats?.roi_metrics?.revenue_saved_vnd 
                  ? `$${(stats.roi_metrics.revenue_saved_vnd / 24000 / 1000).toFixed(1)}k`
                  : '$1.24M'}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 flex items-center">
                <ArrowUpRight size={10} /> $42k
              </span>
            </div>
            {/* Sparkline Visualizer */}
            <div className="flex items-end gap-0.5 h-3.5">
              <div className="w-1 h-1.5 bg-slate-200 rounded-xs"></div>
              <div className="w-1 h-2 bg-slate-300 rounded-xs"></div>
              <div className="w-1 h-2 bg-slate-400 rounded-xs"></div>
              <div className="w-1 h-3 bg-slate-600 rounded-xs"></div>
              <div className="w-1 h-2.5 bg-slate-700 rounded-xs"></div>
              <div className="w-1 h-3.5 bg-slate-900 rounded-xs"></div>
            </div>
          </div>
          <div className="text-[8.5px] font-mono text-slate-400">Net Preserved LTV</div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-2.5 border border-slate-200 rounded flex flex-col justify-between h-18">
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            <span>CAC / CRC RATIO</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-slate-900">1 : 12.4</span>
          </div>
          <div className="text-[8.5px] font-mono text-slate-400">Industry avg: 1:3.0</div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-2.5 border border-slate-200 rounded flex flex-col justify-between h-18">
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            <span>NET CHURN RATE</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-slate-900">-1.2%</span>
            <span className="text-[9px] font-mono text-slate-400">Tgt -0.5%</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
             <div className="bg-slate-800 h-full w-[85%]"></div>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-2.5 border border-slate-200 rounded flex flex-col justify-between h-18">
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            <span>AVG SAVE TIME</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-slate-900">4.2h</span>
            <span className="text-[9px] font-mono text-emerald-600 flex items-center">
              <ArrowDownRight size={10} /> 0.8h
            </span>
          </div>
          <div className="text-[8.5px] font-mono text-slate-400">Alert to settlement</div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-2.5 border border-slate-200 rounded flex flex-col justify-between h-18">
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            <span>PREVENTION RATE</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-slate-900">68.4%</span>
            <span className="text-[9px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">High</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
             <div className="bg-emerald-600 h-full w-[68%]"></div>
          </div>
        </div>
      </div>

      {/* Row 2: 4 Grid Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Widget 1: Quadrant Dist */}
        <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between">
          <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between">
            <span>QUADRANT DISTRIBUTION</span>
            <span className="text-[8.5px] text-slate-400">7 Tiers</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={mockQuadrantDist} 
                  innerRadius="50%" 
                  outerRadius="75%" 
                  paddingAngle={1} 
                  dataKey="value"
                >
                  {mockQuadrantDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '2px', fontSize: '9px' }}
                  formatter={(val: any) => [`$${(Number(val) / 24000000).toFixed(1)}k`, 'LTV']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-0.5 text-[8.5px] font-mono border-t border-slate-50 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">True Friends</span>
              <span className="text-slate-800 font-semibold">$450k</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Butterflies</span>
              <span className="text-slate-800 font-semibold">$210k</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Barnacles</span>
              <span className="text-slate-800 font-semibold">$180k</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Strangers</span>
              <span className="text-slate-800 font-semibold">$80k</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Multi-Agent Funnel */}
        <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between">
          <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between">
            <span>PIPELINE FUNNEL</span>
            <span className="text-[8.5px] text-slate-400">Step 1-5</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockFunnel} layout="vertical" margin={{ top: 0, right: 10, left: 5, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 8.5, fill: '#64748b' }} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '2px', fontSize: '9px' }}
                />
                <Bar dataKey="value" fill="#334155" radius={[0, 1, 1, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[8.5px] font-mono text-slate-400 border-t border-slate-50 pt-1">
            <span>Input: 5,000</span>
            <span className="text-slate-700 font-semibold">Yield: 40.5%</span>
          </div>
        </div>

        {/* Widget 3: Intervention ROI Curve */}
        <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between">
          <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between">
            <span>COST VS PRESERVED LTV</span>
            <span className="text-[8.5px] text-emerald-600">18.4x</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                <XAxis type="number" dataKey="cost" name="Cost" unit="$" tick={{ fontSize: 8, fill: '#64748b' }} />
                <YAxis type="number" dataKey="ltv" name="LTV" unit="$" tick={{ fontSize: 8, fill: '#64748b' }} tickFormatter={(v) => `$${v/1000}k`} />
                <ZAxis range={[20, 50]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '9px' }} />
                <Scatter name="Ops" data={mockROI} fill="#475569" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[8.5px] font-mono text-slate-400 border-t border-slate-50 pt-1">
            <span>Avg Cost: $52</span>
            <span className="text-slate-700 font-semibold">Max ROI: 240x</span>
          </div>
        </div>

        {/* Widget 4: Retention Rules & Policies */}
        <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between">
          <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between">
            <span>GUARDRAIL RULES</span>
            <span className="text-[8.5px] font-mono text-slate-400">Spec</span>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-32 pr-0.5 text-[8.5px] font-mono">
            {/* Rule 1 */}
            <div className="p-1 rounded bg-slate-50 border border-slate-200 flex flex-col">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>True Friends</span>
                <span className="text-slate-500">&lt; 15% Risk</span>
              </div>
              <div className="text-slate-600">Max 30% discount + Priority Support</div>
            </div>

            {/* Rule 2 */}
            <div className="p-1 rounded bg-slate-50 border border-slate-200 flex flex-col">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Butterflies</span>
                <span className="text-slate-500">15-40% Risk</span>
              </div>
              <div className="text-slate-600">Max 15% discount + Annual Extension</div>
            </div>

            {/* Rule 3 */}
            <div className="p-1 rounded bg-slate-50 border border-slate-200 flex flex-col">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Barnacles</span>
                <span className="text-slate-500">&gt; 40% Risk</span>
              </div>
              <div className="text-slate-600">0% discount + Pause Subscription</div>
            </div>

            {/* Rule 4 */}
            <div className="p-1 rounded bg-slate-50 border border-slate-200 flex flex-col">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Strangers</span>
                <span className="text-slate-500">&gt; 60% Risk</span>
              </div>
              <div className="text-slate-600">Let Churn + Automated Survey</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: IN-FLIGHT OPERATIONS Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden flex flex-col">
        {/* Table Header Bar */}
        <div className="p-2.5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider">
              OPERATIONS STREAM
            </span>
            <span className="text-[9px] font-mono bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded">
              {filteredOps.length} Active
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-6 pr-2 py-0.5 text-[11px] font-mono border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400 w-40"
              />
            </div>
            <button className="p-1 text-slate-500 border border-slate-200 rounded hover:bg-slate-50">
              <Download size={12} />
            </button>
            <button className="p-1 text-slate-500 border border-slate-200 rounded hover:bg-slate-50">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto max-h-72 overflow-y-auto font-mono">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[8.5px] font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-2.5 py-1.5">OP ID</th>
                <th className="px-2.5 py-1.5">Node</th>
                <th className="px-2.5 py-1.5">Account</th>
                <th className="px-2.5 py-1.5">Segment</th>
                <th className="px-2.5 py-1.5 w-24">Risk</th>
                <th className="px-2.5 py-1.5">LTV</th>
                <th className="px-2.5 py-1.5">Save %</th>
                <th className="px-2.5 py-1.5">Action</th>
                <th className="px-2.5 py-1.5">Cost</th>
                <th className="px-2.5 py-1.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10.5px]">
              {filteredOps.map((op: any) => (
                <tr 
                  key={op.id}
                  onClick={() => setSelectedOp(op)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-2.5 py-1.5 font-bold text-slate-700">{op.id}</td>
                  <td className="px-2.5 py-1.5 text-slate-400">{op.agentId}</td>
                  <td className="px-2.5 py-1.5 font-sans font-medium text-slate-800">
                    {op.client}
                  </td>
                  <td className="px-2.5 py-1.5 font-sans text-slate-600">
                    <span className="text-[10px]">
                      {op.segment}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getRiskColor(op.risk)}`} 
                          style={{ width: `${op.risk}%` }}
                        ></div>
                      </div>
                      <span className="text-[9.5px] text-slate-500">{op.risk}%</span>
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-800">
                    ${typeof op.ltv === 'number' ? Math.round(op.ltv / 24000).toLocaleString() : op.ltv}
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-700">{op.predSave}%</td>
                  <td className="px-2.5 py-1.5">
                    <span className="text-[9.5px] font-mono bg-slate-50 text-slate-700 border border-slate-200 px-1 py-0.2 rounded">
                      {op.action}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-500">
                    ${typeof op.cost === 'number' ? (op.cost > 100 ? (op.cost/24000).toFixed(2) : op.cost.toFixed(2)) : op.cost}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    {getStatusBadge(op.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Dossier Drawer */}
      {selectedOp && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 flex justify-end font-sans">
          <div className="w-full max-w-md bg-white border-l border-slate-200 p-5 h-full overflow-y-auto space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Account Inspection</span>
                <h2 className="text-sm font-bold text-slate-900">{selectedOp.client}</h2>
              </div>
              <button 
                onClick={() => setSelectedOp(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X size={14} />
              </button>
            </div>

            {/* Findings Box */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
              <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Retrieval Findings
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedOp.raw?.pain_points 
                  ? `Recorded issues: ${selectedOp.raw.pain_points}. Sentiment: ${selectedOp.raw.sentiment}.`
                  : `${selectedOp.client} flagged for technical latency and pricing evaluation.`}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
              <div className="bg-slate-50 border border-slate-200 rounded p-2">
                <div className="text-[8.5px] text-slate-400 uppercase">Usage</div>
                <div className="text-xs font-bold text-rose-600">-40%</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-2">
                <div className="text-[8.5px] text-slate-400 uppercase">Tickets</div>
                <div className="text-xs font-bold text-slate-800">2</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-2">
                <div className="text-[8.5px] text-slate-400 uppercase">LTV</div>
                <div className="text-xs font-bold text-slate-800">
                  ${typeof selectedOp.ltv === 'number' ? Math.round(selectedOp.ltv / 24000).toLocaleString() : selectedOp.ltv}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-2">
                <div className="text-[8.5px] text-slate-400 uppercase">Login</div>
                <div className="text-xs font-bold text-slate-800">14d</div>
              </div>
            </div>

            {/* Suggested Action Preview */}
            <div className="border border-slate-200 bg-slate-50/50 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-600 font-bold uppercase">
                <span>Action: {selectedOp.action}</span>
                <span className="text-slate-400">Approved</span>
              </div>
              
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                {selectedOp.raw?.message_sent 
                  ? selectedOp.raw.message_sent 
                  : `"Chào quý khách, chúng tôi đã cập nhật giải pháp tối ưu đường truyền và gửi tặng gói hỗ trợ nâng cao để phục vụ tốt nhất."`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
