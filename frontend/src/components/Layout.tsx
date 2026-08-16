import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Megaphone, Settings, FileSliders, Cpu } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'ROI Analytics', path: '/analytics', icon: <Activity size={18} /> },
    { name: 'Policy Engine', path: '/policies', icon: <FileSliders size={18} /> },
    { name: 'Orchestrator', path: '/orchestrator', icon: <Cpu size={18} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={18} /> },
    { name: 'Campaigns', path: '/campaigns', icon: <Megaphone size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-teal-600 font-bold text-lg tracking-tight">
            <Activity className="text-teal-500" />
            Retention AI
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-6 pt-6 pb-2">
          Workspace
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-slate-100 text-teal-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 mt-auto">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">
              {navItems.find((i) => i.path === location.pathname)?.name || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-teal-600 bg-teal-50 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Agents: 3
            </div>
            <div className="text-slate-500 flex items-center gap-1">
              ⚡ 12ms
            </div>
            <div className="border border-slate-200 px-3 py-1.5 rounded bg-white shadow-sm flex items-center gap-2 cursor-pointer hover:bg-slate-50">
              <span className="text-slate-600">Last 30 Days</span>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
