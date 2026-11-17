import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Server,
  Database,
  Layers,
  ShieldCheck,
  Code2,
  Sparkles,
} from 'lucide-react';

export const SystemOverview: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <Server className="w-6 h-6 text-indigo-400" />
          System Architecture & Control Plane
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete topology of the multi-tenant AI automation backend, micro-services, and cloud endpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* API Gateway */}
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">FastAPI Application</h3>
              <p className="text-xs text-slate-400">Port 8000 &bull; Uvicorn ASGI</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            High performance asynchronous REST API with automatic OpenAPI documentation, CORS middleware,
            and tenant context verification.
          </p>
          <div className="pt-2 flex flex-wrap gap-1.5">
            <Badge variant="neutral" size="sm">v1.0.0</Badge>
            <Badge variant="primary" size="sm">AsyncIO</Badge>
            <Badge variant="info" size="sm">JWT / RBAC</Badge>
          </div>
        </Card>

        {/* Database Layer */}
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">PostgreSQL Engine</h3>
              <p className="text-xs text-slate-400">SQLAlchemy 2.0 AsyncPG</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Relational multi-tenant isolation with connection pooling (Pool Size: 10, Max Overflow: 20).
            Managed schema versions with Alembic.
          </p>
          <div className="pt-2 flex flex-wrap gap-1.5">
            <Badge variant="success" size="sm">Neon Cloud</Badge>
            <Badge variant="neutral" size="sm">Alembic</Badge>
          </div>
        </Card>

        {/* Redis & Workers */}
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Redis & Celery Workers</h3>
              <p className="text-xs text-slate-400">Task Queue & In-Memory Cache</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Asynchronous background workers for Instagram and WhatsApp webhook processing, vector indexing,
            and rate limit throttling.
          </p>
          <div className="pt-2 flex flex-wrap gap-1.5">
            <Badge variant="danger" size="sm">Celery 5.x</Badge>
            <Badge variant="neutral" size="sm">Redis DB 0-2</Badge>
          </div>
        </Card>
      </div>

      {/* AI & Integration Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            AI & Vector Pipeline
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Primary LLM Provider</span>
              <span className="text-slate-200 font-mono text-xs">OpenAI (gpt-4o-mini)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Fallback LLM Provider</span>
              <span className="text-slate-200 font-mono text-xs">Google Gemini (gemini-2.0-flash)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Embedding Model</span>
              <span className="text-slate-200 font-mono text-xs">text-embedding-3-small (1536 dim)</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">Vector Store</span>
              <span className="text-slate-200 font-mono text-xs">Pinecone (Serverless)</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Security & Compliance
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Access Token Expiry</span>
              <span className="text-slate-200 font-mono text-xs">60 minutes</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Refresh Token Window</span>
              <span className="text-slate-200 font-mono text-xs">14 days</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Token Encryption at Rest</span>
              <span className="text-slate-200 font-mono text-xs">Fernet 256-bit AES</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">Tenant Isolation Enforced</span>
              <Badge variant="success" size="sm">Strict RBAC & DB Scoping</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
