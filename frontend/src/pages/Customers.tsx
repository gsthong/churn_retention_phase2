import { useEffect, useState } from 'react';
import { 
  Search,
  Sparkles,
  AlertTriangle,
  HelpCircle
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<ActionRecord | null>(mockActionRecords[0]);

  useEffect(() => {
    fetchActions({ limit: 300 }).then(res => {
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
        (a.churn_reason && a.churn_reason.toLowerCase().includes(q)) ||
        a.tier.toLowerCase().includes(q)
      );
    }
    if (tierFilter !== 'all') {
      result = result.filter(a => a.tier.toLowerCase() === tierFilter.toLowerCase());
    }
    if (actionFilter !== 'all') {
      result = result.filter(a => a.action_type.toLowerCase() === actionFilter.toLowerCase());
    }
    if (categoryFilter !== 'all') {
      result = result.filter(a => (a.churn_category || 'voluntary').toLowerCase() === categoryFilter.toLowerCase());
    }
    setFilteredActions(result);
  }, [search, tierFilter, actionFilter, categoryFilter, actions]);

  const formatVND = (num: number) => {
    if (!num) return '$0';
    return `$${Math.round(num / 24000).toLocaleString()}`;
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.75) return 'bg-rose-500';
    if (risk >= 0.4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const renderCategoryBadge = (cat?: string) => {
    const c = (cat || 'voluntary').toLowerCase();
    if (c === 'involuntary') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
          <AlertTriangle size={10} /> Involuntary
        </span>
      );
    }
    if (c === 'vague') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
          <HelpCircle size={10} /> Vague
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
        <Sparkles size={10} /> Voluntary
      </span>
    );
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Customer Directory & Operations
          </h1>
          <div className="text-xs text-slate-400">Account profiles, extracted signals, Phase 1 Churn reasons, and dispatched interventions</div>
        </div>

        <div className="text-xs font-mono text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
          Total Accounts: <strong className="text-slate-900">{filteredActions.length}</strong>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-white p-2.5 rounded border border-slate-200">
        <div className="md:col-span-5 relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Filter by account ID, pain point, churn reason, segment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded pl-7 pr-3 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="md:col-span-3">
          <select 
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Segments</option>
            <option value="True_Friends_Elite">True Friends Elite</option>
            <option value="True_Friends_Standard">True Friends Standard</option>
            <option value="Butterflies_Whales">Butterflies Whales</option>
            <option value="Butterflies_Standard">Butterflies Standard</option>
            <option value="Barnacles_Whale">Barnacles Whale</option>
            <option value="Barnacles_Heavy">Barnacles Heavy</option>
            <option value="Barnacles_Standard">Barnacles Standard</option>
            <option value="Strangers">Strangers</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Churn Types</option>
            <option value="voluntary">Voluntary (Retainable)</option>
            <option value="involuntary">Involuntary (Safeguarded)</option>
            <option value="vague">Vague</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Actions</option>
            <option value="vip_training">VIP Training</option>
            <option value="dedicated_csm_audit">Dedicated CSM Audit</option>
            <option value="discount">Discount Offer</option>
            <option value="loyalty_upgrade">Loyalty Upgrade</option>
            <option value="pause_subscription">Pause Subscription</option>
            <option value="feature_newsletter">Feature Newsletter</option>
            <option value="no_action">No Action</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left List (Col 7) + Right Inspector (Col 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[480px]">
        {/* Left Column: Customer Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 max-h-[580px] overflow-y-auto font-mono">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 sticky top-0 uppercase tracking-wider text-[8.5px] font-semibold border-b border-slate-200 z-10">
                <tr>
                  <th className="px-3 py-2">Account ID</th>
                  <th className="px-3 py-2">Segment</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">LTV</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2 w-20">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[10.5px]">
                {filteredActions.map((c) => {
                  const isSelected = selectedCustomer?.customer_id === c.customer_id;
                  const riskScore = c.churn_risk_score || 0;
                  return (
                    <tr 
                      key={c.customer_id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-3 py-2 text-slate-900 font-medium">
                        {c.customer_id}
                      </td>
                      <td className="px-3 py-2 font-sans text-slate-600">
                        {c.tier.replace(/_/g, ' ')}
                      </td>
                      <td className="px-3 py-2">
                        {renderCategoryBadge(c.churn_category)}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {formatVND(c.ltv)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[9.5px] font-mono bg-slate-50 text-slate-700 border border-slate-200 px-1 py-0.2 rounded">
                          {c.action_type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getRiskColor(riskScore)}`} 
                              style={{ width: `${Math.round(riskScore * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[9.5px] text-slate-500">{(riskScore * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI Customer Journey & Message Preview */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-4 flex flex-col justify-between space-y-3">
          {selectedCustomer ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Account Profile</span>
                  <h3 className="text-sm font-bold text-slate-900">{selectedCustomer.customer_id}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {renderCategoryBadge(selectedCustomer.churn_category)}
                  <span className="text-[9px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {selectedCustomer.tier.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Financial Profile */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-mono">
                <div>
                  <div className="text-[8.5px] text-slate-400 uppercase">LTV</div>
                  <div className="text-slate-900 font-semibold">{formatVND(selectedCustomer.ltv)}</div>
                </div>
                <div>
                  <div className="text-[8.5px] text-slate-400 uppercase">Risk Score</div>
                  <div className="text-rose-600 font-semibold">{((selectedCustomer.churn_risk_score || 0) * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[8.5px] text-slate-400 uppercase">Monthly Fee</div>
                  <div className="text-slate-800">{formatVND(selectedCustomer.monthly_fee)}</div>
                </div>
              </div>

              {/* Phase 1 Root Cause Ground Truth */}
              {selectedCustomer.churn_reason && (
                <div className="bg-amber-50/60 p-2.5 rounded border border-amber-200 text-xs space-y-0.5">
                  <div className="text-[9px] font-mono font-bold text-amber-800 uppercase tracking-wider">
                    Phase 1 Telco Churn Reason
                  </div>
                  <div className="text-amber-950 font-medium text-[11px]">
                    "{selectedCustomer.churn_reason}"
                  </div>
                </div>
              )}

              {/* Signal Analysis */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-xs">
                <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Extracted Signals & Sentiment
                </div>
                <div className="text-slate-700">
                  <strong className="text-slate-500 font-normal">Pain points:</strong> {selectedCustomer.pain_points || 'None reported'}
                </div>
                <div className="text-slate-700 font-mono text-[10.5px]">
                  <strong className="text-slate-500 font-normal">Sentiment:</strong> {selectedCustomer.sentiment}
                </div>
              </div>

              {/* Strategy Decision */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  <span>Strategy & Guardrail Validation</span>
                  <span className="text-slate-600 bg-white px-1 py-0.2 rounded border border-slate-200">
                    Enforced
                  </span>
                </div>
                <div className="text-slate-800 font-mono text-[11px]">
                  Action: <strong>{selectedCustomer.action_type}</strong> | Discount: <strong>{selectedCustomer.discount_pct}%</strong>
                </div>
                <p className="text-slate-600 text-[10.5px] bg-white p-2 rounded border border-slate-200">
                  "{selectedCustomer.reasoning}"
                </p>
              </div>

              {/* Dispatched Message Bubble */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  <span>Dispatched Outreach Message</span>
                  <span className="text-slate-400 font-normal">Channel: {selectedCustomer.channel}</span>
                </div>
                <div className="bg-white p-3 rounded border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans shadow-xs">
                  {selectedCustomer.message_sent || 'Holdout group (No intervention dispatched).'}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Select an account to view dossier
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
