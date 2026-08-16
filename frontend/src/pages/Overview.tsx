import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, AlertTriangle, AlertCircle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { mockPortfolioGrowth, mockHighRiskCustomers } from '../data/mock';

export function Overview() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Good morning, Sarah! ☀️
        </h1>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-sm"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Monthly Recurring Revenue</div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-slate-800 tracking-tight">$45.2k</span>
            <span className="flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs font-medium mb-1">
              <ArrowUpRight size={12} className="mr-0.5" /> 12%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Net Churn Rate</div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-slate-800 tracking-tight">2.4%</span>
            <span className="flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs font-medium mb-1">
              <ArrowDownRight size={12} className="mr-0.5" /> 0.5%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active Rescue Plans</div>
          <div className="text-3xl font-bold text-slate-800 tracking-tight">14</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Health Score</div>
          <div className="text-3xl font-bold text-slate-800 tracking-tight">78<span className="text-slate-400 text-lg font-normal">/100</span></div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Left Column */}
        <div className="col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-semibold text-slate-800">High-Risk Customers</h2>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">3 Needs Attention</span>
            </div>
            
            <div className="space-y-3">
              {mockHighRiskCustomers.map((cus, idx) => (
                <div key={cus.id} className={`p-4 rounded-xl border ${idx === 0 ? 'border-teal-500 bg-teal-50/10 shadow-md ring-1 ring-teal-500/20' : 'border-slate-200 bg-white shadow-sm'} flex items-start justify-between cursor-pointer transition-all hover:border-teal-300`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                      {cus.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1">{cus.name}</h3>
                      <div className="text-xs text-slate-500">{cus.fee} • Health: {cus.health}/100</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cus.risk === 'High Risk' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-orange-50 text-orange-600 border-orange-200'} flex items-center gap-1`}>
                      <AlertTriangle size={10} /> {cus.risk}
                    </span>
                    <span className="text-[10px] text-slate-400">Last seen: {cus.lastSeen}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Portfolio Growth (6m)</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPortfolioGrowth}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (Detail View) */}
        <div className="col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-200">
                <span className="font-bold text-slate-400">AC</span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Acme Studio</h2>
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">Health: 35/100</span>
                </div>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                   Customer since Mar 2023
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Mail size={16} /> Contact
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 flex gap-3">
            <div className="text-teal-600 mt-0.5"><AlertCircle size={18} /></div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Note</div>
              <p className="text-sm text-slate-700 leading-relaxed">
                Acme Studio hasn't logged in for 14 days and recently submitted a support ticket about billing confusion. They are a "True Friend" segment (High LTV, High Loyalty) currently showing extreme flight risk.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1 uppercase tracking-wider mb-2"><ArrowDownRight size={14}/> Usage Drop</div>
              <div className="text-2xl font-bold text-slate-800">-40%</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-bold text-orange-500 flex items-center gap-1 uppercase tracking-wider mb-2">Tickets (30D)</div>
              <div className="text-2xl font-bold text-slate-800">2</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-bold text-teal-600 flex items-center gap-1 uppercase tracking-wider mb-2">LTV</div>
              <div className="text-2xl font-bold text-slate-800">$1,440</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider mb-2">Last Login</div>
              <div className="text-2xl font-bold text-slate-800">14d ago</div>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl p-5 bg-white mb-6 flex-1">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><AlertTriangle size={14}/></div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Submitted support ticket #4492</div>
                  <div className="text-xs text-slate-400 mt-0.5">3 days ago</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><AlertCircle size={14}/></div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Payment method expired warning</div>
                  <div className="text-xs text-slate-400 mt-0.5">7 days ago</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl">
             <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-teal-800 flex items-center gap-2">
                  <Activity size={16} /> Suggested Action: The Loyalty Upgrade
                </h4>
                <span className="text-[10px] font-bold bg-teal-200/50 text-teal-800 px-2 py-0.5 rounded uppercase tracking-wider">AI Generated</span>
             </div>
             <div className="bg-white p-3 rounded-lg border border-teal-100 text-sm text-slate-600 italic">
               "Hi Acme Team, we noticed you had some billing trouble. We value your long-term partnership and have upgraded your account to Priority Support for the next 3 months, free of charge..."
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
