import React, { useState, useEffect } from 'react';
import {
  Camera,
  Copy,
  Check,
  ShieldCheck,
  Key,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { instagramApi, type InstagramAccountItem } from '../../api/instagram';

export const Settings: React.FC = () => {
  const [accounts, setAccounts] = useState<InstagramAccountItem[]>([]);
  const [tokenInput, setTokenInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const webhookUrl = 'https://python-automation-0g95.onrender.com/api/v1/instagram/webhook';
  const verifyToken = 'piyush';

  const loadAccounts = async () => {
    try {
      const res = await instagramApi.listAccounts();
      if (res.data) {
        setAccounts(res.data);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCopy = (text: string, type: 'url' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || connecting) return;
    setConnecting(true);
    setStatusMessage(null);
    try {
      const res = await instagramApi.exchangeToken(tokenInput.trim());
      if (res.data) {
        setStatusMessage('Successfully linked Meta Account & subscribed Webhooks!');
        setTokenInput('');
        loadAccounts();
      }
    } catch (err: any) {
      setStatusMessage('Error connecting Meta token: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Camera className="w-6 h-6 text-pink-400" />
          <span>Meta & Instagram Graph API Settings</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure your Meta Developer App, Facebook Page access tokens, and webhook subscription handshake.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. Connected Instagram Business Accounts */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Connected Instagram Accounts</span>
          </h2>
          <button
            onClick={loadAccounts}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Refresh accounts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
            No Instagram accounts connected yet. Connect your Meta user token below to link your Business Account.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {acc.profile_picture_url ? (
                      <img src={acc.profile_picture_url} alt={acc.username} className="w-full h-full object-cover" />
                    ) : (
                      acc.username.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">@{acc.username}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">IG ID: {acc.instagram_account_id}</p>
                    <p className="text-[10px] text-slate-500">Page ID: {acc.meta_account_id}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Webhook Callback & Verify Token Card */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-400" />
            <span>Meta Webhook Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Copy these exact values into your Meta Developer App (developers.facebook.com &rarr; Instagram &rarr; Webhooks).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Callback URL */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Callback URL (GET Handshake & POST Events)
            </span>
            <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 border border-slate-800">
              <span className="text-xs text-indigo-300 font-mono truncate select-all">{webhookUrl}</span>
              <button
                onClick={() => handleCopy(webhookUrl, 'url')}
                className="ml-2 p-1 text-slate-400 hover:text-white transition shrink-0"
                title="Copy Webhook URL"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Verify Token */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Verify Token (hub.verify_token)
            </span>
            <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 border border-slate-800">
              <span className="text-xs text-emerald-300 font-mono font-bold select-all">{verifyToken}</span>
              <button
                onClick={() => handleCopy(verifyToken, 'token')}
                className="ml-2 p-1 text-slate-400 hover:text-white transition shrink-0"
                title="Copy Verify Token"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Subscribed Fields Pill List */}
        <div className="pt-2">
          <span className="text-xs font-semibold text-slate-400 block mb-2">Required Subscribed Fields:</span>
          <div className="flex flex-wrap gap-2">
            {['messages', 'messaging_postbacks', 'message_deliveries', 'message_reads', 'comments', 'mentions'].map(
              (f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{f}</span>
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* 3. Connect Meta Account / Token Exchange */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span>Connect Meta Account (Token Exchange)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Input a short-lived User Access Token from Facebook Login or Graph API Explorer. The backend will automatically exchange it for a 60-day Long-Lived Token and permanent Page Access Tokens.
          </p>
        </div>

        <form onSubmit={handleConnectToken} className="space-y-3">
          <div>
            <textarea
              rows={3}
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste Meta User Access Token (EAA...)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center justify-between">
            <a
              href="https://developers.facebook.com/tools/explorer/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Generate token in Meta Graph API Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="submit"
              disabled={connecting || !tokenInput.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{connecting ? 'Exchanging Token...' : 'Connect & Link Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
