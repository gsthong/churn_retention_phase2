import { useState, useEffect } from 'react';
import { Layers, Download, CheckCircle2, ShieldAlert, Sparkles, Search } from 'lucide-react';
import { fetchPolicies, type PoliciesResponse, type InterventionItem } from '../api/client';

const defaultInterventions: InterventionItem[] = [
  {
    id: "I1",
    name: "Personalized Message / Nudge",
    cost_usd: "$0.20",
    cost_vnd: 5000,
    churn_reduced_pp: "+1–3 pp",
    suitable_for: "Low engagement / Inactive users",
    frequency: "1 / month",
    max_budget_usd: 1.0,
    risk_level: 1,
    description: "Email/In-app nudge nhẹ nhàng, không tốn chi phí, nhắc nhở giá trị hiện có (Endowment Effect)."
  },
  {
    id: "I2",
    name: "Loyalty Reward",
    cost_usd: "$3.00",
    cost_vnd: 72000,
    churn_reduced_pp: "+2–5 pp",
    suitable_for: "Loyal & Long-tenure Customers",
    frequency: "1 / quarter",
    max_budget_usd: 10.0,
    risk_level: 1,
    description: "Quà tri ân tích điểm / tính năng cộng thêm cho khách hàng lâu năm."
  },
  {
    id: "I3",
    name: "5% Discount Offer",
    cost_usd: "$3–10",
    cost_vnd: 120000,
    churn_reduced_pp: "+3–7 pp",
    suitable_for: "Price Sensitivity Barrier",
    frequency: "1 / 6 months",
    max_budget_usd: 20.0,
    risk_level: 2,
    description: "Chiết khấu nhẹ 5% để giải tỏa rào cản giá tạm thời mà không phá vỡ mỏ neo giá."
  },
  {
    id: "I4",
    name: "10% Discount Offer",
    cost_usd: "$6–20",
    cost_vnd: 240000,
    churn_reduced_pp: "+5–10 pp",
    suitable_for: "Price Sensitivity / Competitor Offer",
    frequency: "1 / year",
    max_budget_usd: 30.0,
    risk_level: 3,
    description: "Giảm 10% có điều kiện (gắn với cam kết gia hạn 6-12 tháng - Commercial Play)."
  },
  {
    id: "I5",
    name: "Free Month Extension",
    cost_usd: "$20–40",
    cost_vnd: 600000,
    churn_reduced_pp: "+7–12 pp",
    suitable_for: "High-Value Champions (True Friends Elite)",
    frequency: "1 / year",
    max_budget_usd: 50.0,
    risk_level: 4,
    description: "Tặng 1 tháng miễn phí khi ký hợp đồng thường niên cho khách hàng High LTV."
  },
  {
    id: "I6",
    name: "Feature Upgrade / Enterprise PoC",
    cost_usd: "$5–15",
    cost_vnd: 200000,
    churn_reduced_pp: "+4–8 pp",
    suitable_for: "Feature Limitation / Tool Dissatisfaction",
    frequency: "1 / 6 months",
    max_budget_usd: 25.0,
    risk_level: 2,
    description: "Mở khóa 30 ngày dùng thử bộ tính năng Doanh nghiệp cao cấp để giải quyết rào cản tính năng."
  },
  {
    id: "I7",
    name: "Plan Redesign / Subscription Pause",
    cost_usd: "$2–5",
    cost_vnd: 50000,
    churn_reduced_pp: "+3–8 pp",
    suitable_for: "Plan Mismatch / Moving / Temporary Absence",
    frequency: "1 / year",
    max_budget_usd: 15.0,
    risk_level: 1,
    description: "Tái cơ cấu gói cước hoặc kích hoạt tính năng Pause để giữ khách hàng trong CRM (HelloFresh Play)."
  },
  {
    id: "I8",
    name: "Service Recovery (Apology & Fix)",
    cost_usd: "$5–30",
    cost_vnd: 350000,
    churn_reduced_pp: "+5–15 pp",
    suitable_for: "Technical / Support Service Friction",
    frequency: "1 / incident",
    max_budget_usd: 40.0,
    risk_level: 3,
    description: "Quy trình xin lỗi chân thành + hỗ trợ kỹ thuật ưu tiên + voucher bồi thường trải nghiệm."
  },
  {
    id: "I9",
    name: "Dedicated Support & Strategic Audit",
    cost_usd: "$15–50",
    cost_vnd: 800000,
    churn_reduced_pp: "+8–15 pp",
    suitable_for: "Very High LTV / Severe Friction Barrier",
    frequency: "1 / year",
    max_budget_usd: 75.0,
    risk_level: 4,
    description: "Phiên tư vấn 1-1 chuyên sâu cùng Giám đốc Khách hàng (T-Mobile TEX White-Glove Play)."
  },
  {
    id: "I10",
    name: "No Intervention (Zero-Cost Filter)",
    cost_usd: "$0",
    cost_vnd: 0,
    churn_reduced_pp: "0 pp",
    suitable_for: "Low LTV / Negative EV / Sleeping Dogs",
    frequency: "Unlimited",
    max_budget_usd: 0,
    risk_level: 0,
    description: "Bộ lọc tuyệt đối: Không gửi ưu đãi làm xói mòn lợi nhuận với nhóm khách hàng không đáng cứu."
  }
];

const budgetCeilingMatrix = [
  { churn_risk: "Low", barrier: "Low", clv: "High", action: "No-cost / Loyalty Nudge", ceiling: "0–2% CLV", tag: "Safe" },
  { churn_risk: "Medium", barrier: "Low", clv: "High", action: "Loyalty + Small Incentive", ceiling: "2–5% CLV", tag: "Low Cost" },
  { churn_risk: "High", barrier: "Low", clv: "High", action: "Strong Temporary Offer", ceiling: "5–10% CLV", tag: "Controlled" },
  { churn_risk: "Low", barrier: "High", clv: "High", action: "Diagnose + Service Recovery", ceiling: "2–5% CLV", tag: "Service Play" },
  { churn_risk: "Medium", barrier: "High", clv: "High", action: "Personalized Save Package", ceiling: "5–10% CLV", tag: "High Priority" },
  { churn_risk: "High", barrier: "High", clv: "Very High", action: "Escalation + Bespoke Retention", ceiling: "10–15%+ CLV", tag: "White-Glove" }
];

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
    strategy: 'Wallet-Expansion Play: Mở khóa 30 ngày Enterprise Trial miễn phí + Giám đốc CSM trực tiếp tư vấn giải pháp để cạy vỏ hàu.'
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
  const [activeTab, setActiveTab] = useState<'matrix' | 'catalog' | 'ceilings'>('matrix');
  const [interventionSearch, setInterventionSearch] = useState('');
  
  // Interactive Simulator State
  const [simLtvPct, setSimLtvPct] = useState(35);
  const [simTenurePct, setSimTenurePct] = useState(78);
  const [isTribeLeader, setIsTribeLeader] = useState(false);
  const [isEnterpriseWallet, setIsEnterpriseWallet] = useState(true);

  useEffect(() => {
    fetchPolicies().then(res => res && setPoliciesData(res));
  }, []);

  const interventions = policiesData?.policies_config?.intervention_catalog || defaultInterventions;
  const filteredInterventions = interventions.filter(i => 
    i.name.toLowerCase().includes(interventionSearch.toLowerCase()) ||
    i.suitable_for.toLowerCase().includes(interventionSearch.toLowerCase()) ||
    i.id.toLowerCase().includes(interventionSearch.toLowerCase())
  );

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

  const getRiskBadge = (level: number) => {
    switch (level) {
      case 0:
        return <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Risk 0 (Zero)</span>;
      case 1:
        return <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">Risk 1 (Low)</span>;
      case 2:
        return <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">Risk 2 (Moderate)</span>;
      case 3:
        return <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">Risk 3 (High)</span>;
      case 4:
        return <span className="text-[9px] font-mono font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">Risk 4 (Critical)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Retention Policies, Guardrails & Intervention Catalog
          </h1>
          <div className="text-xs text-slate-500">
            Hệ thống quy chuẩn can thiệp 10 mã (Table 7), ma trận trần ngân sách CLV (Table 8) và phân khúc kinh doanh (Docx Specification)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded font-semibold cursor-pointer transition border border-slate-200"
          >
            <Download size={13} />
            <span>Tải Config CSV</span>
          </button>
          <div className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold">
            Guardrails: Enforced
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-1.5 rounded transition cursor-pointer ${
            activeTab === 'matrix' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Ma Trận Phân Khúc & Guardrail Tiers
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'catalog' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles size={12} />
          2. Bảng 10 Mã Can Thiệp (Intervention Catalog I1-I10)
        </button>
        <button
          onClick={() => setActiveTab('ceilings')}
          className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ceilings' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert size={12} />
          3. Ma Trận Trần Ngân Sách (Budget Ceiling Matrix)
        </button>
      </div>

      {/* TAB 1: MATRIX & SIMULATOR */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
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
                  Bộ Luật A: Cost-Efficiency
                </button>
                <button
                  onClick={() => setActiveFramework('framework_b')}
                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition ${
                    activeFramework === 'framework_b'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bộ Luật B: Wallet-Expansion
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
      )}

      {/* TAB 2: INTERVENTION CATALOG (Table 7) */}
      {activeTab === 'catalog' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Danh Mục 10 Hành Động Can Thiệp Chuẩn Hóa (Table 7)</span>
              </h2>
              <div className="text-xs text-slate-500">
                Định chế chi phí can thiệp, mức giảm churn kỳ vọng và phân loại rủi ro (Risk 0 - 4) theo [AISC] Business Specification
              </div>
            </div>

            <div className="relative w-72">
              <Search size={13} className="text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã I1-I10, tên hành động, rào cản..."
                value={interventionSearch}
                onChange={(e) => setInterventionSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[9px] font-mono border-b border-slate-200">
                  <th className="px-3 py-2">Mã ID</th>
                  <th className="px-3 py-2">Tên Can Thiệp</th>
                  <th className="px-3 py-2">Chi Phí Ước Tính</th>
                  <th className="px-3 py-2">Hiệu Quả Giảm Churn</th>
                  <th className="px-3 py-2">Rào Cản Phù Hợp</th>
                  <th className="px-3 py-2">Tần Suất</th>
                  <th className="px-3 py-2">Ngân Sách Trần</th>
                  <th className="px-3 py-2">Mức Độ Rủi Ro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInterventions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-bold text-indigo-700">{item.id}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{item.description}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      <span className="font-semibold text-slate-800">{item.cost_usd}</span>
                      <span className="text-[10px] text-slate-400 block font-sans">~{item.cost_vnd ? `${item.cost_vnd.toLocaleString()} VND` : '$0'}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-emerald-700 font-semibold">{item.churn_reduced_pp}</td>
                    <td className="px-3 py-2.5 text-slate-600 text-[11px]">{item.suitable_for}</td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{item.frequency}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-700">${item.max_budget_usd}</td>
                    <td className="px-3 py-2.5">{getRiskBadge(item.risk_level)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BUDGET CEILING MATRIX (Table 8) */}
      {activeTab === 'ceilings' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Ma Trận Trần Ngân Sách Can Thiệp Theo Giá Trị Khách Hàng (Table 8)</span>
            </h2>
            <div className="text-xs text-slate-500">
              Công thức định mức trần can thiệp: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">Max Budget Ceiling = X% of Expected CLV</code> dựa trên ma trận Rủi ro Churn x Rào cản Churn
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[9px] font-mono border-b border-slate-200">
                  <th className="px-3 py-2">Mức Rủi Ro Churn</th>
                  <th className="px-3 py-2">Độ Khó Rào Cản</th>
                  <th className="px-3 py-2">Phân Hạng CLV</th>
                  <th className="px-3 py-2">Hành Động Khuyến Nghị</th>
                  <th className="px-3 py-2">Trần Ngân Sách Phê Duyệt</th>
                  <th className="px-3 py-2">Phân Loại Chiến Lược</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgetCeilingMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors font-mono text-[11px]">
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.churn_risk === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        row.churn_risk === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {row.churn_risk} Risk
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{row.barrier} Barrier</td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">{row.clv} CLV</td>
                    <td className="px-3 py-2.5 font-sans font-medium text-slate-800">{row.action}</td>
                    <td className="px-3 py-2.5 font-bold text-indigo-700 bg-indigo-50/30">{row.ceiling}</td>
                    <td className="px-3 py-2.5 font-sans">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                        {row.tag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
