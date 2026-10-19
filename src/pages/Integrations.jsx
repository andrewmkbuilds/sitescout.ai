import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  MapPin, Gauge, Sparkles, Mail, FileSpreadsheet, Globe, Cpu, Search,
  CheckCircle2, XCircle, AlertCircle, ExternalLink, Loader2, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { BACKEND_FUNCTIONS_AVAILABLE } from '@/lib/env';
import BackendRestrictionNotice from '@/components/BackendRestrictionNotice';

const COST = {
  free_open_source: { label: 'Free & open source', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  free_hosted_limits: { label: 'Free hosted (limits)', cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  optional_self_hosted: { label: 'Optional self-hosted', cls: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  requires_payment: { label: 'Requires payment', cls: 'bg-destructive/15 text-destructive' },
};

const PROVIDERS = [
  {
    key: 'openstreetmap', name: 'Business Discovery — OpenStreetMap / Overpass', icon: MapPin,
    cost: 'free_open_source',
    rateLimit: 'Public Overpass: ~2 req/s, 10,000/day',
    infra: 'None (public) or self-hosted Overpass',
    limits: 'Small interactive queries only; no bulk area-wide extraction',
    secret: 'OVERPASS_ENDPOINT (optional)',
    docs: 'https://wiki.openstreetmap.org/wiki/Overpass_API',
    alwaysOn: true,
  },
  {
    key: 'crawler', name: 'Website Verification Crawler', icon: Globe,
    cost: 'free_open_source',
    rateLimit: 'Conservative — 1 homepage + robots.txt per candidate',
    infra: 'Runs in the Base44 backend (no external service)',
    limits: 'SSRF-protected; respects robots.txt; no login/paywall bypass',
    secret: null, docs: null, alwaysOn: true,
  },
  {
    key: 'searxng', name: 'Web Research — SearXNG', icon: Search,
    cost: 'optional_self_hosted',
    rateLimit: 'Bounded by upstream search engines',
    infra: 'Self-hosted SearXNG instance (open source)',
    limits: 'No unlimited automated queries; disabled until configured',
    secret: 'SEARXNG_URL', docs: 'https://docs.searxng.org/', alwaysOn: false,
  },
  {
    key: 'lighthouse', name: 'Website Audits — Lighthouse (URLpipe)', icon: Gauge,
    cost: 'free_hosted_limits',
    rateLimit: '2 credits/audit · 500 audits/mo free · cache hits free',
    infra: 'URLpipe Lighthouse API (hosted Chromium + Lighthouse 13)',
    limits: 'Lab data only — not real-user Core Web Vitals; cached 7 days',
    secret: 'URLPIPE_API_KEY', docs: 'https://urlpipe.dev/lighthouse-api', alwaysOn: false,
  },
  {
    key: 'ollama', name: 'AI — Ollama (local model)', icon: Sparkles,
    cost: 'optional_self_hosted',
    rateLimit: 'Bounded by your hardware',
    infra: 'Self-hosted Ollama + a local model (e.g. llama3.2)',
    limits: 'Optional; deterministic fallback always available',
    secret: 'OLLAMA_URL', docs: 'https://ollama.com/', alwaysOn: false,
  },
  {
    key: 'ai_deterministic', name: 'AI — Deterministic fallback', icon: Cpu,
    cost: 'free_open_source',
    rateLimit: 'Unlimited',
    infra: 'None — rule-based templates in the backend',
    limits: 'No external calls; never invents findings',
    secret: null, docs: null, alwaysOn: true,
  },
  {
    key: 'csv', name: 'CSV Import & Export', icon: FileSpreadsheet,
    cost: 'free_open_source',
    rateLimit: '—',
    infra: 'None',
    limits: 'Import in Discover; export from Leads',
    secret: null, docs: null, alwaysOn: true,
  },
  {
    key: 'email', name: 'Email Outreach', icon: Mail,
    cost: 'free_hosted_limits',
    rateLimit: 'Platform email limits apply',
    infra: 'Base44 SendEmail (no paid provider required)',
    limits: 'Outreach is logged manually; no automatic paid sending',
    secret: null, docs: null, alwaysOn: true,
  },
];

export default function Integrations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);

  const { data: sourceStatus, refetch } = useQuery({
    queryKey: ['source-status'],
    queryFn: async () => {
      const res = await base44.functions.invoke('checkSources', {});
      return res.data || res;
    },
    enabled: BACKEND_FUNCTIONS_AVAILABLE,
    retry: false,
  });

  const { data: usage } = useQuery({
    queryKey: ['usage-records'],
    queryFn: async () => {
      const res = await base44.entities.UsageRecord.aggregate({ groupBy: 'metric', sum: 'count', sort: '-count' });
      return res.rows || [];
    },
    retry: false,
  });

  const recheck = async () => {
    setChecking(true);
    try { await refetch(); toast({ title: 'Source status refreshed' }); }
    finally { setChecking(false); }
  };

  const STATE_BADGE = {
    connected: { cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', icon: CheckCircle2, label: 'Connected & tested' },
    configuration_required: { cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', icon: AlertCircle, label: 'Configuration required' },
    temporarily_unavailable: { cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', icon: AlertCircle, label: 'Temporarily unavailable' },
    request_failed: { cls: 'bg-destructive/15 text-destructive', icon: XCircle, label: 'Request failed' },
    disabled: { cls: 'bg-muted text-muted-foreground', icon: AlertCircle, label: 'Disabled' },
  };

  const statusFor = (key) => {
    if (!sourceStatus) return null;
    if (key === 'openstreetmap') return sourceStatus.overpass;
    if (key === 'searxng') return sourceStatus.searxng;
    if (key === 'lighthouse') return sourceStatus.lighthouse;
    if (key === 'ollama') return sourceStatus.ollama;
    return null;
  };

  const statusBadge = (key, alwaysOn) => {
    if (alwaysOn && !['searxng', 'lighthouse', 'ollama'].includes(key)) {
      const m = STATE_BADGE.connected;
      return <Badge className={`gap-1 ${m.cls}`}><m.icon className="h-3 w-3" /> {m.label}</Badge>;
    }
    const s = statusFor(key);
    const state = s?.state || 'configuration_required';
    const m = STATE_BADGE[state] || STATE_BADGE.configuration_required;
    return <Badge className={`gap-1 ${m.cls}`}><m.icon className="h-3 w-3" /> {m.label}</Badge>;
  };

  return (
    <div>
      <PageHeader title="Integrations" description="Every source is free or self-hosted open source. No paid API is required for the default workflow — paid dependencies are never enabled automatically." />

      <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
        <p className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" /> Zero-cost default configuration</p>
        <Button size="sm" variant="outline" onClick={recheck} disabled={checking || !BACKEND_FUNCTIONS_AVAILABLE}>
          {checking ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Checking…</> : <><RefreshCw className="mr-1 h-3.5 w-3.5" /> Check sources</>}
        </Button>
      </div>

      <BackendRestrictionNotice
        className="mb-4"
        title="Live source health-check unavailable on this plan"
        description="“Check sources” runs the Base44 backend function checkSources, which requires a Builder+ plan. Source cards below still show their configured/unconfigured state honestly. Free discovery (OpenStreetMap) and heuristic audits remain available."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {PROVIDERS.map((p) => {
          const Ico = p.icon;
          const cost = COST[p.cost];
          return (
            <Card key={p.key}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Ico className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge className={`gap-1 ${cost.cls}`}>{cost.label}</Badge>
                        {statusBadge(p.key, p.alwaysOn)}
                      </div>
                    </div>
                  </div>
                </div>
                <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div><dt className="inline font-medium text-foreground">Rate limits: </dt><dd className="inline">{p.rateLimit}</dd></div>
                  <div><dt className="inline font-medium text-foreground">Infrastructure: </dt><dd className="inline">{p.infra}</dd></div>
                  <div><dt className="inline font-medium text-foreground">Limitations: </dt><dd className="inline">{p.limits}</dd></div>
                </dl>
                {p.secret && <p className="mt-2 rounded-md bg-muted/50 px-2 py-1 font-mono text-[10px] text-muted-foreground">Secret: {p.secret}</p>}
                <div className="mt-3 flex gap-2">
                  {p.docs && <Button size="sm" variant="ghost" asChild><a href={p.docs} target="_blank" rel="noreferrer">Docs <ExternalLink className="ml-1 h-3 w-3" /></a></Button>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold">Cost &amp; Usage summary</h3>
        <Card>
          <CardContent className="p-4">
            {(usage && usage.length) ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-muted-foreground"><th className="pb-2 font-medium">Metric</th><th className="pb-2 font-medium">Calls</th></tr></thead>
                  <tbody>
                    {usage.map((u) => (
                      <tr key={u.metric} className="border-t border-border">
                        <td className="py-1.5 font-mono">{u.metric}</td>
                        <td className="py-1.5">{u.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-muted-foreground">No external calls recorded yet. Usage is tracked locally — no paid credits consumed.</p>}
            <p className="mt-3 text-[11px] text-muted-foreground">
              Only the first three cost classifications (free &amp; open source, free hosted with limits, optional self-hosted) are enabled by default. Paid providers are never enabled automatically.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300">
        <p className="font-medium">Optional services</p>
        <p className="mt-1">Web research (SearXNG) and local AI (Ollama) require your own self-hosted instance. Real Lighthouse audits use the URLpipe API (free tier, no card needed) — set the URLPIPE_API_KEY secret to enable them. Until configured, those checks are honestly marked unavailable and the app falls back to OpenStreetMap discovery, the heuristic crawler, deterministic templates, and heuristic audits — all free. Add the matching secret in your app dashboard's Secrets page to enable each one.</p>
      </div>
    </div>
  );
}