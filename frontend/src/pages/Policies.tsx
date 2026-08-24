import { useState } from 'react';

const segmentGuardrails = [
  {
    id: 'True_Friends_Elite',
    name: 'True Friends Elite',
    desc: 'Core VIP accounts: Top 20% LTV & Top 20% Tenure',
    maxDiscount: 40,
    maxFreeMonths: 2,
    allowedActions: ['vip_training', 'discount'],
    strategy: 'Dedicated white-glove onboarding and up to 2 free months to protect high recurring cashflow.'
  },
  {
    id: 'True_Friends_Standard',
    name: 'True Friends Standard',
    desc: 'Loyal high-value accounts: Top 50% LTV & Top 50% Tenure',
    maxDiscount: 25,
    maxFreeMonths: 1,
    allowedActions: ['vip_training', 'discount'],
    strategy: 'Targeted discount up to 25% or 1 month free extension to resolve friction without eroding margin.'
  },
  {
    id: 'Butterflies_Whales',
    name: 'Butterflies Whales',
    desc: 'High spenders with low tenure (< 50% Tenure)',
    maxDiscount: 30,
    maxFreeMonths: 0,
    allowedActions: ['loyalty_upgrade', 'discount'],
    strategy: 'Lock in annual contracts with up to 30% discount to convert transactional usage into long-term tenure.'
  },
  {
    id: 'Butterflies_Standard',
    name: 'Butterflies Standard',
    desc: 'Medium LTV accounts with price sensitivity',
    maxDiscount: 15,
    maxFreeMonths: 0,
    allowedActions: ['loyalty_upgrade', 'discount'],
    strategy: '15% discount towards annual contract commitment.'
  },
  {
    id: 'Barnacles_Heavy',
    name: 'Barnacles Heavy',
    desc: 'Low LTV (< 20%), high support cost ratio',
    maxDiscount: 0,
    maxFreeMonths: 0,
    allowedActions: ['pause_subscription', 'no_action'],
    strategy: 'Strict zero-discount constraint. Only offer subscription pause to prevent negative margin.'
  },
  {
    id: 'Barnacles_Standard',
    name: 'Barnacles Standard',
    desc: 'Low LTV with medium tenure',
    maxDiscount: 5,
    maxFreeMonths: 0,
    allowedActions: ['pause_subscription', 'feature_newsletter'],
    strategy: 'Zero-cost retention: Pause option or automated self-serve documentation.'
  },
  {
    id: 'Strangers',
    name: 'Strangers',
    desc: 'New low-value, low-loyalty accounts',
    maxDiscount: 5,
    maxFreeMonths: 0,
    allowedActions: ['feature_newsletter', 'email_only'],
    strategy: 'Automated email nudges with zero human intervention.'
  }
];

export function Policies() {
  const [selectedSeg, setSelectedSeg] = useState(segmentGuardrails[0]);
  
  // Interactive Simulator State
  const [simLtvPct, setSimLtvPct] = useState(85);
  const [simTenurePct, setSimTenurePct] = useState(85);
  const [isTribeLeader, setIsTribeLeader] = useState(false);

  const calculateSegment = () => {
    if (isTribeLeader) return segmentGuardrails[0];
    if (simLtvPct >= 80 && simTenurePct >= 80) return segmentGuardrails[0];
    if (simLtvPct >= 50 && simTenurePct >= 50) return segmentGuardrails[1];
    if (simLtvPct >= 80 && simTenurePct < 50) return segmentGuardrails[2];
    if (simLtvPct >= 50 && simTenurePct < 50) return segmentGuardrails[3];
    if (simLtvPct < 20 && simTenurePct >= 80) return segmentGuardrails[4];
    if (simLtvPct < 50 && simTenurePct >= 50) return segmentGuardrails[5];
    return segmentGuardrails[6];
  };

  const simResult = calculateSegment();

  return (
    <div className="space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Retention Rules & Budget Guardrail Engine
          </h1>
          <div className="text-xs text-slate-400">Deterministic constraints on discounts, action catalogs, and free extensions</div>
        </div>

        <div className="text-xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
          Guardrail Status: <strong className="text-slate-900">Strictly Enforced</strong>
        </div>
      </div>

      {/* Main Grid: Left Segment List + Right Details & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: Segments List (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-3 space-y-1.5">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
            Configured Segment Specs (7 Tiers)
          </div>

          <div className="space-y-1.5">
            {segmentGuardrails.map((seg) => {
              const isSelected = selectedSeg.id === seg.id;
              return (
                <div
                  key={seg.id}
                  onClick={() => setSelectedSeg(seg)}
                  className={`p-2.5 rounded border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-slate-100 border-slate-800' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-slate-900">
                      {seg.name}
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      Max: {seg.maxDiscount}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{seg.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Segment Policy Card & Simulator (Col 7) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Policy Detail Card */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Guardrail Specification</div>
                <h3 className="text-sm font-bold text-slate-900">{selectedSeg.name}</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono font-semibold">
                Ceiling: {selectedSeg.maxDiscount}% OFF
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
              <strong className="text-slate-900 font-semibold">Business Rationale:</strong> {selectedSeg.strategy}
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="text-[8.5px] text-slate-400 uppercase">Max Free Months</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{selectedSeg.maxFreeMonths} Months</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="text-[8.5px] text-slate-400 uppercase">Allowed Actions</div>
                <div className="flex flex-wrap gap-1 mt-1 font-sans">
                  {selectedSeg.allowedActions.map((a) => (
                    <span key={a} className="text-[9.5px] px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-mono">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Policy Simulator */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">Segment & Guardrail Calculator</h3>
              <span className="text-[9px] text-slate-400 font-mono">Real-time Simulation</span>
            </div>

            <div className="space-y-3">
              {/* Slider 1: LTV Percentile */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-600">Customer LTV Percentile:</span>
                  <span className="text-slate-900 font-semibold">{simLtvPct}th</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={simLtvPct} 
                  onChange={(e) => setSimLtvPct(Number(e.target.value))}
                  className="w-full accent-slate-800 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
              </div>

              {/* Slider 2: Tenure Percentile */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-600">Tenure (Loyalty) Percentile:</span>
                  <span className="text-slate-900 font-semibold">{simTenurePct}th</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={simTenurePct} 
                  onChange={(e) => setSimTenurePct(Number(e.target.value))}
                  className="w-full accent-slate-800 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input 
                  type="checkbox" 
                  id="tribe_leader"
                  checked={isTribeLeader}
                  onChange={(e) => setIsTribeLeader(e.target.checked)}
                  className="rounded border-slate-300 text-slate-800 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="tribe_leader" className="text-xs text-slate-700 cursor-pointer">
                  High Network Influence / Core Account
                </label>
              </div>

              {/* Simulation Result Output */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[8.5px] text-slate-400 font-mono uppercase">Assigned Strategy Segment</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{simResult.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Actions: {simResult.allowedActions.join(', ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-[8.5px] text-slate-400 font-mono uppercase">Max Discount Allowed</div>
                  <div className="text-base font-bold font-mono text-slate-900">{simResult.maxDiscount}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
