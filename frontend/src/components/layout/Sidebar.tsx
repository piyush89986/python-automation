import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context';
import {
  Building2,
  Activity,
  Database,
  Settings,
  LayoutDashboard,
  ShieldAlert,
  MessageSquare,
  ShoppingBag,
  Users,
  GitFork,
  Calendar,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isSuperAdmin, isBusinessAdmin, business } = useAuth();

  const superAdminLinks = [
    { to: '/admin/businesses', label: 'Tenants & Orgs', icon: Building2 },
    { to: '/admin/system', label: 'System Overview', icon: Activity },
    { to: '/health', label: 'Cluster Health', icon: ShieldAlert },
  ];

  const tenantLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/inbox', label: 'Live Inbox', icon: MessageSquare },
    { to: '/products', label: 'Product Catalog', icon: ShoppingBag },
    { to: '/crm', label: 'CRM & Leads', icon: Users },
    { to: '/automations', label: 'Automations', icon: GitFork },
    { to: '/publishing', label: 'IG Publishing', icon: Calendar },
    { to: '/knowledge', label: 'Knowledge Base', icon: Database },
    { to: '/settings', label: 'Meta Settings', icon: Settings },
  ];

  const links = isSuperAdmin ? superAdminLinks : tenantLinks;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Tenant context pill for Business Admins */}
        {isBusinessAdmin && business && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Active Tenant
            </p>
            <p className="text-sm font-semibold text-slate-100 truncate mt-0.5">
              {business.name}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-mono">
                {business.plan_tier}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {business.current_month_messages} msgs
              </span>
            </div>
          </div>
        )}

        {/* Super admin context pill */}
        {isSuperAdmin && (
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
              Control Plane
            </p>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">
              Super Administrator
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Multi-Tenant Governance</p>
          </div>
        )}

        {/* Nav Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500">
        <p className="font-medium text-slate-400">Instagram Graph API v21.0</p>
        <p className="text-[11px] mt-0.5">AI Agents &bull; Human Takeover</p>
      </div>
    </aside>
  );
};
