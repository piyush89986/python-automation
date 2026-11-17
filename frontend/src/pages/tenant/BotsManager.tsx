import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input, Select } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { StatusDot } from '../../components/common/StatusDot';
import { InstagramIcon, WhatsAppIcon } from '../../components/common/BrandIcons';
import type { Bot, ChannelPlatform } from '../../types/bot';
import {
  Bot as BotIcon,
  Plus,
  Play,
  Settings2,
  Send,
  Trash2,
} from 'lucide-react';

export const BotsManager: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([
    {
      id: 'bot-1',
      name: 'Instagram Sales & Lead Bot',
      platform: 'instagram',
      status: 'active',
      model: 'gpt-4o-mini',
      temperature: 0.1,
      system_prompt:
        'You are an expert sales assistant for our brand on Instagram. Answer product inquiries, recommend items based on customer preference, and share checkout links politely.',
      rag_enabled: true,
      total_conversations: 1240,
      last_active: '2 mins ago',
    },
    {
      id: 'bot-2',
      name: 'WhatsApp 24/7 Support Bot',
      platform: 'whatsapp',
      status: 'active',
      model: 'gemini-2.0-flash',
      temperature: 0.1,
      system_prompt:
        'You are the official WhatsApp customer support assistant. Help users track their orders, check returns, and resolve technical issues quickly.',
      rag_enabled: true,
      total_conversations: 3820,
      last_active: 'Just now',
    },
  ]);

  // Modals & Chat Simulator state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);

  // Live Simulator state
  const [simulatorBot, setSimulatorBot] = useState<Bot | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am your AI assistant. How can I help you today?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSimulatingResponse, setIsSimulatingResponse] = useState(false);

  const handleOpenEdit = (bot: Bot) => {
    setEditingBot(bot);
    setIsConfigOpen(true);
  };

  const handleSaveBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBot) {
      setBots(bots.map((b) => (b.id === editingBot.id ? editingBot : b)));
    }
    setIsConfigOpen(false);
  };

  const openSimulator = (bot: Bot) => {
    setSimulatorBot(bot);
    setChatMessages([
      {
        sender: 'bot',
        text: `Hello! I am ${bot.name} powered by ${bot.model}. How can I assist you?`,
      },
    ]);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');
    setIsSimulatingResponse(true);

    setTimeout(() => {
      let reply = `Thank you for your message! Based on our knowledge base, I can confirm that your request regarding "${userText.slice(0, 30)}..." is supported with rapid processing.`;
      if (simulatorBot?.platform === 'instagram') {
        reply = `Hey! Thanks for messaging us on Instagram 🛍️. We'd love to help you with that. Can I check your order number or suggest our top trending items?`;
      }
      setChatMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
      setIsSimulatingResponse(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <BotIcon className="w-6 h-6 text-indigo-400" />
            AI Chatbot Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure prompt instructions, language model routing, and test conversation flows.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            const newBot: Bot = {
              id: `bot-${Date.now()}`,
              name: 'New Custom Bot',
              platform: 'instagram',
              status: 'active',
              model: 'gpt-4o-mini',
              temperature: 0.1,
              system_prompt: 'You are a helpful customer assistant.',
              rag_enabled: true,
              total_conversations: 0,
              last_active: 'Never',
            };
            setBots([...bots, newBot]);
            handleOpenEdit(newBot);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Bot
        </Button>
      </div>

      {/* Bots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bots.map((bot) => (
          <Card key={bot.id} className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl ${
                    bot.platform === 'instagram'
                      ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {bot.platform === 'instagram' ? (
                    <InstagramIcon className="w-6 h-6" />
                  ) : (
                    <WhatsAppIcon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{bot.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={bot.platform === 'instagram' ? 'info' : 'success'} size="sm">
                      {bot.platform.toUpperCase()}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {bot.model}
                    </Badge>
                  </div>
                </div>
              </div>

              <StatusDot
                status={bot.status === 'active' ? 'active' : 'inactive'}
                label={bot.status}
              />
            </div>

            {/* Prompt snippet */}
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <p className="text-xs text-slate-400 font-mono line-clamp-2">
                &ldquo;{bot.system_prompt}&rdquo;
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-y border-slate-800/60">
              <div>
                <p className="text-slate-400">Total Chats</p>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {bot.total_conversations.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400">RAG Knowledge</p>
                <p className="font-semibold text-emerald-400 mt-0.5">
                  {bot.rag_enabled ? 'Active' : 'Disabled'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Temperature</p>
                <p className="font-semibold text-slate-200 mt-0.5">{bot.temperature}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSimulator(bot)}
                leftIcon={<Play className="w-3.5 h-3.5 text-indigo-400" />}
              >
                Test Simulator
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenEdit(bot)}
                  leftIcon={<Settings2 className="w-3.5 h-3.5" />}
                >
                  Configure
                </Button>
                <button
                  onClick={() => setBots(bots.filter((b) => b.id !== bot.id))}
                  title="Remove Bot"
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Bot Modal */}
      {editingBot && (
        <Modal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          title={`Configure ${editingBot.name}`}
          subtitle="Customize AI system behavior, model selection, and knowledge retrieval."
          maxWidth="xl"
        >
          <form onSubmit={handleSaveBot} className="space-y-4">
            <Input
              label="Bot Name"
              value={editingBot.name}
              onChange={(e) => setEditingBot({ ...editingBot, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Channel Platform"
                value={editingBot.platform}
                onChange={(e) =>
                  setEditingBot({ ...editingBot, platform: e.target.value as ChannelPlatform })
                }
                options={[
                  { value: 'instagram', label: 'Instagram DM' },
                  { value: 'whatsapp', label: 'WhatsApp Cloud' },
                ]}
              />

              <Select
                label="LLM Model"
                value={editingBot.model}
                onChange={(e) => setEditingBot({ ...editingBot, model: e.target.value })}
                options={[
                  { value: 'gpt-4o-mini', label: 'OpenAI GPT-4o-mini (Default)' },
                  { value: 'gemini-2.0-flash', label: 'Google Gemini 2.0 Flash' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                System Instructions / Prompt
              </label>
              <textarea
                rows={4}
                value={editingBot.system_prompt}
                onChange={(e) => setEditingBot({ ...editingBot, system_prompt: e.target.value })}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                required
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-200">RAG Vector Knowledge Base</p>
                <p className="text-xs text-slate-400">
                  Allow bot to query indexed business documents in Pinecone
                </p>
              </div>
              <input
                type="checkbox"
                checked={editingBot.rag_enabled}
                onChange={(e) => setEditingBot({ ...editingBot, rag_enabled: e.target.checked })}
                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="ghost" type="button" onClick={() => setIsConfigOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Bot Settings
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Live Chat Simulator Modal */}
      {simulatorBot && (
        <Modal
          isOpen={!!simulatorBot}
          onClose={() => setSimulatorBot(null)}
          title={`Live Simulator: ${simulatorBot.name}`}
          subtitle={`Emulates customer interaction on ${simulatorBot.platform.toUpperCase()}`}
          maxWidth="lg"
        >
          <div className="flex flex-col h-[480px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isSimulatingResponse && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-75" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type customer test message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
