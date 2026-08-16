import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { AlertTriangle, Download, Filter, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { mockQuadrantDist, mockFunnel, mockInFlightOps, mockROI } from '../data/mock';

export function ROIAnalytics() {
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Row 1: Macro KPIs */}
      <div className="grid grid-cols-5 gap-3 shrink-0">
        <div className="bg-white p-3 border border-slate-200 rounded-sm flex flex-col justify-between h-20">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            At-Risk Accts <AlertTriangle size={12} className="text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-800">4,291</span>
            <span className="text-[10px] text-rose-500 font-bold">↑+12%</span>
          </div>
        </div>
        
        <div className="bg-white p-3 border border-slate-200 rounded-sm flex flex-col justify-between h-20">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Phantom Rev Secured
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-teal-700">$1.24M</span>
            <span className="text-[10px] text-teal-600 font-bold">↑+$42k</span>
          </div>
        </div>

        <div className="bg-white p-3 border border-slate-200 rounded-sm flex flex-col justify-between h-20">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            CAC vs CRC Arb
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold font-mono text-slate-800">1:12.4</span>
            <span className="text-[10px] text-slate-400">Ind avg 1:3</span>
          </div>
        </div>

        <div className="bg-white p-3 border border-slate-200 rounded-sm flex flex-col justify-between h-20">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Net Churn Rate
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-bold font-mono text-slate-800">-1.2%</span>
            <span className="text-[10px] text-emerald-600 font-bold">Tgt -0.5%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
             <div className="bg-teal-600 h-full w-[140%]"></div>
          </div>
        </div>

        <div className="bg-white p-3 border border-slate-200 rounded-sm flex flex-col justify-between h-20">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Churn Prev Rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-800">68.4%</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts + Policies */}
      <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Charts Column (Span 3) */}
        <div className="col-span-3 grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col">
             <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Quadrant Dist</div>
             <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={mockQuadrantDist} innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                     {mockQuadrantDist.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] font-mono">
               {mockQuadrantDist.map(item => (
                 <div key={item.name} className="flex justify-between">
                   <div className="flex items-center gap-1 text-slate-600"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: item.fill}}></div>{item.name}</div>
                   <div className="text-slate-800">${item.value / 1000}k</div>
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col">
             <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Multi-Agent Funnel</div>
             <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={mockFunnel} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={60} />
                   <Tooltip />
                   <Bar dataKey="value" fill="#0f766e" barSize={12} radius={[0, 4, 4, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col">
             <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Intervention ROI</div>
             <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                   <XAxis type="number" dataKey="cost" name="Cost" unit="$" tick={{fontSize: 10}} />
                   <YAxis type="number" dataKey="ltv" name="LTV Saved" unit="$" tick={{fontSize: 10}} />
                   <ZAxis type="category" dataKey="segment" name="Segment" />
                   <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                   <Scatter data={mockROI} fill="#0ea5e9" opacity={0.7} />
                 </ScatterChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Policies Column (Span 1) */}
        <div className="col-span-1 bg-white border border-slate-200 rounded-sm p-3 flex flex-col">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">Retention Rules & Policies</div>
          <div className="flex-1 overflow-auto space-y-3 pr-1">
            
            <div className="border border-slate-200 rounded bg-slate-50 p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-800">True Friends</span>
                <span className="text-[9px] bg-white border border-slate-200 px-1 text-slate-500">&lt; 15% Churn Risk</span>
              </div>
              <div className="text-[10px] text-slate-500 mb-2">High LTV, loyal segment</div>
              <div className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1 py-0.5 inline-block border border-teal-100 rounded-sm">Max 30% discount + Concierge Call</div>
            </div>

            <div className="border border-slate-200 rounded bg-slate-50 p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-800">Butterflies</span>
                <span className="text-[9px] bg-white border border-slate-200 px-1 text-slate-500">15-40% Churn Risk</span>
              </div>
              <div className="text-[10px] text-slate-500 mb-2">High LTV, low loyalty</div>
              <div className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1 py-0.5 inline-block border border-teal-100 rounded-sm">Max 15% discount + Auto Trial Ext</div>
            </div>

            <div className="border border-slate-200 rounded bg-slate-50 p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-800">Barnacles</span>
                <span className="text-[9px] bg-white border border-slate-200 px-1 text-slate-500">&gt; 40% Churn Risk</span>
              </div>
              <div className="text-[10px] text-slate-500 mb-2">Low LTV, high loyalty</div>
              <div className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1 py-0.5 inline-block rounded-sm">No discount + Auto Re-engagement</div>
            </div>

          </div>
        </div>
      </div>

      {/* Row 3: Data Table */}
      <div className="bg-white border border-slate-200 rounded-sm flex flex-col shrink-0">
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">In-Flight Operations</h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">142 ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input type="text" placeholder="Filter ID..." className="pl-6 pr-2 py-1 text-[11px] border border-slate-200 rounded-sm w-40 focus:outline-none focus:border-teal-500" />
              <Filter size={10} className="absolute left-2 top-1.5 text-slate-400" />
            </div>
            <button className="p-1 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-sm"><Download size={12} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                <th className="px-3 py-2 font-medium">OP ID</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Segment</th>
                <th className="px-3 py-2 font-medium w-24">Risk Lvl</th>
                <th className="px-3 py-2 font-medium text-right">LTV</th>
                <th className="px-3 py-2 font-medium text-center">Action Triggered</th>
                <th className="px-3 py-2 font-medium text-right">Cost</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-slate-700 divide-y divide-slate-100">
              {mockInFlightOps.map((op) => (
                <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5 font-mono text-slate-500">{op.id}</td>
                  <td className="px-3 py-1.5 font-medium flex items-center gap-2">
                     <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> {op.client}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${op.segment === 'True Friend' ? 'bg-teal-500' : op.segment === 'Barnacle' ? 'bg-orange-400' : 'bg-slate-300'}`}></span>
                      {op.segment}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${op.risk > 80 ? 'bg-rose-500' : op.risk > 40 ? 'bg-orange-400' : 'bg-emerald-400'}`} style={{width: `${op.risk}%`}}></div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-right">${op.ltv.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-center">
                    <span className="text-[9px] font-mono border border-slate-200 bg-white px-1.5 py-0.5 rounded-sm whitespace-nowrap">{op.action}</span>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-right">${op.cost}</td>
                  <td className="px-3 py-1.5">
                    <div className={`flex items-center gap-1 text-[10px] font-medium
                      ${op.status === 'Running' ? 'text-blue-600' : op.status === 'Success' || op.status === 'Saved' ? 'text-emerald-600' : op.status === 'Churned' ? 'text-rose-600' : 'text-slate-500'}`}>
                      {op.status === 'Running' && <RefreshCw size={10} className="animate-spin" />}
                      {(op.status === 'Success' || op.status === 'Saved') && <CheckCircle size={10} />}
                      {op.status === 'Queued' && <Clock size={10} />}
                      {op.status === 'Churned' && <XCircle size={10} />}
                      {op.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
