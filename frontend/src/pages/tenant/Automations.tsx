import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  GitFork,
  Save,
  Sparkles,
  ShoppingBag,
  UserCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { automationsApi } from '../../api/automations';

// Initial default node graph matching the e-commerce scenario
const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'default',
    data: {
      label: (
        <div className="p-2 text-left">
          <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>TRIGGER</span>
          </div>
          <div className="text-white font-semibold text-xs">Instagram DM Received</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Event: instagram.dm_received</div>
        </div>
      ),
    },
    position: { x: 50, y: 150 },
    style: {
      background: '#0f172a',
      color: '#fff',
      border: '1px solid #ec4899',
      borderRadius: '12px',
      width: 220,
      boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.2)',
    },
  },
  {
    id: 'condition-1',
    type: 'default',
    data: {
      label: (
        <div className="p-2 text-left">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <GitFork className="w-3.5 h-3.5" />
            <span>INTENT CLASSIFIER</span>
          </div>
          <div className="text-white font-semibold text-xs">Customer Intent AI</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Prompt: Classify (Product Inquiry / Support)</div>
        </div>
      ),
    },
    position: { x: 330, y: 150 },
    style: {
      background: '#0f172a',
      color: '#fff',
      border: '1px solid #f59e0b',
      borderRadius: '12px',
      width: 220,
      boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.2)',
    },
  },
  {
    id: 'action-carousel',
    type: 'default',
    data: {
      label: (
        <div className="p-2 text-left">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>ACTION: CAROUSEL</span>
          </div>
          <div className="text-white font-semibold text-xs">Send Product Cards</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Template: Generic Carousel with Buy URLs</div>
        </div>
      ),
    },
    position: { x: 620, y: 50 },
    style: {
      background: '#0f172a',
      color: '#fff',
      border: '1px solid #6366f1',
      borderRadius: '12px',
      width: 220,
      boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.2)',
    },
  },
  {
    id: 'action-support',
    type: 'default',
    data: {
      label: (
        <div className="p-2 text-left">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ACTION: KNOWLEDGE AI</span>
          </div>
          <div className="text-white font-semibold text-xs">Grounded Return Policy Reply</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Context: Company FAQs & Shipping Rules</div>
        </div>
      ),
    },
    position: { x: 620, y: 220 },
    style: {
      background: '#0f172a',
      color: '#fff',
      border: '1px solid #10b981',
      borderRadius: '12px',
      width: 220,
      boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.2)',
    },
  },
  {
    id: 'action-handover',
    type: 'default',
    data: {
      label: (
        <div className="p-2 text-left">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>ACTION: ESCALATION</span>
          </div>
          <div className="text-white font-semibold text-xs">Human Takeover Handover</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Silence AI & notify owner in Live Inbox</div>
        </div>
      ),
    },
    position: { x: 900, y: 150 },
    style: {
      background: '#0f172a',
      color: '#fff',
      border: '1px solid #06b6d4',
      borderRadius: '12px',
      width: 220,
      boxShadow: '0 10px 25px -5px rgba(6, 182, 212, 0.2)',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'trigger-1', target: 'condition-1', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
  { id: 'e2-3', source: 'condition-1', target: 'action-carousel', label: 'Inquiry', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
  { id: 'e2-4', source: 'condition-1', target: 'action-support', label: 'Support', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e4-5', source: 'action-support', target: 'action-handover', label: 'Complex issue', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
];

export const Automations: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Instagram Sales & Support Flow');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const loadWorkflow = async () => {
    try {
      const res = await automationsApi.list();
      if (res.data && res.data.length > 0) {
        const wf = res.data[0];
        setWorkflowId(wf.id);
        setWorkflowName(wf.name);
        setIsActive(wf.is_active);
      }
    } catch (err) {
      console.error('Failed to load workflow:', err);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (workflowId) {
        await automationsApi.update(workflowId, {
          name: workflowName,
          is_active: isActive,
          nodes_graph: nodes,
          edges_graph: edges,
        });
      } else {
        const res = await automationsApi.create({
          name: workflowName,
          is_active: isActive,
          nodes_graph: nodes,
          edges_graph: edges,
        });
        if (res.data) setWorkflowId(res.data.id);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save workflow:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNode = (type: 'carousel' | 'support' | 'handover') => {
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id,
      position: { x: 300 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        label: (
          <div className="p-2 text-left">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>CUSTOM STEP</span>
            </div>
            <div className="text-white font-semibold text-xs">
              {type === 'carousel'
                ? 'Product Carousel'
                : type === 'support'
                ? 'FAQ Auto-reply'
                : 'Human Takeover Handover'}
            </div>
          </div>
        ),
      },
      style: {
        background: '#0f172a',
        color: '#fff',
        border: '1px solid #6366f1',
        borderRadius: '12px',
        width: 200,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitFork className="w-6 h-6 text-indigo-400" />
            <span>Visual Automation Workflows</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Drag-and-drop node graph that routes Instagram DMs, triggers AI recommendations, or escalates to human agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span>Status:</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-2 py-0.5 rounded font-semibold text-[11px] transition ${
                isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isActive ? 'ACTIVE (LIVE)' : 'PAUSED'}
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Workflow'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main XYFlow Canvas Container */}
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden relative shadow-2xl">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background color="#334155" gap={20} size={1} variant={BackgroundVariant.Dots} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-white [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300" />
          <MiniMap
            nodeColor="#6366f1"
            className="!bg-slate-900 !border-slate-800 !rounded-xl overflow-hidden"
          />

          <Panel position="top-right" className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 backdrop-blur-md flex flex-col gap-1.5 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              + Add Node to Canvas
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleAddNode('carousel')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1 transition"
              >
                <ShoppingBag className="w-3 h-3 text-indigo-400" />
                <span>Carousel</span>
              </button>
              <button
                onClick={() => handleAddNode('support')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>FAQ Reply</span>
              </button>
              <button
                onClick={() => handleAddNode('handover')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1 transition"
              >
                <UserCheck className="w-3 h-3 text-cyan-400" />
                <span>Handover</span>
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
