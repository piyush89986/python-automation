import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  UserCheck,
  Bot,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Tag,
  Phone,
  Mail,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { inboxApi, type ConversationItem, type InboxMessage } from '../../api/inbox';
import { crmApi } from '../../api/crm';

export const Inbox: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [takeoverLoading, setTakeoverLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const loadConversations = async () => {
    try {
      const statusParam = filterStatus === 'ALL' ? undefined : filterStatus;
      const res = await inboxApi.listConversations(statusParam);
      if (res.data) {
        setConversations(res.data);
        if (res.data.length > 0 && !activeConvId) {
          setActiveConvId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await inboxApi.getMessages(convId);
      if (res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 8000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      const interval = setInterval(() => loadMessages(activeConvId), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || sending) return;

    setSending(true);
    try {
      const res = await inboxApi.sendMessage(activeConvId, inputText.trim());
      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
        setInputText('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleToggleTakeover = async () => {
    if (!activeConversation || takeoverLoading) return;
    const nextState = !activeConversation.human_takeover;
    setTakeoverLoading(true);
    try {
      await inboxApi.toggleHumanTakeover(activeConversation.id, nextState);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...c, human_takeover: nextState } : c))
      );
    } catch (err) {
      console.error('Failed to toggle human takeover:', err);
    } finally {
      setTakeoverLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (newStatus: 'LEAD' | 'QUALIFIED' | 'CUSTOMER') => {
    if (!activeConversation?.contact) return;
    try {
      await crmApi.update(activeConversation.contact.id, { lead_status: newStatus });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id && c.contact
            ? { ...c, contact: { ...c.contact, lead_status: newStatus } }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  const handleToggleResolve = async () => {
    if (!activeConversation) return;
    const nextStatus = activeConversation.status === 'OPEN' ? 'RESOLVED' : 'OPEN';
    try {
      await inboxApi.updateStatus(activeConversation.id, nextStatus);
      loadConversations();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.customer_name?.toLowerCase().includes(term) ||
      c.customer_identifier.toLowerCase().includes(term) ||
      c.contact?.ig_username?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* 1. LEFT COLUMN: Conversation Threads */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950/40 shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Live Inbox</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {conversations.length}
              </span>
            </h2>
            <button
              onClick={loadConversations}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition"
              title="Refresh inbox"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Instagram user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 p-1 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
            {(['OPEN', 'RESOLVED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`flex-1 py-1 rounded-md font-medium transition ${
                  filterStatus === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {loading && conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No conversations found</div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              const igName = conv.contact?.ig_username || conv.customer_name || conv.customer_identifier;
              const takeover = conv.human_takeover;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden shadow-inner">
                      {conv.contact?.avatar_url ? (
                        <img
                          src={conv.contact.avatar_url}
                          alt={igName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        igName.slice(0, 2)
                      )}
                    </div>
                    {takeover ? (
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 border-2 border-slate-950 rounded-full"
                        title="Human Takeover Active"
                      />
                    ) : (
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"
                        title="AI Automation Active"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-slate-200 truncate">@{igName}</p>
                      <span className="text-[10px] text-slate-500">
                        {conv.last_message_at
                          ? new Date(conv.last_message_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate">
                        {conv.contact?.full_name || 'Instagram User'}
                      </span>
                      {takeover ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 font-medium">
                          Human
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 font-medium">
                          AI Bot
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: Chat Canvas */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-slate-900/40">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden">
                {activeConversation.contact?.avatar_url ? (
                  <img
                    src={activeConversation.contact.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (activeConversation.contact?.ig_username || activeConversation.customer_identifier).slice(0, 2)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-100 text-sm">
                    @{activeConversation.contact?.ig_username || activeConversation.customer_identifier}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      activeConversation.status === 'OPEN'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {activeConversation.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {activeConversation.contact?.full_name || 'Instagram Direct Customer'}
                </p>
              </div>
            </div>

            {/* HUMAN TAKEOVER TOGGLE SWITCH */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition ${
                  activeConversation.human_takeover
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {activeConversation.human_takeover ? (
                    <UserCheck className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="text-xs font-semibold">
                    {activeConversation.human_takeover ? 'Human Takeover: ON' : 'AI Assistant: ON'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleTakeover}
                  disabled={takeoverLoading}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    activeConversation.human_takeover ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                  title="Toggle Human Takeover to pause or resume AI replies"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      activeConversation.human_takeover ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleToggleResolve}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {activeConversation.status === 'OPEN' ? 'Resolve' : 'Reopen'}
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <Clock className="w-8 h-8 text-slate-600" />
                <span>No messages exchanged in this thread yet.</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.source === 'CUSTOMER';
                const isAI = msg.source === 'AI';
                const isAgent = msg.source === 'AGENT';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                      {isCustomer && (
                        <>
                          <User className="w-3 h-3 text-pink-400" />
                          <span className="font-semibold text-slate-300">
                            @{activeConversation.contact?.ig_username || 'Customer'}
                          </span>
                        </>
                      )}
                      {isAI && (
                        <>
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span className="font-semibold text-indigo-400">AI Sales Agent</span>
                        </>
                      )}
                      {isAgent && (
                        <>
                          <Shield className="w-3 h-3 text-emerald-400" />
                          <span className="font-semibold text-emerald-400">Human Staff</span>
                        </>
                      )}
                      <span>&bull;</span>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Generic Template Carousel Cards Preview */}
                    {msg.message_type === 'generic_template' && msg.payload?.elements ? (
                      <div className="flex gap-3 overflow-x-auto max-w-lg py-1">
                        {msg.payload.elements.map((el: any, idx: number) => (
                          <div
                            key={idx}
                            className="w-48 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shrink-0 shadow-lg"
                          >
                            {el.image_url && (
                              <img
                                src={el.image_url}
                                alt={el.title}
                                className="w-full h-28 object-cover"
                              />
                            )}
                            <div className="p-2.5">
                              <h4 className="font-bold text-white text-xs truncate">{el.title}</h4>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {el.subtitle}
                              </p>
                              {el.buttons?.[0] && (
                                <a
                                  href={el.buttons[0].url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 block text-center py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium transition"
                                >
                                  {el.buttons[0].title || 'View Product'}
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Standard Text Message */
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isCustomer
                            ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/60'
                            : isAI
                            ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/30 rounded-tr-sm'
                            : 'bg-emerald-600 text-white rounded-tr-sm'
                        }`}
                      >
                        {msg.text_content}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Footer / Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={
                activeConversation.human_takeover
                  ? 'Type manual agent message (AI silenced)...'
                  : 'Type message or send command...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
          <Bot className="w-10 h-10 text-slate-600" />
          <span>Select a conversation from the left to start live chatting.</span>
        </div>
      )}

      {/* 3. RIGHT COLUMN: Contact Details & Lead CRM */}
      {activeConversation && activeConversation.contact && (
        <div className="w-72 border-l border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-5 shrink-0 overflow-y-auto">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Customer Profile
            </h4>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mb-2 overflow-hidden shadow-lg">
                {activeConversation.contact.avatar_url ? (
                  <img
                    src={activeConversation.contact.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (activeConversation.contact.ig_username || 'IG').slice(0, 2).toUpperCase()
                )}
              </div>
              <h5 className="font-semibold text-white text-sm">
                @{activeConversation.contact.ig_username}
              </h5>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeConversation.contact.full_name || 'Instagram User'}
              </p>
            </div>
          </div>

          {/* Lead Status Selector */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Lead Stage (CRM)
            </label>
            <select
              value={activeConversation.contact.lead_status}
              onChange={(e) =>
                handleUpdateLeadStatus(e.target.value as 'LEAD' | 'QUALIFIED' | 'CUSTOMER')
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="LEAD">🟡 Cold Lead</option>
              <option value="QUALIFIED">🔵 Qualified Prospect</option>
              <option value="CUSTOMER">🟢 Converted Customer</option>
            </select>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">
                {activeConversation.contact.email || 'No email captured yet'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{activeConversation.contact.phone || 'No phone captured'}</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Tags</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {activeConversation.contact.tags?.length > 0 ? (
                activeConversation.contact.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[11px]"
                  >
                    #{t}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-500">No tags assigned</span>
              )}
            </div>
          </div>

          {/* Instagram Action Button */}
          <div className="mt-auto pt-3 border-t border-slate-800">
            <a
              href={`https://instagram.com/${activeConversation.contact.ig_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Instagram Profile</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
