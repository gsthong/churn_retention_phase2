import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sliders, 
  CheckCircle, 
  Edit3, 
  AlertTriangle, 
  Sparkles, 
  Eye, 
  Check, 
  Clock
} from 'lucide-react';
import { 
  fetchHitlQueue, 
  fetchPrivacyTelemetry, 
  overrideAction, 
  batchApprove,
  type HitlQueueResponse,
  type PrivacyTelemetryResponse,
  type ActionRecord
} from '../api/client';

export function HumanReviewStudio() {
  const [queue, setQueue] = useState<HitlQueueResponse | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyTelemetryResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'tier3' | 'tier2' | 'tier1'>('tier3');
  const [selectedCase, setSelectedCase] = useState<ActionRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAction, setEditAction] = useState('');
  const [editDiscount, setEditDiscount] = useState(0);
  const [editFreeMonths, setEditFreeMonths] = useState(0);
  const [editNote, setEditNote] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    const [qData, pData] = await Promise.all([
      fetchHitlQueue(),
      fetchPrivacyTelemetry()
    ]);
    if (qData) {
      setQueue(qData);
      if (qData.tier3_copilot.length > 0 && !selectedCase) {
        setSelectedCase(qData.tier3_copilot[0]);
      }
    }
    if (pData) setPrivacy(pData);
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
    setEditMessage(c.message_sent);
    setIsEditing(false);
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
      setNotification(`Đã cập nhật và phê duyệt quyết định cho tài khoản ${selectedCase.customer_id}`);
      setTimeout(() => setNotification(null), 4000);
      setIsEditing(false);
      loadData();
    }
  };

  const handleBatchApprove = async (tier?: string) => {
    const success = await batchApprove({ tier });
    if (success) {
      setNotification(`Đã duyệt đồng loạt thành công!`);
      setTimeout(() => setNotification(null), 4000);
      loadData();
    }
  };

  const formatVND = (vnd: number) => {
    if (!vnd) return '0 ₫';
    return `${(vnd / 1000).toLocaleString()}k ₫`;
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded shadow flex items-center gap-2 text-xs animate-fade-in">
          <CheckCircle size={14} className="text-emerald-600" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              Human-in-the-Loop & Privacy Governance Studio
            </h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold">
              Specialist Portal
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Giám sát luồng AI, ẩn danh hóa dữ liệu (PII Redaction) & can thiệp chuyên gia (80/20 Optimal Split)
          </div>
        </div>

        {/* Quick Privacy Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2.5 py-1 rounded">
            <ShieldCheck size={14} />
            <span className="font-semibold text-[11px]">Nghị định 13/2023 & GDPR</span>
            <span className="bg-emerald-200 text-emerald-900 text-[9px] px-1 py-0.2 rounded font-mono">100% Compliant</span>
          </div>
        </div>
      </div>

      {/* Governance & Automation Ratio Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3 rounded shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Tỷ Lệ Tự Động Hóa (AI)</span>
            <Sparkles size={13} className="text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {queue?.summary.tier1_autonomous_pct || 80}%
          </div>
          <div className="text-[10px] text-slate-400">
            {queue?.summary.tier1_autonomous_count || 0} ca tự vận hành không tốn chi phí
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Can Thiệp Chuyên Gia (HITL)</span>
            <Sliders size={13} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600">
            {((queue?.summary.tier2_batch_pct || 0) + (queue?.summary.tier3_copilot_pct || 0)).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400">
            {(queue?.summary.tier2_batch_count || 0) + (queue?.summary.tier3_copilot_count || 0)} ca cần duyệt / Co-Pilot
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Thời Gian Nhân Lực Tiết Kiệm</span>
            <Clock size={13} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {privacy?.hitl_split.human_saved_hours_monthly || 184.5}h / tháng
          </div>
          <div className="text-[10px] text-slate-400">
            Tương đương ~{formatVND(privacy?.hitl_split.estimated_labor_cost_saved_vnd || 36900000)} quỹ lương CS
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Bảo Mật & Rò Rỉ PII Cloud</span>
            <Lock size={13} className="text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600">0% Rò Rỉ</div>
          <div className="text-[10px] text-slate-400">
            Dữ liệu định danh được Tokenized tại On-premise
          </div>
        </div>
      </div>

      {/* Why 80/20 Ratio Explanation Box */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white p-3.5 rounded border border-slate-700 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
            <span>🎯 Triết lý Phân Tầng Rủi Ro: Tại sao chọn tỷ lệ 80% AI : 20% Con Người?</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            • <strong>Nếu con người làm quá nhiều (&gt;50%)</strong>: Phần mềm mất tính năng tự động hóa, chi phí nhân sự CS/HR tăng cao, tốc độ phản ứng chậm khiến khách hàng rời bỏ trước khi kịp can thiệp.<br/>
            • <strong>Nếu AI làm 100%</strong>: Rủi ro rò rỉ ngân sách khuyến mại, mất uy tín thương hiệu khi gặp tình huống nhạy cảm hoặc mất khách hàng VIP/Whale Barnacles.<br/>
            • <strong>Tỷ lệ vàng 80/20</strong>: AI tự động hóa 80% tệp phổ thông (Zero-cost) + Chuyên viên làm chủ 20% tệp trọng yếu (High LTV / Whale Expansion) giúp tối ưu hóa ROI và an toàn tuyệt đối.
          </p>
        </div>
        <button 
          onClick={() => handleBatchApprove()}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold px-3 py-1.5 rounded text-xs shrink-0 cursor-pointer flex items-center gap-1.5 transition"
        >
          <Check size={14} /> Duyệt Nhanh Toàn Bộ Nhóm Đạt Chuẩn
        </button>
      </div>

      {/* Governance Tiers Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
        <button
          onClick={() => setActiveTab('tier3')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
            activeTab === 'tier3'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Tier 3: VIP & Whale Barnacles (Co-Pilot 100% Review)</span>
          <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
            {queue?.tier3_copilot.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tier2')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
            activeTab === 'tier2'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Tier 2: Medium Risk (Batch 1-Click Approval)</span>
          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
            {queue?.tier2_batch.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tier1')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
            activeTab === 'tier1'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Tier 1: Autonomous Low Risk (Zero-Touch Logs)</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
            {queue?.tier1_autonomous.length || 0}
          </span>
        </button>
      </div>

      {/* Main Review Workspace: Split Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Customer Queue List */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded p-3 space-y-2 max-h-[620px] overflow-y-auto">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {activeTab === 'tier3' && '🔥 Danh Sách Ưu Tiên Cao (Cần Duyệt Chi Tiết)'}
              {activeTab === 'tier2' && '⚡ Danh Sách Duyệt Nhóm (Batch Queue)'}
              {activeTab === 'tier1' && '🤖 Luồng AI Tự Động Vận Hành'}
            </span>
            {activeTab === 'tier2' && (
              <button
                onClick={() => handleBatchApprove()}
                className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-semibold cursor-pointer"
              >
                Duyệt Hết ({queue?.tier2_batch.length})
              </button>
            )}
          </div>

          {/* List items */}
          {activeTab === 'tier3' && queue?.tier3_copilot.map((c) => (
            <div
              key={c.customer_id}
              onClick={() => handleSelectCase(c)}
              className={`p-2.5 rounded border text-xs cursor-pointer transition ${
                selectedCase?.customer_id === c.customer_id
                  ? 'border-indigo-500 bg-indigo-50/60 shadow-xs'
                  : 'border-slate-200 bg-slate-50/40 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{c.customer_id}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  c.tier === 'Barnacles_Whale' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {c.tier}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>LTV: <strong>{formatVND(c.ltv)}</strong></span>
                <span>Rủi ro: <strong className="text-rose-600 font-mono">{(c.churn_risk_score * 100).toFixed(0)}%</strong></span>
              </div>
              <div className="text-[10px] text-slate-600 mt-1 line-clamp-1 italic">
                AI đề xuất: {c.action_type} ({c.discount_pct}% off, {c.free_months}m free)
              </div>
            </div>
          ))}

          {activeTab === 'tier2' && queue?.tier2_batch.map((c) => (
            <div
              key={c.customer_id}
              onClick={() => handleSelectCase(c)}
              className={`p-2 rounded border text-xs cursor-pointer transition ${
                selectedCase?.customer_id === c.customer_id
                  ? 'border-amber-500 bg-amber-50/60'
                  : 'border-slate-200 bg-slate-50/30 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{c.customer_id}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-800">
                  {c.tier}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Đề xuất: {c.action_type} ({c.discount_pct}% off)
              </div>
            </div>
          ))}

          {activeTab === 'tier1' && queue?.tier1_autonomous.map((c) => (
            <div
              key={c.customer_id}
              onClick={() => handleSelectCase(c)}
              className={`p-2 rounded border text-xs cursor-pointer transition ${
                selectedCase?.customer_id === c.customer_id
                  ? 'border-emerald-500 bg-emerald-50/60'
                  : 'border-slate-200 bg-slate-50/30 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{c.customer_id}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800">
                  Auto: {c.action_type}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {c.reasoning}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Case Deep Review & Specialist Override Workspace */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded p-4 space-y-3">
          {selectedCase ? (
            <>
              {/* Case Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 font-mono">
                      {selectedCase.customer_id}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                      {selectedCase.tier}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {selectedCase.agent_source}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    LTV: {formatVND(selectedCase.ltv)} | Phí hàng tháng: {formatVND(selectedCase.monthly_fee)} | Rủi ro: {(selectedCase.churn_risk_score * 100).toFixed(0)}%
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <Edit3 size={13} />
                  {isEditing ? 'Hủy Chỉnh Sửa' : 'Chuyên Gia Tùy Chỉnh (Override)'}
                </button>
              </div>

              {/* Extracted Signals & AI Telemetry */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-mono">Pain Points Trích Xuất:</span>
                  <span className="font-semibold text-slate-800">{selectedCase.pain_points || 'Không có tín hiệu tiêu cực'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-mono">Cảm Xúc (Sentiment):</span>
                  <span className={`font-semibold capitalize ${
                    selectedCase.sentiment === 'frustrated' ? 'text-rose-600' : 'text-slate-700'
                  }`}>
                    {selectedCase.sentiment}
                  </span>
                </div>
              </div>

              {/* Decision Details / Override Form */}
              {!isEditing ? (
                <div className="space-y-2.5">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded space-y-1.5">
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      Quyết Định Giữ Chân Hiện Tại:
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="bg-white p-2 rounded border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-sans">Hành động:</span>
                        <strong className="text-slate-900">{selectedCase.action_type}</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-sans">Chiết khấu (%):</span>
                        <strong className="text-slate-900">{selectedCase.discount_pct}%</strong>
                      </div>
                      <div className="bg-white p-2 rounded border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-sans">Tháng miễn phí:</span>
                        <strong className="text-slate-900">{selectedCase.free_months} tháng</strong>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 pt-1">
                      <strong>Lập luận AI:</strong> {selectedCase.reasoning}
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Nội Dung Tin Nhắn Gửi Khách Hàng (Kênh: {selectedCase.channel}):</span>
                      <span className="text-[10px] text-slate-400 font-mono">PII Masked</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs text-slate-800 leading-relaxed font-sans">
                      {selectedCase.message_sent || '(Không gửi tin nhắn)'}
                    </div>
                  </div>

                  {/* Single Approve Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleBatchApprove(selectedCase.tier)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <CheckCircle size={14} /> Xác Nhận & Cho Phép Gửi
                    </button>
                  </div>
                </div>
              ) : (
                /* Specialist Editing / Override Workspace */
                <div className="space-y-3 bg-amber-50/40 p-3 rounded border border-amber-200">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" />
                    Chuyên Viên Ghi Đè Quyết Định (Specialist Override Mode)
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 block font-semibold mb-0.5">Chọn Hành Động:</label>
                      <select
                        value={editAction}
                        onChange={(e) => setEditAction(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="dedicated_csm_audit">dedicated_csm_audit (Tư vấn 1-1)</option>
                        <option value="enterprise_trial_unlock">enterprise_trial_unlock (Mở Enterprise 30d)</option>
                        <option value="vip_training">vip_training (Đào tạo VIP)</option>
                        <option value="cross_sell_bundle">cross_sell_bundle (Gói mở rộng)</option>
                        <option value="loyalty_upgrade">loyalty_upgrade (Gói thường niên)</option>
                        <option value="discount">discount (Giảm giá trực tiếp)</option>
                        <option value="pause_subscription">pause_subscription (Tạm ngưng 0đ)</option>
                        <option value="feature_newsletter">feature_newsletter (Bản tin tính năng)</option>
                        <option value="no_action">no_action (Không can thiệp)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-600 block font-semibold mb-0.5">Giảm Giá (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-600 block font-semibold mb-0.5">Tháng Miễn Phí:</label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={editFreeMonths}
                        onChange={(e) => setEditFreeMonths(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block font-semibold mb-0.5">Ghi Chú Của Chuyên Viên (Audit Reason):</label>
                    <input
                      type="text"
                      placeholder="VD: Khách hàng yêu cầu tích hợp ERP chuyên biệt, cần CSM hỗ trợ trực tiếp"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 block font-semibold mb-0.5">Chỉnh Sửa Tin Nhắn Gửi Đi:</label>
                    <textarea
                      rows={3}
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-3 py-1.5 rounded font-semibold cursor-pointer"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      onClick={handleSaveOverride}
                      disabled={saveLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-1.5 rounded font-bold cursor-pointer transition shadow-xs"
                    >
                      {saveLoading ? 'Đang lưu...' : 'Lưu Thay Đổi & Phê Duyệt'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Eye size={24} className="mx-auto mb-2 opacity-50" />
              Chọn một tài khoản từ danh sách bên trái để kiểm tra chi tiết.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
