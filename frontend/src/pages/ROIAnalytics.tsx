import { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Scale, 
  AlertTriangle, 
  Sparkles, 
  Percent,
  CheckCircle
} from 'lucide-react';
import { fetchAnalytics, fetchStats } from '../api/client';
import type { AnalyticsResponse, StatsResponse } from '../api/client';
import { mockPainPointsData, mockActionEffectiveness } from '../data/mock';

export function ROIAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetchAnalytics().then(a => a && setAnalytics(a));
    fetchStats().then(s => s && setStats(s));
  }, []);

  const painPoints = analytics?.pain_points && analytics.pain_points.length > 0
    ? analytics.pain_points
    : mockPainPointsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-teal-400" />
            Financial Economics & ROI Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Mô hình đo lường hiệu quả kinh tế: So sánh Holdout vs Treatment, CAC vs CRC Arbitrage và Phân bổ giá trị khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono">
            Uplift: +36.3% Churn Prevention
          </div>
          <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
            ROI: {stats?.roi_metrics?.roi ? `${stats.roi_metrics.roi.toFixed(1)}x` : '18.4x'}
          </div>
        </div>
      </div>

      {/* 4 Financial Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Customer Retention Cost (CRC)</span>
            <DollarSign size={13} className="text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">65,000 ₫</div>
          <div className="text-[10px] text-slate-400 mt-1">Chi phí giữ chân trung bình / khách</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Customer Acquisition Cost (CAC)</span>
            <Scale size={13} className="text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">950,000 ₫</div>
          <div className="text-[10px] text-slate-400 mt-1">Chi phí tìm khách mới ước tính ngành</div>
        </div>

        <div className="bg-slate-950/70 border border-teal-500/30 p-4 rounded-xl bg-gradient-to-br from-teal-950/20 to-slate-950">
          <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>CAC / CRC Arbitrage Ratio</span>
            <Sparkles size={13} className="text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-300">14.6x</div>
          <div className="text-[10px] text-teal-400/80 mt-1">Giữ chân rẻ hơn 14.6 lần so với tìm khách mới</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Net Revenue Retention (NRR)</span>
            <Percent size={13} className="text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">114.2%</div>
          <div className="text-[10px] text-slate-400 mt-1">Doanh thu giữ lại & tăng trưởng thường niên</div>
        </div>
      </div>

      {/* Row 2: Deep Dive Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pain Points / Churn Drivers */}
        <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                Top Churn Drivers (Pain Points Extracted by AI)
              </h3>
              <p className="text-[11px] text-slate-400">Phát hiện tự động từ log hội thoại & ticket hỗ trợ</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={painPoints} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="pain_point" tick={{ fontSize: 9, fill: '#94a3b8' }} width={130} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} cases`, 'Frequency']}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Type Retention Effectiveness */}
        <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                Action Strategy Effectiveness & Cost
              </h3>
              <p className="text-[11px] text-slate-400">Tỷ lệ giữ chân thành công theo từng loại can thiệp</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockActionEffectiveness} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="action" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${val}%`, 'Retention Success Rate']}
                />
                <Bar dataKey="savedRate" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Unit Economics Table */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Scale size={16} className="text-teal-400" />
          Unit Economics & Segment Strategy Breakdown
        </h3>
        <p className="text-[11px] text-slate-400 mb-4">
          Chi tiết chiến lược can thiệp, chi phí và hiệu quả kinh tế trên từng phân khúc khách hàng
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Segment Tier</th>
                <th className="px-4 py-3">Strategic Action</th>
                <th className="px-4 py-3">Avg LTV</th>
                <th className="px-4 py-3">Retention Cost (CRC)</th>
                <th className="px-4 py-3">Success Rate</th>
                <th className="px-4 py-3 text-right">Segment ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-900/40">
                <td className="px-4 py-3 text-teal-300 font-bold font-sans">True Friends Elite</td>
                <td className="px-4 py-3 font-sans">VIP Training + White Glove Dedicated Review</td>
                <td className="px-4 py-3 text-slate-200">32,500,000 ₫</td>
                <td className="px-4 py-3 text-amber-400">20,000 ₫</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">78%</td>
                <td className="px-4 py-3 text-right text-emerald-300 font-bold">240.5x</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-4 py-3 text-teal-300 font-bold font-sans">True Friends Standard</td>
                <td className="px-4 py-3 font-sans">Discount 15-25% + 1 Month Free</td>
                <td className="px-4 py-3 text-slate-200">18,500,000 ₫</td>
                <td className="px-4 py-3 text-amber-400">85,000 ₫</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">65%</td>
                <td className="px-4 py-3 text-right text-emerald-300 font-bold">141.2x</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-4 py-3 text-cyan-300 font-bold font-sans">Butterflies (Whales / Std)</td>
                <td className="px-4 py-3 font-sans">Annual Loyalty Upgrade Push (Lock-in cashflow)</td>
                <td className="px-4 py-3 text-slate-200">16,200,000 ₫</td>
                <td className="px-4 py-3 text-amber-400">120,000 ₫</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">58%</td>
                <td className="px-4 py-3 text-right text-emerald-300 font-bold">78.3x</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-4 py-3 text-amber-300 font-bold font-sans">Barnacles (Heavy / Std)</td>
                <td className="px-4 py-3 font-sans">Pause Subscription (Zero-Cost CRM Retention)</td>
                <td className="px-4 py-3 text-slate-200">8,900,000 ₫</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">0 ₫</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">42%</td>
                <td className="px-4 py-3 text-right text-emerald-300 font-bold">∞</td >
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-4 py-3 text-slate-400 font-bold font-sans">Strangers</td>
                <td className="px-4 py-3 font-sans">Feature Education Newsletter (Zero-Cost Nudge)</td>
                <td className="px-4 py-3 text-slate-200">3,800,000 ₫</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">0 ₫</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">24%</td>
                <td className="px-4 py-3 text-right text-emerald-300 font-bold">∞</td >
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
