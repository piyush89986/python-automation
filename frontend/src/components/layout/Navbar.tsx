import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context';
import { healthApi } from '../../api/health';
import type { HealthResponse } from '../../types/api';
import { StatusDot } from '../common/StatusDot';
import { Badge } from '../common/Badge';
import { LogOut, Bot, Server, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, business, logout, isSuperAdmin } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const fetchHealth = () => {
      healthApi
        .getHealth()
        .then((res) => setHealth(res))
        .catch(() => setHealth(null));
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-100 tracking-tight">AutoBot AI</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Multi-Tenant AI Chatbot Platform</p>
          </div>
        </Link>
      </div>

      {/* Center / System Health Indicator */}
      <div className="hidden md:flex items-center gap-3">
        <Link
          to="/health"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
        >
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <StatusDot
            status={
              health?.status === 'healthy'
                ? 'healthy'
                : health?.status === 'degraded'
                ? 'degraded'
                : 'unhealthy'
            }
          />
          <span className="text-slate-300 font-medium">
            System {health?.status || 'connecting...'}
          </span>
          {health?.services?.database && (
            <span className="text-slate-500 text-[10px]">
              DB {health.services.database.latency_ms}ms
            </span>
          )}
        </Link>
      </div>

      {/* User / Actions */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-semibold text-slate-200">{user.full_name}</span>
                {isSuperAdmin ? (
                  <Badge variant="primary" size="sm">
                    Super Admin
                  </Badge>
                ) : (
                  <Badge variant="info" size="sm">
                    Client Admin
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {business ? business.name : user.email}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-4 h-4" />
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
