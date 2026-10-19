import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Search, Save, Upload, Star, MapPin, Globe, Phone, Mail, Filter,
  CheckCircle2, Loader2, FileSpreadsheet, Play, RefreshCw, Eye, AlertCircle,
  Layers, Settings2, ChevronDown, Info,
} from 'lucide-react';
import { PageHeader, EmptyState, DemoBadge } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  INDUSTRIES, classLabel, classColor, classBg, classDot, statusLabel, statusColor,
  scoreTone, formatDate, CLASSIFICATIONS,
} from '@/lib/appUtils';
import ResearchProgress from '@/components/ResearchProgress';
import BusinessDetailDrawer from '@/components/BusinessDetailDrawer';
import { useLocationDiscovery } from '@/hooks/useLocationDiscovery';
import LocationPermissionCard from '@/components/LocationPermissionCard';
import LocationBar from '@/components/LocationBar';

const COUNTRIES = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Egypt', 'Other'];

const SOURCE_OPTIONS = [
  { key: 'listing', label: 'Business listing (Google Places)', hint: 'Check 1' },
  { key: 'web_search', label: 'General web search', hint: 'Check 2' },
  { key: 'instagram', label: 'Instagram profile lookup', hint: 'Check 3' },
  { key: 'x_social', label: 'X / social profiles', hint: 'Check 4' },
  { key: 'directory', label: 'Directory corroboration', hint: 'Check 5a' },
];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const delim = lines[0].includes(',') ? ',' : '\t';
  const headers = lines[0].split(delim).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = line.split(delim);
    const o = {};
    headers.forEach((h, i) => { o[h] = (vals[i] || '').trim(); });
    return o;
  });
}

export default function Discover() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filters, setFilters] = useState({ country: '', city: '', industry: '', name: '', keywords: '' });
  const [sources, setSources] = useState({ listing: true, web_search: true, instagram: true, x_social: true, directory: true });
  const [advanced, setAdvanced] = useState({ max_records: 20, verification_depth: 'standard', min_confidence: 0, include_needs_improvement: true, include_unresolved: true });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [jobId, setJobId] = useState(() => new URLSearchParams(window.location.search).get('job') || '');
  const [job, setJob] = useState(null);
  const [starting, setStarting] = useState(false);
  const [verifying, setVerifying] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [importing, setImporting] = useState(false);
  const verifyingRef = useRef(false);
  const loc = useLocationDiscovery();
  const lastRunKey = useRef('');

  const selectedSources = Object.keys(sources).filter((k) => sources[k]);

  // Load job
  useEffect(() => {
    if (!jobId) { setJob(null); return; }
    let active = true;
    const load = async () => {
      try {
        const j = await base44.entities.ResearchJob.get(jobId);
        if (active) setJob(j);
      } catch (e) { if (active) setJob(null); }
    };
    load();
    const interval = setInterval(load, 2500);
    return () => { active = false; clearInterval(interval); };
  }, [jobId]);

  const { data: savedBiz, refetch } = useQuery({
    queryKey: ['businesses', jobId, classFilter],
    queryFn: async () => {
      const q = {};
      if (jobId) q.research_job_id = jobId;
      if (classFilter) q.website_classification = classFilter;
      const page = await base44.entities.Business.filter(q, { sort: '-created_date', limit: 100 });
      return page.items || [];
    },
  });

  const businesses = savedBiz || [];

  const verifyOne = useCallback(async (id) => {
    setVerifying((s) => new Set(s).add(id));
    try {
      await base44.functions.invoke('verifyBusiness', { business_id: id, sources: selectedSources, auto_audit: true });
    } catch (e) {
      // swallow; job counts failures separately
    } finally {
      setVerifying((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  }, [selectedSources]);

  // Resume / run verification loop
  const runVerifyLoop = useCallback(async (ids) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    const queue = [...ids];
    const concurrency = 3;
    const workers = Array.from({ length: Math.min(concurrency, queue.length) || 0 }, async () => {
      while (queue.length) {
        const id = queue.shift();
        if (!id) continue;
        await verifyOne(id);
        qc.invalidateQueries({ queryKey: ['businesses'] });
      }
    });
    await Promise.all(workers);
    verifyingRef.current = false;
    refetch();
  }, [verifyOne, qc, refetch]);

  // Auto-resume on job load if there are unverified businesses
  useEffect(() => {
    if (!job || job.status !== 'running') return;
    if (verifyingRef.current) return;
    const unverified = businesses.filter((b) => (b.checks_completed || 0) === 0).map((b) => b.id);
    if (unverified.length) runVerifyLoop(unverified);
  }, [job, businesses, runVerifyLoop]);

  // Sync the resolved search area into the visible filter inputs.
  useEffect(() => {
    if (!loc.area) return;
    setFilters((f) => ({ ...f, city: loc.area.city || f.city, country: loc.area.country || f.country }));
  }, [loc.area]);

  // Auto-run discovery once a location is chosen (not on every radius change).
  useEffect(() => {
    if (!loc.area || jobId) return;
    const key = loc.area.label;
    if (lastRunKey.current === key) return;
    lastRunKey.current = key;
    startResearch({ city: loc.area.city, country: loc.area.country, centroid: loc.area.centroid, radius: loc.radius, label: loc.area.label });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.area, jobId]);

  const startResearch = async (locationOverride) => {
    if (!selectedSources.length) { toast({ title: 'Select at least one source', variant: 'destructive' }); return; }
    setStarting(true);
    try {
      const payload = {
        ...filters,
        sources: selectedSources,
        ...advanced,
      };
      if (locationOverride) {
        payload.city = locationOverride.city || payload.city;
        payload.country = locationOverride.country || payload.country;
        if (locationOverride.centroid) {
          payload.lat = locationOverride.centroid.lat;
          payload.lon = locationOverride.centroid.lon;
          payload.radius = locationOverride.radius;
        }
        if (locationOverride.label) payload.location_label = locationOverride.label;
      }
      const res = await base44.functions.invoke('startResearch', payload);
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      const id = data.job_id;
      setJobId(id);
      window.history.replaceState({}, '', `/app/discover?job=${id}`);
      const j = await base44.entities.ResearchJob.get(id);
      setJob(j);
      toast({
        title: data.demo_mode ? 'Demo discovery complete' : 'Discovery complete',
        description: `${data.counts?.saved || 0} businesses saved. Verification starting…`,
      });
      // kick off verification for the returned business ids
      if (data.business_ids?.length) runVerifyLoop(data.business_ids);
    } catch (e) {
      toast({ title: 'Research failed', description: e.message, variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  };

  const reverifyOne = async (id) => {
    setVerifying((s) => new Set(s).add(id));
    try {
      await base44.functions.invoke('verifyBusiness', { business_id: id, sources: selectedSources, auto_audit: true });
      qc.invalidateQueries({ queryKey: ['businesses'] });
      if (jobId) setJob(await base44.entities.ResearchJob.get(jobId).catch(() => job));
      toast({ title: 'Re-verification complete' });
    } catch (e) {
      toast({ title: 'Verification failed', description: e.message, variant: 'destructive' });
    } finally {
      setVerifying((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) { toast({ title: 'CSV empty', variant: 'destructive' }); return; }
      const records = rows.map((r) => ({
        name: r.name || r.business || r.company || '',
        industry: r.industry || r.category || '',
        country: r.country || '',
        city: r.city || r.location || '',
        address: r.address || '',
        website_url: r.website || r.website_url || r.url || '',
        phone: r.phone || r.telephone || '',
        email: r.email || '',
        website_status: r.website_status || (r.website ? 'unverified' : 'no_website_listed'),
        provider: 'csv_import',
        provider_id: `csv-${(r.name || '').toLowerCase().replace(/\s+/g, '-')}-${r.city || ''}`,
        is_demo: false,
        website_classification: 'needs_checking',
        checks_completed: 0,
        verification_checks: [],
        candidate_domains: [],
        source_coverage: {},
      })).filter((r) => r.name);
      const created = await base44.entities.Business.bulkCreate(records);
      qc.invalidateQueries({ queryKey: ['businesses'] });
      toast({ title: 'Import complete', description: `${created.length || records.length} businesses imported.` });
    } catch (err) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const toggleSource = (k) => setSources((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div>
      <PageHeader
        title="Discover Businesses"
        description="Multi-source research and five-check website verification. Discover prospects, verify their online presence, and never mislabel an unverified business."
        actions={
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <Button variant="outline" size="sm" disabled={importing} asChild>
              <span>{importing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…</> : <><Upload className="mr-2 h-4 w-4" /> Import CSV</>}</span>
            </Button>
          </label>
        }
      />

      {/* Real-discovery availability notice */}
      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
        <p className="flex items-center gap-1.5 font-medium"><Info className="h-3.5 w-3.5" /> Real-business discovery needs a plan upgrade</p>
        <p className="mt-1">Discovery and five-check verification run through SiteScout's backend research functions, which require a paid plan that includes backend functions. No businesses will be invented to fill the list — Discovery stays empty until a real provider returns records. Use <strong>Import CSV</strong> to add your own prospects, or upgrade to enable live OpenStreetMap discovery.</p>
      </div>

      {/* Location-aware discovery */}
      {loc.area ? (
        <LocationBar
          loc={loc}
          starting={starting}
          onSearchArea={() => startResearch({ city: loc.area.city, country: loc.area.country, centroid: loc.area.centroid, radius: loc.radius, label: loc.area.label })}
        />
      ) : (
        <LocationPermissionCard loc={loc} />
      )}

      {/* Search panel */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-xs">Country</Label>
              <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v === 'all' ? '' : v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Any</SelectItem>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">City / area</Label>
              <Input className="mt-1" placeholder="e.g. Dubai" value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Industry</Label>
              <Select value={filters.industry} onValueChange={(v) => setFilters((f) => ({ ...f, industry: v === 'all' ? '' : v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Any</SelectItem>{INDUSTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Business name</Label>
              <Input className="mt-1" placeholder="Search name" value={filters.name} onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))} />
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-xs">Keywords (optional, e.g. "without websites", "Instagram only")</Label>
            <Input className="mt-1" placeholder="Additional search terms" value={filters.keywords} onChange={(e) => setFilters((f) => ({ ...f, keywords: e.target.value }))} />
          </div>

          {/* Source selection */}
          <div className="mt-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium"><Layers className="h-3.5 w-3.5" /> Data sources & verification checks</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {SOURCE_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSource(s.key)}
                  className={`flex items-start gap-2 rounded-lg border p-2 text-left text-xs transition ${sources[s.key] ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 opacity-60'}`}
                >
                  <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${sources[s.key] ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                    {sources[s.key] && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="font-medium">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">{s.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div className="mt-3">
            <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Settings2 className="h-3.5 w-3.5" /> Advanced options
              <ChevronDown className={`h-3 w-3 transition ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showAdvanced && (
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <Label className="text-xs">Max records</Label>
                  <Input className="mt-1" type="number" min={1} max={60} value={advanced.max_records} onChange={(e) => setAdvanced((a) => ({ ...a, max_records: Math.min(60, Math.max(1, +e.target.value || 1)) }))} />
                </div>
                <div>
                  <Label className="text-xs">Verification depth</Label>
                  <Select value={advanced.verification_depth} onValueChange={(v) => setAdvanced((a) => ({ ...a, verification_depth: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="thorough">Thorough</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Min confidence</Label>
                  <Input className="mt-1" type="number" min={0} max={100} value={advanced.min_confidence} onChange={(e) => setAdvanced((a) => ({ ...a, min_confidence: Math.min(100, Math.max(0, +e.target.value || 0)) }))} />
                </div>
                <div>
                  <Label className="text-xs">Include needs-improvement</Label>
                  <Select value={advanced.include_needs_improvement ? 'yes' : 'no'} onValueChange={(v) => setAdvanced((a) => ({ ...a, include_needs_improvement: v === 'yes' }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Include unresolved</Label>
                  <Select value={advanced.include_unresolved ? 'yes' : 'no'} onValueChange={(v) => setAdvanced((a) => ({ ...a, include_unresolved: v === 'yes' }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={() => startResearch()} disabled={starting || !selectedSources.length}>
              {starting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting research…</> : <><Play className="mr-2 h-4 w-4" /> Start research & verification</>}
            </Button>
            {!selectedSources.length && <span className="text-xs text-destructive">Select at least one source.</span>}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {job && <div className="mb-4"><ResearchProgress job={job} verifyingCount={verifying.size} /></div>}

      {/* Results */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {jobId ? `Research results (${businesses.length})` : `Saved businesses (${businesses.length})`}
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={classFilter} onValueChange={(v) => setClassFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="All classifications" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classifications</SelectItem>
              {CLASSIFICATIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {businesses.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Business</th>
                <th className="px-3 py-2 text-left font-medium">Location</th>
                <th className="px-3 py-2 text-left font-medium">Classification</th>
                <th className="px-3 py-2 text-left font-medium">Checks</th>
                <th className="px-3 py-2 text-left font-medium">Conf.</th>
                <th className="px-3 py-2 text-left font-medium">Sources</th>
                <th className="px-3 py-2 text-left font-medium">Audit</th>
                <th className="px-3 py-2 text-left font-medium">Opp.</th>
                <th className="px-3 py-2 text-left font-medium">Verified</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => {
                const busy = verifying.has(b.id);
                const cov = b.source_coverage ? Object.keys(b.source_coverage).length : 0;
                return (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{b.name}</span>
                        {b.is_demo && <DemoBadge />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{b.industry}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{b.city}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] ${classBg(b.website_classification)}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${classDot(b.website_classification)}`} />
                        <span className={classColor(b.website_classification)}>{classLabel(b.website_classification)}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{b.checks_completed || 0}/5</td>
                    <td className="px-3 py-2 text-xs">{b.verification_confidence ?? '—'}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{cov}/5</td>
                    <td className={`px-3 py-2 text-xs ${scoreTone(b.website_quality_score)}`}>{b.website_quality_score ?? '—'}</td>
                    <td className={`px-3 py-2 text-xs font-medium ${scoreTone(b.opportunity_score)}`}>{b.opportunity_score ?? '—'}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(b.last_verified)}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelected(b)} title="View verification ledger">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy} onClick={() => reverifyOne(b.id)} title="Re-run verification">
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Search} title="No businesses yet" description="Start a research run above, or import a CSV. Discovery searches all selected, authorized sources and verifies each business through five independent checks." />
      )}

      <BusinessDetailDrawer
        business={businesses.find((b) => b.id === selected?.id) || selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onVerify={reverifyOne}
        verifying={verifying}
      />
    </div>
  );
}