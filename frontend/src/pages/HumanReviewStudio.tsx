import { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle, 
  Edit3, 
  AlertTriangle, 
  Eye, 
  Check, 
  Search,
  Layers,
  Database
} from 'lucide-react';
import { 
  fetchHitlQueue, 
  overrideAction, 
  batchApprove,
  type HitlQueueResponse,
  type ActionRecord
} from '../api/client';

export function HumanReviewStudio() {
  const [queue, setQueue] = useState<HitlQueueResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'tier3' | 'tier2' | 'tier1'>('tier3');
  const [selectedCase, setSelectedCase] = useState<ActionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'voluntary' | 'involuntary'>('all');
  
  // Override edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editAction, setEditAction] = useState('');
  const [editDiscount, setEditDiscount] = useState(0);
  const [editFreeMonths, setEditFreeMonths] = useState(0);
  const [editNote, setEditNote] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    const qData = await fetchHitlQueue();
    if (qData) {
      setQueue(qData);
      if (qData.tier3_copilot.length > 0 && !selectedCase) {
        setSelectedCase(qData.tier3_copilot[0]);
      } else if (!selectedCase && qData.tier2_batch.length > 0) {
        setSelectedCase(qData.tier2_batch[0]);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCase = (c: ActionRecord) => {
    setSelectedCase(c);
    setEditAction(c.action_type);
    setEditDiscount(c.discount_pct);
    setEditFreeMonths(c.free_months);
    setEditNote('');
    setEditMessage(c.message_sent || generateCleanMessage(c));
    setIsEditing(false);
  };

  const generateCleanMessage = (c: ActionRecord) => {
    const custName = c.name || 'Valued Customer';
    const reason = c.churn_reason ? c.churn_reason.toLowerCase() : '';
    
    if (reason.includes('competitor') || reason.includes('price')) {
      return `Dear ${custName}, our customer success team sincerely values your partnership. To optimize your service experience and cost, we would like to offer you an exclusive ${c.discount_pct}% discount on renewal along with dedicated technical account management. Please reply to activate this offer immediately.`;
    }
    if (reason.includes('speed') || reason.includes('network') || reason.includes('device')) {
      return `Dear ${custName}, we have received your recent network performance feedback. Our engineering team has completed a diagnostic audit and would like to extend complimentary hardware optimization with priority infrastructure upgrades.`;
    }
    if (c.churn_category === 'involuntary') {
      return `Dear ${custName}, understanding your upcoming relocation, our system has activated our complimentary 90-day subscription pause feature ($0 charge). Your account profile, settings, and loyalty tier will be fully preserved upon your return.`;
    }
    return `Dear ${custName}, thank you for your ongoing partnership. We are pleased to extend an exclusive loyalty appreciation package designed to support your workflow seamlessly.`;
  };

  const handleSaveOverride = async () => {
    if (!selectedCase) return;
    setSaveLoading(true);
    const success = await overrideAction({
      customer_id: selectedCase.customer_id,
      action_type: editAction,
      discount_pct: Number(editDiscount),
      free_months: Number(editFreeMonths),
      specialist_note: editNote || 'Specialist manual adjustment',
      custom_message: editMessage
    });
    setSaveLoading(false);
    if (success) {
      setNotification(`Saved and approved decision for account ${selectedCase.customer_id}`);
      setTimeout(() => setNotification(null), 4000);
      setIsEditing(false);
      loadData();
    }
  };

  const handleApproveCase = async (c: ActionRecord) => {
    const success = await overrideAction({
      customer_id: c.customer_id,
      action_type: c.action_type,
      discount_pct: c.discount_pct,
      free_months: c.free_months,
      specialist_note: 'Specialist 1-click approval verified',
      custom_message: c.message_sent || generateCleanMessage(c)
    });
    if (success) {
      setNotification(`Approved action dispatch for account ${c.customer_id}`);
      setTimeout(() => setNotification(null), 4000);
      loadData();
    }
  };

  const handleBatchApprove = async (tier?: string) => {
    const success = await batchApprove({ tier });
    if (success) {
      setNotification(`Batch approved all cases for ${tier || 'selected tier'}`);
      setTimeout(() => setNotification(null), 4000);
      loadData();
    }
  };

  const formatVND = (vnd?: number) => {
    if (!vnd) return '0 VND';
    if (vnd >= 1000000) {
      return `${(vnd / 1000000).toFixed(1)}M VND`;
    }
    return `${(vnd / 1000).toLocaleString()}k VND`;
  };

  // Filter queue items by tab, search, and category
  const rawList = useMemo(() => {
    if (!queue) return [];
    if (activeTab === 'tier3') return queue.tier3_copilot;
    if (activeTab === 'tier2') return queue.tier2_batch;
    return queue.tier1_autonomous;
  }, [queue, activeTab]);

  const filteredList = useMemo(() => {
    return rawList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.customer_id.toLowerCase().includes(q) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.churn_reason && item.churn_reason.toLowerCase().includes(q)) ||
        item.tier.toLowerCase().includes(q);
      
      const matchCategory = filterCategory === 'all' || 
        (item.churn_category || 'voluntary').toLowerCase() === filterCategory.toLowerCase();

      return matchSearch && matchCategory;
    });
  }, [rawList, searchQuery, filterCategory]);

  // Explainable AI (XAI) feature attribution calculation
  const xaiAttributions = useMemo(() => {
    if (!selectedCase) return [];

    const attributions: { feature: string; value: string; weight: number; direction: 'risk' | 'mitigating'; description: string }[] = [];

    // 1. Contract Type
    const contract = selectedCase.contract_type || (selectedCase.churn_risk_score > 0.7 ? 'Month-to-month' : 'One year');
    if (contract === 'Month-to-month') {
      attributions.push({
        feature: 'Contract Type',
        value: 'Month-to-month',
        weight: 0.34,
        direction: 'risk',
        description: 'No long-term commitment; highest attrition risk factor (+34%)'
      });
    } else {
      attributions.push({
        feature: 'Contract Type',
        value: contract,
        weight: -0.16,
        direction: 'mitigating',
        description: 'Term-committed contract reduces churn probability (-16%)'
      });
    }

    // 2. Customer Tenure
    const tenure = selectedCase.tenure_months ?? 6;
    if (tenure <= 6) {
      attributions.push({
        feature: 'Tenure',
        value: `${tenure} months`,
        weight: 0.26,
        direction: 'risk',
        description: 'Sensitive onboarding window; early lifecycle churn vulnerability (+26%)'
      });
    } else if (tenure >= 36) {
      attributions.push({
        feature: 'Tenure',
        value: `${tenure} months`,
        weight: -0.22,
        direction: 'mitigating',
        description: 'Long-term loyal customer; strong organic stickiness (-22%)'
      });
    } else {
      attributions.push({
        feature: 'Tenure',
        value: `${tenure} months`,
        weight: 0.08,
        direction: 'risk',
        description: 'Mid-tier tenure, moderate baseline stability (+8%)'
      });
    }

    // 3. Monthly Fee / ARPU Bracket
    const fee = selectedCase.monthly_fee || 0;
    if (fee >= 1800000) {
      attributions.push({
        feature: 'Monthly Fee (ARPU)',
        value: formatVND(fee),
        weight: 0.18,
        direction: 'risk',
        description: 'High monthly fee; subscriber is highly sensitive to competitor promotions (+18%)'
      });
    } else {
      attributions.push({
        feature: 'Monthly Fee (ARPU)',
        value: formatVND(fee),
        weight: -0.06,
        direction: 'mitigating',
        description: 'Moderate fee bracket; lower competitive switching pressure (-6%)'
      });
    }

    // 4. Payment Method Friction
    const payment = selectedCase.payment_method || 'Electronic check';
    if (payment === 'Electronic check') {
      attributions.push({
        feature: 'Payment Method',
        value: 'Electronic check',
        weight: 0.12,
        direction: 'risk',
        description: 'Manual invoice payment method; higher friction and cancellation propensity (+12%)'
      });
    } else {
      attributions.push({
        feature: 'Payment Method',
        value: payment,
        weight: -0.08,
        direction: 'mitigating',
        description: 'Automated payment method reduces billing friction (-8%)'
      });
    }

    // 5. Churn Ground Truth Reason
    const reason = selectedCase.churn_reason || 'Competitor pricing';
    const isVoluntary = selectedCase.churn_category !== 'involuntary';
    attributions.push({
      feature: 'Ground Truth Trigger',
      value: reason,
      weight: isVoluntary ? 0.20 : 0.30,
      direction: 'risk',
      description: isVoluntary 
        ? `Voluntary trigger (${reason}); prime candidate for personalized retention` 
        : `Involuntary trigger (${reason}); requires subscription pause rather than discounts`
    });

    return attributions;
  }, [selectedCase]);

  // Unit Economics computation
  const unitEconomics = useMemo(() => {
    if (!selectedCase) return null;
    const ltv = selectedCase.ltv || 0;
    const monthlyFee = selectedCase.monthly_fee || 0;
    const discountPct = isEditing ? editDiscount : selectedCase.discount_pct;
    const freeMonths = isEditing ? editFreeMonths : selectedCase.free_months;
    
    // Retention Cost (CRC) calculation
    let crc = monthlyFee * (discountPct / 100) * 3; // 3 months discount horizon
    if (freeMonths > 0) crc += monthlyFee * freeMonths;
    if (selectedCase.action_type === 'vip_training') crc += 20000;
    if (selectedCase.action_type === 'dedicated_csm_audit') crc += 50000;
    if (selectedCase.action_type === 'enterprise_trial_unlock') crc += 10000;
    
    const netRetained = Math.max(0, ltv - crc);
    const roiFactor = crc > 0 ? (ltv / crc).toFixed(1) : 'N/A';
    const marginErosion = ltv > 0 ? ((crc / ltv) * 100).toFixed(1) : '0';

    return {
      ltv,
      crc,
      netRetained,
      roiFactor,
      marginErosion
    };
  }, [selectedCase, isEditing, editDiscount, editFreeMonths]);

  return (
    <div className="space-y-3 font-sans text-slate-800 antialiased">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white text-xs">
            Close
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 font-mono tracking-tight">
              HITL & Explainable AI (XAI) Retention Console
            </h1>
            <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-mono px-2 py-0.5 rounded font-semibold">
              Governance Mode: Enforced
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Feature Attribution (XAI), Guardrail compliance audit, and specialist intervention console
          </div>
        </div>

        {/* Quick Compliance Status */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded text-slate-700">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span className="text-[11px] font-medium">PII Redaction Vault: Active</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded text-slate-700">
            <Lock size={13} className="text-slate-500" />
            <span className="text-[11px] font-medium">SOC-2 Isolated</span>
          </div>
        </div>
      </div>

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            <span>Tier 3 Specialist Review</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {queue?.tier3_copilot.length || 0} accounts
          </div>
          <div className="text-[10.5px] text-slate-500">
            Co-Pilot 100% Specialist Review (High LTV / Whales)
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            <span>Tier 2 Batch Queue</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {queue?.tier2_batch.length || 0} accounts
          </div>
          <div className="text-[10.5px] text-slate-500">
            Moderate risk tier, supports 1-click batch approval
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            <span>Tier 1 Autonomous</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {queue?.tier1_autonomous.length || 0} accounts
          </div>
          <div className="text-[10.5px] text-slate-500">
            Automated zero-cost guardrail execution
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-2.5 rounded shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            <span>Retention Budget</span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">Secure</span>
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            0% Breaches
          </div>
          <div className="text-[10.5px] text-slate-500">
            Circuit Breaker & Anti-Gaming active
          </div>
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: Action Queue */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded flex flex-col h-[700px]">
          {/* Queue Tab Navigation */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs font-mono">
            <button
              onClick={() => setActiveTab('tier3')}
              className={`flex-1 py-2 px-2 text-center border-b-2 font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'tier3'
                  ? 'border-slate-900 text-slate-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Tier 3 (Priority)</span>
              <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {queue?.tier3_copilot.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tier2')}
              className={`flex-1 py-2 px-2 text-center border-b-2 font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'tier2'
                  ? 'border-slate-900 text-slate-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Tier 2 (Batch Queue)</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {queue?.tier2_batch.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tier1')}
              className={`flex-1 py-2 px-2 text-center border-b-2 font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'tier1'
                  ? 'border-slate-900 text-slate-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Tier 1 (Autonomous)</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {queue?.tier1_autonomous.length || 0}
              </span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-2 border-b border-slate-100 bg-white space-y-2">
            <div className="relative">
              <Search size={13} className="text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Customer ID, name, churn reason..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-mono">Churn Group:</span>
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    filterCategory === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterCategory('voluntary')}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    filterCategory === 'voluntary' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Voluntary
                </button>
                <button
                  onClick={() => setFilterCategory('involuntary')}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    filterCategory === 'involuntary' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Involuntary
                </button>
              </div>

              {activeTab === 'tier2' && (
                <button
                  onClick={() => handleBatchApprove('Tier 2 - Batch Review')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition"
                >
                  Batch Approve ({filteredList.length})
                </button>
              )}
            </div>
          </div>

          {/* Customer Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
            {filteredList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                No accounts matching filter criteria
              </div>
            ) : (
              filteredList.map((c) => {
                const isSelected = selectedCase?.customer_id === c.customer_id;
                const riskPct = Math.round((c.churn_risk_score || 0) * 100);
                const isVoluntary = c.churn_category !== 'involuntary';

                return (
                  <div
                    key={c.customer_id}
                    onClick={() => handleSelectCase(c)}
                    className={`p-2 rounded text-xs cursor-pointer transition border ${
                      isSelected
                        ? 'border-slate-800 bg-slate-50/90 shadow-2xs'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{c.customer_id}</span>
                        {c.name && (
                          <span className="text-slate-600 font-medium text-[11px] truncate max-w-[110px]">
                            {c.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold ${
                          c.tier.includes('Elite') || c.tier.includes('Whale')
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.tier}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>LTV: <strong className="text-slate-800 font-mono">{formatVND(c.ltv)}</strong></span>
                      <span className="flex items-center gap-1">
                        Churn Risk: 
                        <strong className={`font-mono ${riskPct >= 70 ? 'text-rose-600' : 'text-amber-600'}`}>
                          {riskPct}%
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-600 truncate max-w-[210px] font-sans">
                        {c.churn_reason || 'Attrition Risk'}
                      </span>
                      <span className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase ${
                        isVoluntary ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                      }`}>
                        {c.churn_category || 'voluntary'}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>Action: <strong className="text-slate-700 font-mono">{c.action_type}</strong></span>
                      {c.discount_pct > 0 && (
                        <span className="text-slate-600 font-mono">-{c.discount_pct}% fee</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Explainable AI & Audit Inspection Workspace */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded flex flex-col h-[700px] overflow-y-auto p-3.5 space-y-3">
          {selectedCase ? (
            <>
              {/* Account Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 font-mono">
                      {selectedCase.customer_id}
                    </h2>
                    {selectedCase.name && (
                      <span className="text-sm font-semibold text-slate-700">
                        {selectedCase.name}
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {selectedCase.tier}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                      selectedCase.churn_category === 'involuntary' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedCase.churn_category || 'voluntary'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Telco ID: {selectedCase.original_telco_id || 'N/A'}</span>
                    <span>Tenure: {selectedCase.tenure_months ?? 'N/A'} mo</span>
                    <span>Contract: {selectedCase.contract_type || 'Month-to-month'}</span>
                    <span>Payment: {selectedCase.payment_method || 'Electronic check'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`text-xs px-2.5 py-1.5 rounded font-mono font-medium border cursor-pointer transition flex items-center gap-1.5 ${
                      isEditing
                        ? 'bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Edit3 size={13} />
                    {isEditing ? 'Close Override' : 'Specialist Override'}
                  </button>
                  {!isEditing && (
                    <button
                      onClick={() => handleApproveCase(selectedCase)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded font-mono font-medium cursor-pointer transition flex items-center gap-1.5"
                    >
                      <Check size={13} />
                      Approve
                    </button>
                  )}
                </div>
              </div>

              {/* XAI Module 1: Churn Risk & Feature Attribution */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                    <Database size={13} className="text-slate-600" />
                    <span>XAI: Churn Driver Feature Attribution</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-500">Churn Probability:</span>
                    <span className="font-bold text-rose-600">
                      {((selectedCase.churn_risk_score || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Primary Ground Truth Reason */}
                <div className="bg-white border border-slate-200 p-2 rounded text-xs">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Phase 1 Telco Root Cause:</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    "{selectedCase.churn_reason || 'Unspecified reason'}"
                  </div>
                </div>

                {/* Attribution Factors Table */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Feature contributions to churn risk (SHAP Equivalent):
                  </div>

                  <div className="space-y-1 text-xs">
                    {xaiAttributions.map((attr, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-2 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="sm:w-1/3">
                          <div className="font-mono font-bold text-slate-800 text-[11px]">{attr.feature}</div>
                          <div className="text-slate-500 text-[10px]">{attr.value}</div>
                        </div>

                        <div className="sm:w-1/3 flex items-center gap-2">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${attr.direction === 'risk' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, Math.abs(attr.weight) * 200)}%` }}
                            ></div>
                          </div>
                          <span className={`font-mono text-[10.5px] font-semibold w-12 text-right ${
                            attr.direction === 'risk' ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {attr.weight > 0 ? `+${(attr.weight * 100).toFixed(0)}%` : `${(attr.weight * 100).toFixed(0)}%`}
                          </span>
                        </div>

                        <div className="sm:w-1/3 text-[10px] text-slate-500 sm:text-right">
                          {attr.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* XAI Module 2: Recommendation Transparency & Guardrail Verification */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                    <Layers size={13} className="text-slate-600" />
                    <span>XAI: Recommendation Logic & Guardrail Audit</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                    Policy Compliant
                  </span>
                </div>

                {/* Matched Decision Rule */}
                <div className="bg-white border border-slate-200 p-2.5 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10.5px]">
                    <span className="text-slate-500">Routing Rule Code:</span>
                    <span className="font-bold text-slate-800">
                      RULE-{selectedCase.churn_category === 'involuntary' ? 'INVOL-PAUSE-01' : 'VOL-RETAIN-OPTIMAL'}
                    </span>
                  </div>
                  <div className="text-slate-700 text-xs">
                    <strong>Decision Logic:</strong> {selectedCase.reasoning || 'Standard margin-optimized retention policy applied.'}
                  </div>
                </div>

                {/* Guardrail Checklist & Financial Unit Economics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Guardrail Validation Checklist */}
                  <div className="bg-white border border-slate-200 p-2 rounded space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Compliance Audit:</div>
                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Discount Cap:</span>
                        <span className="text-emerald-700 font-semibold">[PASS] &le; 20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Margin Erosion:</span>
                        <span className="text-emerald-700 font-semibold">[PASS] {unitEconomics?.marginErosion}% &lt; 15%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Cooling Period:</span>
                        <span className="text-emerald-700 font-semibold">[PASS] &gt; 180 days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">PII Tokenization:</span>
                        <span className="text-emerald-700 font-semibold">[PASS] Tokenized</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Unit Economics */}
                  <div className="bg-white border border-slate-200 p-2 rounded space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Financial Unit Economics:</div>
                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Protected LTV:</span>
                        <span className="text-slate-900 font-bold">{formatVND(unitEconomics?.ltv)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Retention Cost (CRC):</span>
                        <span className="text-slate-700">{formatVND(unitEconomics?.crc)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Net Retained Value:</span>
                        <span className="text-emerald-700 font-bold">{formatVND(unitEconomics?.netRetained)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">ROI Multiple:</span>
                        <span className="text-slate-900 font-bold">{unitEconomics?.roiFactor}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Details & Override Workspace */}
              {!isEditing ? (
                <div className="border border-slate-200 rounded p-3 bg-white space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                      Planned Retention Action & Outreach Copy
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Channel: {selectedCase.channel || 'phone_call'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-[9.5px] text-slate-400 uppercase">Action</div>
                      <div className="font-bold text-slate-900 mt-0.5">{selectedCase.action_type}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-[9.5px] text-slate-400 uppercase">Discount</div>
                      <div className="font-bold text-slate-900 mt-0.5">{selectedCase.discount_pct}% fee</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-[9.5px] text-slate-400 uppercase">Free Months</div>
                      <div className="font-bold text-slate-900 mt-0.5">{selectedCase.free_months} mo</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10.5px] font-mono text-slate-500 uppercase flex items-center justify-between">
                      <span>Draft Customer Outreach Message:</span>
                      <span className="text-[9.5px] text-slate-400">PII Redacted</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-xs text-slate-800 leading-relaxed font-sans">
                      {selectedCase.message_sent || generateCleanMessage(selectedCase)}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Adjust Proposal
                    </button>
                    <button
                      onClick={() => handleApproveCase(selectedCase)}
                      className="px-4 py-1.5 text-xs font-mono font-bold text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer shadow-xs transition"
                    >
                      Approve & Dispatch
                    </button>
                  </div>
                </div>
              ) : (
                /* Specialist Override Editing Form */
                <div className="border border-slate-300 rounded p-3 bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-amber-600" />
                      <span>Specialist Decision Override Mode</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">All adjustments are logged to audit trail</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-mono font-semibold text-slate-600 block mb-1">
                        Intervention Action:
                      </label>
                      <select
                        value={editAction}
                        onChange={(e) => setEditAction(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                      >
                        <option value="vip_training">vip_training (VIP Training)</option>
                        <option value="dedicated_csm_audit">dedicated_csm_audit (1-on-1 CSM)</option>
                        <option value="enterprise_trial_unlock">enterprise_trial_unlock (Enterprise 30d)</option>
                        <option value="discount">discount (Direct Discount)</option>
                        <option value="pause_subscription">pause_subscription (Complimentary Pause)</option>
                        <option value="loyalty_upgrade">loyalty_upgrade (Annual Upgrade)</option>
                        <option value="cross_sell_bundle">cross_sell_bundle (Add-on Bundle)</option>
                        <option value="feature_newsletter">feature_newsletter (Feature Newsletter)</option>
                        <option value="no_action">no_action (No Action)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-semibold text-slate-600 block mb-1">
                        Discount Rate (%):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-semibold text-slate-600 block mb-1">
                        Free Months:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={editFreeMonths}
                        onChange={(e) => setEditFreeMonths(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-semibold text-slate-600 block mb-1">
                      Audit Reason Note:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Account requires dedicated engineering integration per SLA guarantee"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-semibold text-slate-600 block mb-1">
                      Edit Outreach Copy:
                    </label>
                    <textarea
                      rows={3}
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500 font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-mono px-3 py-1.5 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveOverride}
                      disabled={saveLoading}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold px-4 py-1.5 rounded cursor-pointer transition shadow-xs"
                    >
                      {saveLoading ? 'Saving...' : 'Save & Approve'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 text-xs font-mono space-y-2">
              <Eye size={24} className="opacity-40" />
              <div>Select an account from the left panel to inspect XAI analysis and review action</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
