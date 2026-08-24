import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Cpu, 
  Users, 
  ShieldCheck, 
  Radio,
  Sliders,
  Sparkles,
  Calendar,
  CheckCircle2,
  Zap,
  Settings
} from 'lucide-react';
import { fetchStats } from '../api/client';
import type { StatsResponse } from '../api/client';

export function Layout() {
  const location = useLocation();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [autoPilot, setAutoPilot] = useState(true);

  useEffect(() => {
    fetchStats().then(data => {
      if (data) setStats(data);
    });
  }, []);

  const navItems = [
    { name: 'ROI Analytics', path: '/analytics', icon: <Activity size={16} />, badge: 'Terminal' },
    { name: 'Executive Overview', path: '/', icon: <LayoutDashboard size={16} /> },
    { name: 'Multi-Agent Funnel', path: '/orchestrator', icon: <Cpu size={16} />, badge: '3 Agents' },
    { name: 'Customers & Ops', path: '/customers', icon: <Users size={16} /> },
    { name: 'Rules & Policies', path: '/policies', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-800 font-sans antialiased overflow-hidden selection:bg-teal-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
              <Zap size={15} className="fill-white" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-800 flex items-center gap-1">
                Retention <span className="text-teal-600">AI</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono tracking-tight leading-none">Enterprise Ops</div>
            </div>
          </div>
        </div>

        {/* Navigation Group */}
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-4 pb-1.5">
          Monitoring & Control
        </div>
        <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-100 text-teal-700 font-bold border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-teal-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* AI Model Status Card in Sidebar */}
        <div className="p-3 m-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-[10px]">
              <Radio size={11} className="text-emerald-500 animate-pulse" />
              {stats?.provider || 'OpenRouter Free'}
            </span>
            <span className="text-[9px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
              Active
            </span>
          </div>
          <div className="space-y-0.5 text-[9px] font-mono text-slate-500">
            <div className="flex justify-between">
              <span>Retriever:</span>
              <span className="text-slate-700 font-semibold truncate max-w-[85px]">{stats?.models.retriever || 'openrouter/free'}</span>
            </div>
            <div className="flex justify-between">
              <span>Negotiator:</span>
              <span className="text-slate-700 font-semibold truncate max-w-[85px]">{stats?.models.negotiator || 'openrouter/free'}</span>
            </div>
            <div className="flex justify-between">
              <span>Execution:</span>
              <span className="text-slate-700 font-semibold truncate max-w-[85px]">{stats?.models.execution || 'openrouter/free'}</span>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]">
              SH
            </div>
            <div className="text-[11px] font-semibold text-slate-700 leading-tight">Sarah H.</div>
          </div>
          <Settings size={14} className="cursor-pointer hover:text-slate-700" />
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
        {/* Topbar matching Image 2 */}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1 text-slate-800 font-bold">
              <span className="text-teal-600 font-mono">Retention AI</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-slate-500 text-[11px]">Workspace</span>
              <span className="text-slate-300">›</span>
              <span className="text-slate-900 font-bold">
                {navItems.find((i) => i.path === location.pathname)?.name || 'Command Center'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Live Agent Status */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Agents: 3
            </div>

            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              ⚡ 12ms
            </div>

            {/* Auto-pilot Guardrail Toggle */}
            <button 
              onClick={() => setAutoPilot(!autoPilot)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors ${
                autoPilot 
                  ? 'bg-teal-50 text-teal-700 border-teal-300' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <ShieldCheck size={12} className={autoPilot ? 'text-teal-600' : 'text-slate-400'} />
              {autoPilot ? '🛡️ GUARDRAIL: ON' : 'GUARDRAIL: OFF'}
            </button>

            {/* Date Range Picker */}
            <div className="border border-slate-200 px-2.5 py-1 rounded bg-white shadow-xs flex items-center gap-1.5 text-slate-600 text-[11px] cursor-pointer hover:bg-slate-50">
              <Calendar size={12} className="text-slate-400" />
              <span className="font-semibold">Last 30 Days</span>
            </div>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-[#f8fafc]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
