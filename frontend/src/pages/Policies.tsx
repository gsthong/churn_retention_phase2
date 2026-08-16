import React, { useState } from 'react';
import { ShieldAlert, Save, RefreshCcw, Check, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

const segmentConfigs = [
  { id: 'true_friends_elite', name: 'True Friends Elite', desc: 'Top 5% LTV, Highly Loyal', riskThreshold: 10 },
  { id: 'true_friends', name: 'True Friends', desc: 'High LTV, High Loyalty', riskThreshold: 15 },
  { id: 'butterflies_whales', name: 'Butterflies Whales', desc: 'Top 5% LTV, Flight Risk', riskThreshold: 40 },
  { id: 'butterflies', name: 'Butterflies', desc: 'High LTV, Low Loyalty', riskThreshold: 40 },
  { id: 'barnacles_heavy', name: 'Barnacles Heavy', desc: 'Low LTV, High Cost to Serve', riskThreshold: 60 },
  { id: 'barnacles', name: 'Barnacles', desc: 'Low LTV, High Loyalty', riskThreshold: 60 },
  { id: 'strangers', name: 'Strangers', desc: 'Low LTV, Low Loyalty', riskThreshold: 100 },
];

const availableActions = [
  { id: 'discount', label: 'Discount Offer', cost: 'High', type: 'financial' },
  { id: 'free_upgrade', label: 'Free Upgrade', cost: 'Medium', type: 'financial' },
  { id: 'priority_support', label: 'Priority Support', cost: 'Low', type: 'service' },
  { id: 'annual_upgrade', label: 'Annual Upgrade Push', cost: 'Negative (Cash flow)', type: 'strategic' },
  { id: 'pause_subscription', label: 'Pause Subscription', cost: 'Zero', type: 'retention' },
  { id: 'feature_education', label: 'Feature Education', cost: 'Zero', type: 'engagement' },
  { id: 'email_only', label: 'Email Only', cost: 'Zero', type: 'engagement' },
  { id: 'no_action', label: 'No Action (Fire Client)', cost: 'Zero', type: 'terminal' },
];

export function Policies() {
  const [selectedSegment, setSelectedSegment] = useState(segmentConfigs[1]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert size={20} className="text-teal-600" />
          Retention Policy Engine
        </h2>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
            <RefreshCcw size={14} /> Revert Defaults
          </button>
          <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-teal-600 rounded shadow-sm hover:bg-teal-700">
            <Save size={14} /> Deploy Ruleset
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Pane: Segments */}
        <div className="w-1/2 flex flex-col bg-white border border-slate-200 rounded-sm overflow-hidden">
          <div className="bg-slate-100 border-b border-slate-200 p-3 text-xs font-bold uppercase tracking-wider text-slate-600">
            Customer Segmentation Rules
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {segmentConfigs.map(seg => (
              <div 
                key={seg.id}
                onClick={() => setSelectedSegment(seg)}
                className={`p-3 rounded border cursor-pointer transition-all flex items-center justify-between
                  ${selectedSegment.id === seg.id ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
              >
                <div>
                  <div className={`text-sm font-bold ${selectedSegment.id === seg.id ? 'text-teal-800' : 'text-slate-800'}`}>{seg.name}</div>
                  <div className="text-[11px] text-slate-500">{seg.desc}</div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Churn Risk</div>
                  <div className="flex items-center gap-2">
                    <input type="range" className="w-20 accent-teal-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" value={seg.riskThreshold} readOnly />
                    <span className="text-xs font-mono font-bold text-slate-700 w-8">{seg.riskThreshold}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Action Mapping */}
        <div className="w-1/2 flex flex-col bg-white border border-slate-200 rounded-sm overflow-hidden">
          <div className="bg-slate-100 border-b border-slate-200 p-3 flex justify-between items-center">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Action Mapping matrix</div>
            <div className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200 uppercase">
              Editing: {selectedSegment.name}
            </div>
          </div>
          
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
             <div className="text-xs text-slate-600">Select the retention plays the AI Negotiator is allowed to use for this segment.</div>
             <div className="text-[10px] flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
               <ShieldCheck size={12}/> Auto-Approve Enabled
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
             <div className="space-y-2">
               {availableActions.map(action => {
                 // Mock which ones are selected based on segment logic
                 let isSelected = false;
                 if (selectedSegment.id.includes('true_friends') && action.cost !== 'Zero') isSelected = true;
                 if (selectedSegment.id.includes('butterflies') && action.id === 'annual_upgrade') isSelected = true;
                 if (selectedSegment.id.includes('butterflies') && action.id === 'discount') isSelected = true;
                 if (selectedSegment.id.includes('barnacles') && action.id === 'pause_subscription') isSelected = true;
                 if (selectedSegment.id.includes('strangers') && action.id === 'no_action') isSelected = true;
                 if (action.id === 'feature_education' || action.id === 'email_only') isSelected = true; // everyone gets cheap stuff

                 return (
                   <label key={action.id} className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${isSelected ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                     <div className="mt-0.5">
                       <input type="checkbox" defaultChecked={isSelected} className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                     </div>
                     <div className="flex-1">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-sm font-bold text-slate-800">{action.label}</span>
                         <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider
                           ${action.cost === 'High' ? 'bg-rose-100 text-rose-700' : action.cost === 'Zero' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                           Cost: {action.cost}
                         </span>
                       </div>
                       <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                         Type: {action.type}
                       </div>
                     </div>
                   </label>
                 )
               })}
             </div>
          </div>
          
          <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
             <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 rounded border border-teal-200 hover:bg-teal-200 transition-colors">
               <Zap size={14} /> Simulate Impact <ArrowRight size={14}/>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
