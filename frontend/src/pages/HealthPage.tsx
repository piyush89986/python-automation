import React, { useEffect, useState } from 'react';
import { healthApi } from '../api/health';
import type { HealthResponse } from '../types/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusDot } from '../components/common/StatusDot';
import { Badge } from '../components/common/Badge';
import {
  Activity,
  Database,
  RefreshCw,
  Cpu,
  Clock,
  Server,
  Layers,
} from 'lucide-react';

export const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await healthApi.getHealth();
      setHealth(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to query cluster health:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(fetchHealth, 10000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              System & Cluster Health
            </h1>
            {health && (
              <Badge
                variant={
                  health.status === 'healthy'
                    ? 'success'
                    : health.status === 'degraded'
                    ? 'warning'
                    : 'danger'
                }
              >
                {health.status.toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time backend infrastructure telemetry, database connection pools, and Redis cache.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            Auto-refresh (10s)
          </label>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchHealth}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Status */}
        <Card className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              health?.status === 'healthy'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Cluster Status</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusDot status={health?.status === 'healthy' ? 'healthy' : 'degraded'} />
              <span className="text-lg font-bold text-slate-100 capitalize">
                {health?.status || 'Unknown'}
              </span>
            </div>
          </div>
        </Card>

        {/* Uptime */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">App Uptime</p>
            <p className="text-lg font-bold text-slate-100 mt-0.5">
              {health?.uptime_seconds ? formatUptime(health.uptime_seconds) : '---'}
            </p>
          </div>
        </Card>

        {/* Environment */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Environment</p>
            <p className="text-lg font-bold text-slate-100 capitalize mt-0.5">
              {health?.environment || '---'}
            </p>
          </div>
        </Card>

        {/* Version */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">API Version</p>
            <p className="text-lg font-bold text-slate-100 mt-0.5">
              v{health?.version || '1.0.0'}
            </p>
          </div>
        </Card>
      </div>

      {/* Services Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PostgreSQL Database */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">PostgreSQL (AsyncPG)</h3>
                <p className="text-xs text-slate-400">Primary Relational Storage</p>
              </div>
            </div>
            <StatusDot
              status={health?.services?.database?.status === 'healthy' ? 'healthy' : 'unhealthy'}
              label={health?.services?.database?.status}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">Roundtrip Latency</span>
              <span className="font-mono font-medium text-emerald-400">
                {health?.services?.database?.latency_ms !== undefined
                  ? `${health.services.database.latency_ms} ms`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">Connection Details</span>
              <span className="text-slate-300 text-xs">
                {health?.services?.database?.details || 'Active'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm py-1.5">
              <span className="text-slate-400">Driver</span>
              <span className="text-xs font-mono text-slate-300">postgresql+asyncpg</span>
            </div>
          </div>
        </Card>

        {/* Redis Cache & Queue */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Redis & Celery Queue</h3>
                <p className="text-xs text-slate-400">Cache, Rate Limiter & Async Tasks</p>
              </div>
            </div>
            <StatusDot
              status={health?.services?.redis?.status === 'healthy' ? 'healthy' : 'unhealthy'}
              label={health?.services?.redis?.status}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">Ping Latency</span>
              <span className="font-mono font-medium text-emerald-400">
                {health?.services?.redis?.latency_ms !== undefined
                  ? `${health.services.redis.latency_ms} ms`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">Connection Details</span>
              <span className="text-slate-300 text-xs">
                {health?.services?.redis?.details || 'Active'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm py-1.5">
              <span className="text-slate-400">Celery Broker</span>
              <span className="text-xs font-mono text-slate-300">redis:// (DB 1 & 2)</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-xs text-slate-500 text-right">
        Last ping recorded: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
};
