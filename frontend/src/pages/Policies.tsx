import { useState } from 'react';
import { 
  ShieldCheck, 
  Sliders, 
  Lock
} from 'lucide-react';

const segmentGuardrails = [
  {
    id: 'True_Friends_Elite',
    name: 'True Friends Elite',
    desc: 'Khách hàng VIP cốt lõi: Top 20% LTV & Top 20% Tenure (hoặc Tribe Leader)',
    maxDiscount: 40,
    maxFreeMonths: 2,
    allowedActions: ['vip_training', 'discount'],
    strategy: 'White-glove Service: Đào tạo VIP chuyên sâu, tặng tối đa 2 tháng miễn phí để bảo vệ nguồn doanh thu dài hạn.'
  },
  {
    id: 'True_Friends_Standard',
    name: 'True Friends Standard',
    desc: 'Khách hàng trung thành: Top 50% LTV & Top 50% Tenure',
    maxDiscount: 25,
    maxFreeMonths: 1,
    allowedActions: ['vip_training', 'discount'],
    strategy: 'Giảm giá tối đa 25% hoặc tặng 1 tháng để tháo gỡ điểm nghẽn trải nghiệm mà không làm xói mòn biên lợi nhuận.'
  },
  {
    id: 'Butterflies_Whales',
    name: 'Butterflies Whales',
    desc: 'Khách chi tiêu cao nhưng thời gian gắn bó ngắn (< 50% Tenure)',
    maxDiscount: 30,
    maxFreeMonths: 0,
    allowedActions: ['loyalty_upgrade', 'discount'],
    strategy: 'Commercial Play: Khuyến khích chuyển sang gói thường niên với ưu đãi tối đa 30% để khóa dòng tiền trả trước.'
  },
  {
    id: 'Butterflies_Standard',
    name: 'Butterflies Standard',
    desc: 'Khách hàng doanh thu trung bình, dễ bị lôi kéo bởi đối thủ',
    maxDiscount: 15,
    maxFreeMonths: 0,
    allowedActions: ['loyalty_upgrade', 'discount'],
    strategy: 'Ưu đãi chuyển đổi hợp đồng năm 15%, không cấp tháng miễn phí.'
  },
  {
    id: 'Barnacles_Heavy',
    name: 'Barnacles Heavy',
    desc: 'Khách hàng LTV rất thấp (< 20%), thời gian dài nhưng chi phí phục vụ cao',
    maxDiscount: 0,
    maxFreeMonths: 0,
    allowedActions: ['pause_subscription', 'no_action'],
    strategy: 'Zero Margin Leakage: Tuyệt đối không giảm giá, chỉ cho phép Pause dịch vụ để không bù lỗ chi phí CSKH.'
  },
  {
    id: 'Barnacles_Standard',
    name: 'Barnacles Standard',
    desc: 'Khách hàng LTV thấp, thời gian trung bình',
    maxDiscount: 5,
    maxFreeMonths: 0,
    allowedActions: ['pause_subscription', 'feature_newsletter'],
    strategy: 'Chăm sóc thụ động với chi phí 0đ (Pause hoặc gửi Newsletter).'
  },
  {
    id: 'Strangers',
    name: 'Strangers',
    desc: 'Khách hàng mới, giá trị thấp và độ gắn bó thấp',
    maxDiscount: 5,
    maxFreeMonths: 0,
    allowedActions: ['feature_newsletter', 'email_only'],
    strategy: 'Automated Nudge: Gửi email tự động hướng dẫn tính năng mới với chi phí gần bằng 0.'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-teal-400" />
            Retention Policy & Budget Guardrail Engine
          </h1>
          <p className="text-xs text-slate-400">
            Hệ thống quy chuẩn kiểm soát ngân sách: Ép cứng trần giảm giá và ngăn chặn AI Agent tự ý đưa ra ưu đãi vượt mức cho phép.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
            <Lock size={12} /> Guardrail: Hard Enforced
          </span>
        </div>
      </div>

      {/* Main Grid: Left Segment List + Right Details & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Segments List (Col 5) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
            Segment Guardrail Configurations (7 Tiers)
          </div>

          <div className="space-y-2">
            {segmentGuardrails.map((seg) => {
              const isSelected = selectedSeg.id === seg.id;
              return (
                <div
                  key={seg.id}
                  onClick={() => setSelectedSeg(seg)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-teal-500/15 border-teal-500/40 shadow-lg shadow-teal-500/5' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isSelected ? 'text-teal-300' : 'text-white'}`}>
                      {seg.name}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900/60">
                      Max Disc: {seg.maxDiscount}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{seg.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Segment Policy Card & Simulator (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Policy Detail Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">Active Guardrail Spec</div>
                <h3 className="text-lg font-bold text-white">{selectedSeg.name}</h3>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold">
                Max {selectedSeg.maxDiscount}% OFF
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <strong className="text-teal-400">Business Rationale:</strong> {selectedSeg.strategy}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Free Months</div>
                <div className="text-xl font-bold font-mono text-white">{selectedSeg.maxFreeMonths} Tháng</div>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Allowed Action Catalog</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedSeg.allowedActions.map((a) => (
                    <span key={a} className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-mono">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Policy Simulator */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Interactive Segment & Policy Simulator</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Live Rule Test</span>
            </div>

            <div className="space-y-4">
              {/* Slider 1: LTV Percentile */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Customer LTV Percentile:</span>
                  <span className="text-teal-300 font-bold">{simLtvPct}th Percentile</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={simLtvPct} 
                  onChange={(e) => setSimLtvPct(Number(e.target.value))}
                  className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2: Tenure Percentile */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Tenure (Loyalty) Percentile:</span>
                  <span className="text-cyan-300 font-bold">{simTenurePct}th Percentile</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={simTenurePct} 
                  onChange={(e) => setSimTenurePct(Number(e.target.value))}
                  className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Checkbox: Tribe Leader */}
              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="tribe_leader"
                  checked={isTribeLeader}
                  onChange={(e) => setIsTribeLeader(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="tribe_leader" className="text-xs text-slate-300 cursor-pointer">
                  Is Network / Tribe Leader (High social influence score)
                </label>
              </div>

              {/* Simulation Result Output */}
              <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 p-4 rounded-xl border border-teal-500/30 flex items-center justify-between mt-4">
                <div>
                  <div className="text-[10px] text-teal-400 font-mono uppercase">Calculated Strategy Tier</div>
                  <div className="text-sm font-bold text-white mt-0.5">{simResult.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Allowed Actions: {simResult.allowedActions.join(', ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Guardrail Ceiling</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">Max {simResult.maxDiscount}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
