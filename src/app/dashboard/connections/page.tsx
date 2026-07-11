'use client';

import { useState, useEffect } from 'react';
import { 
  Link2, 
  Copy, 
  Check, 
  HelpCircle, 
  Save, 
  KeyRound, 
  Globe, 
  PhoneCall, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function ConnectionsPage() {
  const [apiUrl, setApiUrl] = useState('https://theaibot.io');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [hasKey, setHasKey] = useState(false);
  
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Generate the webhook URL based on the current domain
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhooks/patient`);
    }

    // Fetch existing connections config
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/connections');
        if (res.ok) {
          const data = await res.json();
          setApiUrl(data.theaibotApiUrl || 'https://theaibot.io');
          setInstanceName(data.theaibotInstanceName || '');
          setHasKey(data.hasKey || false);
          if (data.hasKey) {
            setApiKey(data.theaibotApiKey || '');
          }
        }
      } catch (err) {
        console.error('Failed to load connections configuration:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy webhook link:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teaibotApiUrl: apiUrl,
          teaibotApiKey: apiKey,
          teaibotInstanceName: instanceName
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMsg({ text: 'Connections settings successfully saved!', type: 'success' });
        setHasKey(apiKey !== '' && !apiKey.includes('••••'));
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'An error occurred while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-4 border-t-teal-500 border-r-slate-800 border-slate-800 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading connection configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Link2 className="text-teal-400" size={24} />
          Connections Integration
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure API keys to synchronize data from theaibot and send WhatsApp alerts.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Config Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <KeyRound size={16} className="text-teal-400" />
                theaibot credentials
              </h3>
            </div>

            {msg.text && (
              <div className={`p-4 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                msg.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{msg.text}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* API URL */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                  <Globe size={13} className="text-slate-500" /> theaibot Server URL
                </label>
                <input 
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://theaibot.io"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition text-sm font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Specify the domain name of your theaibot platform. Default is https://theaibot.io.</span>
              </div>

              {/* API Key */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                  <KeyRound size={13} className="text-slate-500" /> Secret API Key
                </label>
                <input 
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasKey ? "••••••••••••" : "Paste your sk_live_... key here"}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition text-sm font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Generate this key in theaibot under Settings &gt; Developers tab.</span>
              </div>

              {/* Instance Name */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                  <PhoneCall size={13} className="text-slate-500" /> WhatsApp Instance Name
                </label>
                <input 
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="e.g. MyWhatsAppInstance"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition text-sm font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">The active WhatsApp instance linked inside your theaibot account.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-700 text-slate-950 font-bold text-sm rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Save size={16} />
              {isSubmitting ? 'Saving settings...' : 'Save Configuration'}
            </button>
          </form>
        </div>

        {/* Right 1 Column: Webhook details */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe size={16} className="text-teal-400" />
              Incoming Webhook
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Copy this URL and paste it inside theaibot Visual Flow Builder Node or Webhook settings to send data here:
            </p>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={webhookUrl} 
                readOnly
                className="flex-1 min-w-0 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono p-2 rounded focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="p-2 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-white rounded border border-teal-500/20 transition flex items-center justify-center shrink-0"
                title="Copy Webhook Link"
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 text-[10px] text-slate-500 leading-relaxed flex flex-col gap-1.5">
              <strong className="text-slate-400 flex items-center gap-1"><HelpCircle size={12} /> Integration Note</strong>
              <p>In theaibot CRM (or custom automation code), trigger a POST request to this URL when a patient contact is created/saved. The dashboard will automatically parse and register them.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
