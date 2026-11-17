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
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { instagramApi, type InstagramAccountItem } from '../../api/instagram';

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export const Settings: React.FC = () => {
  const [accounts, setAccounts] = useState<InstagramAccountItem[]>([]);
  const [tokenInput, setTokenInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualToken, setShowManualToken] = useState(false);

  const appId = import.meta.env.VITE_META_APP_ID || '1797597918285205';
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

    // Initialize Facebook JavaScript SDK
    window.fbAsyncInit = function () {
      if (window.FB) {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v21.0',
        });
        setSdkReady(true);
      }
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.async = true;
      js.defer = true;
      js.onload = () => {
        if (window.FB) {
          window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v21.0',
          });
          setSdkReady(true);
        }
      };
      document.body.appendChild(js);
    } else if (window.FB) {
      setSdkReady(true);
    }
  }, [appId]);

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

  // Direct 1-Click Facebook SDK Login
  const handleFacebookConnect = () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!window.FB) {
      setErrorMessage('Facebook SDK is loading or blocked by ad-blocker. Please disable ad-blocker or use manual token below.');
      return;
    }

    setConnecting(true);
    setStatusMessage('Opening Facebook Login dialog...');

    const requiredScopes = [
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',
    ].join(',');

    window.FB.login(
      async (response: any) => {
        if (response.authResponse?.accessToken) {
          const shortLivedToken = response.authResponse.accessToken;
          setStatusMessage('Permissions approved! Exchanging permanent Page Access Token & linking Instagram account...');

          try {
            const res = await instagramApi.exchangeToken(shortLivedToken);
            if (res.data?.linked_accounts && res.data.linked_accounts.length > 0) {
              const names = res.data.linked_accounts.map((a: any) => `@${a.username}`).join(', ');
              setStatusMessage(`Successfully connected ${names}! Webhooks subscribed.`);
              await loadAccounts();
            } else {
              setStatusMessage(
                'Facebook connected! Note: No Instagram Business Account was detected on your Facebook Page. Please ensure your Instagram is converted to a Professional/Business account and linked to your Facebook Page in Instagram Settings.'
              );
              await loadAccounts();
            }
          } catch (err: any) {
            setErrorMessage(
              'Backend token exchange failed: ' +
                (err.response?.data?.error?.message || err.message)
            );
          } finally {
            setConnecting(false);
          }
        } else {
          setConnecting(false);
          setErrorMessage('Facebook authorization was cancelled or required permissions were rejected.');
        }
      },
      {
        scope: requiredScopes,
        return_scopes: true,
      }
    );
  };

  // Manual token fallback
  const handleManualConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || connecting) return;
    setConnecting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await instagramApi.exchangeToken(tokenInput.trim());
      if (res.data) {
        setStatusMessage('Successfully linked Meta Account & subscribed Webhooks!');
        setTokenInput('');
        loadAccounts();
      }
    } catch (err: any) {
      setErrorMessage(
        'Error connecting Meta token: ' +
          (err.response?.data?.error?.message || err.message)
      );
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
          <span>Meta & Instagram Integration</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect your Facebook account to automatically grant Instagram permissions and link your business profiles.
        </p>
      </div>

      {/* Alerts */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-2.5 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="leading-relaxed">{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* 1. DIRECT 1-CLICK FACEBOOK SDK LOGIN CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-slate-950 p-7 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Official Meta OAuth</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Direct Connect with Facebook SDK
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ek click me Facebook popup khulega. Permissions allow karte hi Meta automatically aapke Facebook Page se linked Instagram Business Account ko fetch karke bot se connect kar dega.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                instagram_manage_messages
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                instagram_manage_comments
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                pages_manage_metadata
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleFacebookConnect}
              disabled={connecting}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#1877F2] hover:bg-[#166fe5] active:scale-95 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition shadow-xl shadow-blue-600/30 cursor-pointer"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting Meta Account...</span>
                </>
              ) : (
                <>
                  {/* Official Facebook F Logo */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Connect with Facebook</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400">
              {sdkReady ? '● Meta SDK Ready (v21.0)' : '○ Loading Meta SDK...'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Connected Instagram Business Accounts */}
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
          <div className="p-8 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400 space-y-2">
            <p>No Instagram accounts connected yet.</p>
            <p className="text-slate-500">
              Click the blue <strong>"Connect with Facebook"</strong> button above to link your Instagram Business Account in 1 click.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 bg-slate-950/80 rounded-xl border border-emerald-500/30 flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {acc.profile_picture_url ? (
                      <img
                        src={acc.profile_picture_url}
                        alt={acc.username}
                        className="w-full h-full object-cover"
                      />
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
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Live Active</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Webhook Callback & Verify Token Card */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-400" />
            <span>Meta Webhook Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ensure these webhook settings are subscribed in your Meta Developer App (developers.facebook.com &rarr; Instagram &rarr; Webhooks).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Callback URL */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Callback URL (GET Handshake & POST Events)
            </span>
            <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 border border-slate-800">
              <span className="text-xs text-indigo-300 font-mono truncate select-all">
                {webhookUrl}
              </span>
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
              <span className="text-xs text-emerald-300 font-mono font-bold select-all">
                {verifyToken}
              </span>
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
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Auto-Subscribed Fields:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              'messages',
              'messaging_postbacks',
              'message_deliveries',
              'message_reads',
              'comments',
              'mentions',
            ].map((f) => (
              <span
                key={f}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{f}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Optional Manual Token Fallback */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowManualToken(!showManualToken)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Key className="w-4 h-4" />
            <span>Advanced / Manual Token Fallback (Graph API Explorer)</span>
          </div>
          {showManualToken ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showManualToken && (
          <form onSubmit={handleManualConnectToken} className="p-5 border-t border-slate-800 space-y-3">
            <p className="text-xs text-slate-400">
              If you prefer pasting an access token generated manually from Meta Graph API Explorer:
            </p>
            <textarea
              rows={2}
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste Meta User Access Token (EAA...)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-indigo-500 focus:outline-none transition"
            />
            <div className="flex items-center justify-between">
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Meta Graph API Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="submit"
                disabled={connecting || !tokenInput.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
              >
                Exchange Token
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
