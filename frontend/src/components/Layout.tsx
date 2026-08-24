import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Settings
} from 'lucide-react';
import { fetchStats } from '../api/client';
import type { StatsResponse } from '../api/client';

export function Layout() {
  const location = useLocation();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [guardrailActive, setGuardrailActive] = useState(true);

  useEffect(() => {
    fetchStats().then(data => {
      if (data) setStats(data);
    });
  }, []);

  const navItems = [
    { name: 'ROI Analytics', path: '/analytics', tag: 'Live' },
    { name: 'Executive Overview', path: '/' },
    { name: 'Workflow Funnel', path: '/orchestrator', tag: '3 Steps' },
    { name: 'Customer Operations', path: '/customers' },
    { name: 'Rules & Guardrails', path: '/policies' },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden selection:bg-slate-800 selection:text-white">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
        {/* Brand Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-white font-mono text-[10px] font-bold">
              R
            </div>
            <div className="font-semibold text-xs tracking-tight text-slate-900 font-mono">
              RETENTION<span className="text-slate-400 font-normal">.SYS</span>
            </div>
          </div>
        </div>

        {/* Navigation Group */}
        <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 px-4 pt-3.5 pb-1">
          Navigation
        </div>
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-slate-800' : 'bg-slate-300'}`}></span>
                  {item.name}
                </span>
                {item.tag && (
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    isActive ? 'bg-slate-200 text-slate-800' : 'text-slate-400'
                  }`}>
                    {item.tag}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Model Spec Box */}
        <div className="p-2.5 m-2 rounded border border-slate-200 bg-slate-50 text-[10px] space-y-1 font-mono">
          <div className="flex items-center justify-between text-slate-700 font-semibold border-b border-slate-200 pb-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {stats?.provider || 'OpenRouter'}
            </span>
            <span className="text-[8.5px] text-slate-400">v2.1</span>
          </div>
          <div className="space-y-0.5 text-[9px] text-slate-500">
            <div className="flex justify-between">
              <span>Retriever:</span>
              <span className="text-slate-700 truncate max-w-[75px]">{stats?.models.retriever || 'openrouter/free'}</span>
            </div>
            <div className="flex justify-between">
              <span>Negotiator:</span>
              <span className="text-slate-700 truncate max-w-[75px]">{stats?.models.negotiator || 'openrouter/free'}</span>
            </div>
            <div className="flex justify-between">
              <span>Execution:</span>
              <span className="text-slate-700 truncate max-w-[75px]">{stats?.models.execution || 'openrouter/free'}</span>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-slate-700 font-mono text-[9px] font-semibold">
              SH
            </div>
            <span className="text-[11px] font-medium text-slate-700">Operator</span>
          </div>
          <Settings size={13} className="text-slate-400 hover:text-slate-700 cursor-pointer" />
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
        {/* Topbar */}
        <header className="h-11 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span className="text-slate-900 font-semibold">WORKSPACE</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">
              {navItems.find((i) => i.path === location.pathname)?.name.toUpperCase() || 'DASHBOARD'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Nodes: 3
            </div>

            <div className="text-[10px] text-slate-400">
              12ms
            </div>

            <button 
              onClick={() => setGuardrailActive(!guardrailActive)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border transition-colors ${
                guardrailActive 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <span>Guardrail:</span>
              <span className="font-bold">{guardrailActive ? 'Enforced' : 'Off'}</span>
            </button>

            <div className="border border-slate-200 px-2 py-0.5 rounded bg-white text-slate-600 text-[10px] flex items-center gap-1">
              <span>Period: 30D</span>
            </div>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <div className="flex-1 overflow-auto p-3.5 bg-[#f8fafc]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
