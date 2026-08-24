import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Sparkles,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { fetchActions } from '../api/client';
import type { ActionRecord } from '../api/client';
import { mockActionRecords } from '../data/mock';

export function Customers() {
  const [actions, setActions] = useState<ActionRecord[]>(mockActionRecords);
  const [filteredActions, setFilteredActions] = useState<ActionRecord[]>(mockActionRecords);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<ActionRecord | null>(mockActionRecords[0]);

  useEffect(() => {
    fetchActions({ limit: 200 }).then(res => {
      if (res.actions.length > 0) {
        setActions(res.actions);
        setFilteredActions(res.actions);
        setSelectedCustomer(res.actions[0]);
      }
    });
  }, []);

  useEffect(() => {
    let result = [...actions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => 
        a.customer_id.toLowerCase().includes(q) ||
        (a.pain_points && a.pain_points.toLowerCase().includes(q)) ||
        a.tier.toLowerCase().includes(q)
      );
    }
    if (tierFilter !== 'all') {
      result = result.filter(a => a.tier.toLowerCase() === tierFilter.toLowerCase());
    }
    if (actionFilter !== 'all') {
      result = result.filter(a => a.action_type.toLowerCase() === actionFilter.toLowerCase());
    }
    setFilteredActions(result);
  }, [search, tierFilter, actionFilter, actions]);

  const formatVND = (num: number) => {
    if (!num) return '0 ₫';
    return `${num.toLocaleString()} ₫`;
  };

  const getTierBadge = (tier: string) => {
    if (tier.includes('True_Friends')) return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    if (tier.includes('Butterflies')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    if (tier.includes('Barnacles')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-slate-700/40 text-slate-400 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-teal-400" />
            Customer Retention Directory & AI Decisions
          </h1>
          <p className="text-xs text-slate-400">
            Tra cứu hồ sơ khách hàng, xem phân tích rủi ro, chiến lược đàm phán và bản tin nhắn cá nhân hóa đã gửi.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            Total Accounts: <strong className="text-white">{filteredActions.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
        <div className="md:col-span-6 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
          <input 
            type="text"
            placeholder="Search customer ID, pain points, tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="md:col-span-3">
          <select 
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Tiers / Segments</option>
            <option value="True_Friends_Elite">True Friends Elite</option>
            <option value="True_Friends_Standard">True Friends Standard</option>
            <option value="Butterflies_Whales">Butterflies Whales</option>
            <option value="Butterflies_Standard">Butterflies Standard</option>
            <option value="Barnacles_Heavy">Barnacles Heavy</option>
            <option value="Barnacles_Standard">Barnacles Standard</option>
            <option value="Strangers">Strangers</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Action Types</option>
            <option value="vip_training">VIP Training</option>
            <option value="discount">Discount Offer</option>
            <option value="loyalty_upgrade">Loyalty Upgrade</option>
            <option value="pause_subscription">Pause Subscription</option>
            <option value="feature_newsletter">Feature Newsletter</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left List (Col 7) + Right Inspector (Col 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Column: Customer Table */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 max-h-[620px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 sticky top-0 uppercase tracking-wider text-[10px] border-b border-slate-800 z-10">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">LTV</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredActions.map((c) => {
                  const isSelected = selectedCustomer?.customer_id === c.customer_id;
                  return (
                    <tr 
                      key={c.customer_id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-500/10 border-l-2 border-l-teal-400' : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-white font-sans">
                        {c.customer_id}
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getTierBadge(c.tier)}`}>
                          {c.tier.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {formatVND(c.ltv)}
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <span className="text-[11px] font-semibold text-cyan-300">
                          {c.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-rose-400 font-bold">
                        {((c.churn_risk_score || 0) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI Customer Journey & Message Preview */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">Account Dossier</div>
                  <h3 className="text-base font-bold text-white">{selectedCustomer.customer_id}</h3>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${getTierBadge(selectedCustomer.tier)}`}>
                  {selectedCustomer.tier.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Financial Profile */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">LTV Value</div>
                  <div className="text-slate-100 font-bold">{formatVND(selectedCustomer.ltv)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Churn Risk</div>
                  <div className="text-rose-400 font-bold">{((selectedCustomer.churn_risk_score || 0) * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Monthly Fee</div>
                  <div className="text-slate-100">{formatVND(selectedCustomer.monthly_fee)}</div>
                </div>
              </div>

              {/* Agent 1 Analysis */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px] uppercase tracking-wider">
                  <Sparkles size={12} /> Data Retriever Findings
                </div>
                <div className="text-slate-300 font-sans">
                  <strong className="text-slate-400">Pain Points:</strong> {selectedCustomer.pain_points || 'Không có tín hiệu bất thường'}
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  <strong className="text-slate-400">Sentiment:</strong> <span className="text-amber-400">{selectedCustomer.sentiment}</span>
                </div>
              </div>

              {/* Agent 2 Decision */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                    <ShieldCheck size={12} /> Negotiator Strategy
                  </div>
                  <span className="text-[10px] text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60 font-mono">
                    Guardrail Verified
                  </span>
                </div>
                <div className="text-slate-300 font-mono">
                  Action: <strong className="text-cyan-300">{selectedCustomer.action_type}</strong> | Discount: <strong className="text-emerald-400">{selectedCustomer.discount_pct}%</strong>
                </div>
                <p className="text-slate-300 italic text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800 font-sans">
                  "{selectedCustomer.reasoning}"
                </p>
              </div>

              {/* Agent 3 Message Sent Bubble */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-purple-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><MessageSquare size={12} /> Dispatched Message</span>
                  <span className="text-[10px] text-slate-400 font-mono">Channel: {selectedCustomer.channel}</span>
                </div>
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 p-4 rounded-xl border border-purple-900/40 text-xs text-slate-200 leading-relaxed font-sans shadow-inner">
                  {selectedCustomer.message_sent || 'Nhóm đối chứng (Holdout) hoặc không thực thi tin nhắn.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Chọn một khách hàng để xem chi tiết AI Decision Journey
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
