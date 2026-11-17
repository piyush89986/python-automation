import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatusDot } from '../../components/common/StatusDot';
import { InstagramIcon, WhatsAppIcon } from '../../components/common/BrandIcons';
import {
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const ChannelsIntegration: React.FC = () => {
  const [instagramConnected, setInstagramConnected] = useState(true);
  const [whatsappConnected, setWhatsappConnected] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const webhookUrl = `${window.location.origin}/api/v1/meta/webhook`;
  const verifyToken = 'piyush'; // Matches META_WEBHOOK_VERIFY_TOKEN

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <Share2 className="w-6 h-6 text-indigo-400" />
          Omnichannel & Meta Integrations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect your Instagram Business accounts and WhatsApp Cloud numbers via Meta Graph API v21.0.
        </p>
      </div>

      {/* Meta Webhook Endpoint Credentials Card */}
      <Card className="space-y-4 border-indigo-500/30 bg-slate-900/90">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100 text-sm">Meta Developer Webhook Setup</h2>
              <p className="text-xs text-slate-400">Configure these in your Meta App Dashboard</p>
            </div>
          </div>
          <Badge variant="primary" size="sm">
            Meta Graph API v21.0
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Webhook Callback URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 rounded-lg p-2.5 focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                {copiedField === 'url' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Verify Token
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={verifyToken}
                className="w-full bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 rounded-lg p-2.5 focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(verifyToken, 'token')}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                {copiedField === 'token' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instagram */}
        <Card className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <InstagramIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Instagram Messaging</h3>
                <p className="text-xs text-slate-400">Direct Messages & Story Mentions</p>
              </div>
            </div>
            <StatusDot
              status={instagramConnected ? 'active' : 'inactive'}
              label={instagramConnected ? 'Connected' : 'Disconnected'}
            />
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Connected Account:</span>
              <span className="font-mono text-slate-200">@brand_official</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Page ID:</span>
              <span className="font-mono text-slate-200">1797597918285205</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Handlers:</span>
              <span className="text-emerald-400 font-medium">messages, messaging_postbacks</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              variant={instagramConnected ? 'outline' : 'primary'}
              size="sm"
              onClick={() => setInstagramConnected(!instagramConnected)}
            >
              {instagramConnected ? 'Disconnect Account' : 'Connect Instagram'}
            </Button>
            <a
              href="https://developers.facebook.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Meta App Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </Card>

        {/* WhatsApp */}
        <Card className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <WhatsAppIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">WhatsApp Cloud API</h3>
                <p className="text-xs text-slate-400">Official WhatsApp Business Platform</p>
              </div>
            </div>
            <StatusDot
              status={whatsappConnected ? 'active' : 'inactive'}
              label={whatsappConnected ? 'Connected' : 'Disconnected'}
            />
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Business Number:</span>
              <span className="font-mono text-slate-200">+1 (555) 019-2834</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone Number ID:</span>
              <span className="font-mono text-slate-200">104928374829102</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Message Templates:</span>
              <span className="text-emerald-400 font-medium">Synced (4 approved)</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              variant={whatsappConnected ? 'outline' : 'primary'}
              size="sm"
              onClick={() => setWhatsappConnected(!whatsappConnected)}
            >
              {whatsappConnected ? 'Disconnect Number' : 'Connect WhatsApp'}
            </Button>
            <a
              href="https://business.facebook.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Business Manager <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};
