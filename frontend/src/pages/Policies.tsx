import { useState, useEffect } from 'react';
import { Layers, Download, CheckCircle2 } from 'lucide-react';
import { fetchPolicies, type PoliciesResponse } from '../api/client';

const segmentGuardrails = [
  {
    id: 'True_Friends_Elite',
    name: 'True Friends Elite',
    desc: 'Core VIP accounts: Top 20% LTV & Top 20% Tenure',
    maxDiscount: 40,
    maxFreeMonths: 2,
    allowedActions: ['vip_training', 'dedicated_csm_audit', 'discount'],
    strategy: 'Dedicated white-glove onboarding, executive review and up to 2 free months to protect high recurring cashflow.'
  },
  {
    id: 'True_Friends_Standard',
    name: 'True Friends Standard',
    desc: 'Loyal high-value accounts: Top 50% LTV & Top 50% Tenure',
    maxDiscount: 25,
    maxFreeMonths: 1,
    allowedActions: ['vip_training', 'discount', 'priority_support'],
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
    id: 'Barnacles_Whale',
    name: 'Barnacles Whale (Enterprise / High Wallet)',
    desc: 'Doanh nghiệp lớn gắn bó lâu (>70% Tenure) nhưng chỉ mua gói nhỏ. Tiềm năng ví khổng lồ.',
    maxDiscount: 20,
    maxFreeMonths: 1,
    allowedActions: ['dedicated_csm_audit', 'enterprise_trial_unlock', 'cross_sell_bundle'],
    strategy: 'Wallet-Expansion Play: Mở khóa 30 ngày Enterprise Trial miễn phí + Giám đốc CSM trực tiếp tư vấn giải pháp để "cạy vỏ hàu".'
  },
  {
    id: 'Barnacles_Heavy',
    name: 'Barnacles Heavy (Tài Nguyên Cao - LTV Thấp)',
    desc: 'Low LTV (< 20%), tỷ lệ ticket hỗ trợ cao bất thường',
    maxDiscount: 0,
    maxFreeMonths: 0,
    allowedActions: ['pause_subscription', 'no_action'],
    strategy: 'Strict zero-discount constraint. Only offer subscription pause to prevent negative margin.'
  },
  {
    id: 'Barnacles_Standard',
    name: 'Barnacles Standard (Hàu Phổ Thông)',
    desc: 'Gắn bó lâu (>50% Tenure) nhưng dung lượng ví nhỏ thật sự (<50% LTV)',
    maxDiscount: 5,
    maxFreeMonths: 0,
    allowedActions: ['pause_subscription', 'feature_newsletter', 'self_service_guide'],
    strategy: 'Zero-cost retention: Tạm ngưng (Pause) giữ chân trên CRM, cẩm nang tự phục vụ (Self-serve).'
  },
  {
    id: 'Strangers',
    name: 'Strangers (Khách Vãng Lai)',
    desc: 'New low-value, low-loyalty accounts',
    maxDiscount: 5,
    maxFreeMonths: 0,
    allowedActions: ['feature_newsletter', 'email_only'],
    strategy: 'Automated email nudges with zero human intervention.'
  }
];

export function Policies() {
  const [selectedSeg, setSelectedSeg] = useState(segmentGuardrails[4]); // default to Barnacles Whale
  const [activeFramework, setActiveFramework] = useState<'framework_a' | 'framework_b'>('framework_a');
  const [policiesData, setPoliciesData] = useState<PoliciesResponse | null>(null);
  
  // Interactive Simulator State
  const [simLtvPct, setSimLtvPct] = useState(35);
  const [simTenurePct, setSimTenurePct] = useState(78);
  const [isTribeLeader, setIsTribeLeader] = useState(false);
  const [isEnterpriseWallet, setIsEnterpriseWallet] = useState(true);

  useEffect(() => {
    fetchPolicies().then(res => res && setPoliciesData(res));
  }, []);

  const calculateSegment = () => {
    if (isTribeLeader) return segmentGuardrails[0];
    if (simLtvPct >= 80 && simTenurePct >= 80) return segmentGuardrails[0];
    if (simLtvPct >= 50 && simTenurePct >= 50) return segmentGuardrails[1];
    if (simLtvPct >= 80 && simTenurePct < 50) return segmentGuardrails[2];
    if (simLtvPct >= 50 && simTenurePct < 50) return segmentGuardrails[3];
    if (simLtvPct < 50 && simTenurePct >= 70 && isEnterpriseWallet) return segmentGuardrails[4]; // Barnacles Whale
    if (simLtvPct < 20 && simTenurePct >= 80) return segmentGuardrails[5]; // Barnacles Heavy
    if (simLtvPct < 50 && simTenurePct >= 50) return segmentGuardrails[6]; // Barnacles Standard
    return segmentGuardrails[7]; // Strangers
  };

  const simResult = calculateSegment();

  const downloadCSV = () => {
    if (!policiesData?.matrix_table) return;
    const rows = policiesData.matrix_table;
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "retention_policies_matrix.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Retention Policies & Barnacles Guardrail Matrix
          </h1>
          <div className="text-xs text-slate-500">
            Cấu hình bộ luật cho AI Agent, định chế ngân sách chiết khấu & phân khúc Hàu bám thuyền (Standard vs Whale Barnacles)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded font-semibold cursor-pointer transition border border-slate-200"
          >
            <Download size={13} />
            <span>Tải Config CSV (Excel)</span>
          </button>
          <div className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold">
            Guardrails: Enforced
          </div>
        </div>
      </div>

      {/* 2 Frameworks Comparison Banner */}
      <div className="bg-white border border-slate-200 rounded p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono">
            <Layers size={14} className="text-indigo-600" />
            2 Bộ Khung Chiến Lược Chuẩn Hóa Cho Doanh Nghiệp (Framework Switcher)
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setActiveFramework('framework_a')}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                activeFramework === 'framework_a'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bộ Luật A: Cost-Efficiency (Bảo Vệ Biên Lợi Nhuận)
            </button>
            <button
              onClick={() => setActiveFramework('framework_b')}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                activeFramework === 'framework_b'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bộ Luật B: Wallet-Expansion (Mở Rộng Dung Lượng Ví)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className={`p-3 rounded border ${activeFramework === 'framework_a' ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-400' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
            <div className="font-bold text-indigo-900 mb-1 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-indigo-600" />
              Bộ Luật A: Margin Protection & Zero-Discount For Barnacles
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              • <strong>Mục tiêu:</strong> Tối đa hóa lợi nhuận ròng, kiểm soát chi phí CRC &lt; 5% Saved ARR.<br/>
              • <strong>Chiến lược Barnacles:</strong> Tuyệt đối không giảm giá sâu cho Standard Barnacles. Dùng giải pháp 0 đồng (Pause Subscription, Self-service guide). Khóa rủi ro thâm hụt tài nguyên.
            </p>
          </div>

          <div className={`p-3 rounded border ${activeFramework === 'framework_b' ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-400' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
            <div className="font-bold text-indigo-900 mb-1 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-indigo-600" />
              Bộ Luật B: Whale Barnacle Expansion & Proof-of-Concept
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              • <strong>Mục tiêu:</strong> Tối đa hóa Expansion ARR từ các tài khoản doanh nghiệp tiềm năng.<br/>
              • <strong>Chiến lược Barnacles:</strong> Với Whale Barnacles (khách hàng có ví lớn mua gói nhỏ), tặng 30 ngày Enterprise Trial + Đào tạo CSM để "cạy vỏ hàu", chuyển đổi thành True Friends VIP.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Segment List + Right Details & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: Segments List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-3 space-y-1.5 max-h-[580px] overflow-y-auto">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
            Danh Mục Phân Khúc Chi Tiết ({segmentGuardrails.length} Nhóm)
          </div>

          <div className="space-y-1.5">
            {segmentGuardrails.map((seg) => {
              const isSelected = selectedSeg.id === seg.id;
              const isWhale = seg.id === 'Barnacles_Whale';
              return (
                <div
                  key={seg.id}
                  onClick={() => setSelectedSeg(seg)}
                  className={`p-2.5 rounded border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-slate-100 border-indigo-600 ring-1 ring-indigo-500/30' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      {isWhale && <span className="text-purple-600 font-mono font-bold">🐋</span>}
                      {seg.name}
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      Trần: {seg.maxDiscount}% OFF
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{seg.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Segment Policy Card & Simulator */}
        <div className="lg:col-span-7 space-y-3">
          {/* Policy Detail Card */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Chi Tiết Quy Chuẩn Guardrail</div>
                <h3 className="text-sm font-bold text-slate-900">{selectedSeg.name}</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono font-semibold">
                Giới Hạn: {selectedSeg.maxDiscount}% OFF | {selectedSeg.maxFreeMonths} Tháng Free
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
              <strong className="text-slate-900 font-semibold">Chiến lược can thiệp:</strong> {selectedSeg.strategy}
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="text-[8.5px] text-slate-400 uppercase">Tháng Dịch Vụ Tặng Tối Đa</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{selectedSeg.maxFreeMonths} Tháng</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="text-[8.5px] text-slate-400 uppercase">Hành Động Được Phép Kích Hoạt</div>
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

          {/* Interactive Policy & Segment Simulator */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">Máy Tính Giả Lập Phân Khúc & Bộ Luật</h3>
              <span className="text-[9px] text-slate-400 font-mono">Real-time Rule Engine</span>
            </div>

            <div className="space-y-3">
              {/* Slider 1: LTV Percentile */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-600">Phân vị LTV (LTV Percentile):</span>
                  <span className="text-slate-900 font-semibold">{simLtvPct}th percentile</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={simLtvPct} 
                  onChange={(e) => setSimLtvPct(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
              </div>

              {/* Slider 2: Tenure Percentile */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-600">Phân vị Thâm Niên (Tenure Percentile):</span>
                  <span className="text-slate-900 font-semibold">{simTenurePct}th percentile</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={simTenurePct} 
                  onChange={(e) => setSimTenurePct(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
              </div>

              {/* Enterprise Wallet & Tribe Leader Toggles */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isEnterpriseWallet} 
                    onChange={(e) => setIsEnterpriseWallet(e.target.checked)}
                    className="accent-indigo-600 rounded"
                  />
                  <span>Doanh Nghiệp Tiềm Năng Lớn (High Wallet Capacity)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isTribeLeader} 
                    onChange={(e) => setIsTribeLeader(e.target.checked)}
                    className="accent-indigo-600 rounded"
                  />
                  <span>Tribe Leader (Key Influencer)</span>
                </label>
              </div>

              {/* Simulation Result Output */}
              <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Phân khúc nhận diện tự động:</span>
                  <strong className="text-indigo-900 text-sm font-sans font-bold">{simResult.name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Chiết khấu tối đa:</span>
                  <span className="text-sm font-bold text-indigo-700">{simResult.maxDiscount}% OFF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
