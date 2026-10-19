import { Loader2, CheckCircle2, Globe, EyeOff, AlertTriangle, Wrench, HelpCircle, XCircle } from 'lucide-react';
import { classLabel, classColor, classBg, classDot } from '@/lib/appUtils';

const COUNT_KEYS = [
  { key: 'discovered', label: 'Discovered', icon: Globe, tone: 'text-muted-foreground' },
  { key: 'deduped', label: 'Deduplicated', icon: CheckCircle2, tone: 'text-emerald-500' },
  { key: 'verified', label: 'Verifications completed', icon: CheckCircle2, tone: 'text-primary' },
  { key: 'found', label: 'Websites found', icon: Globe, tone: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'no_website', label: 'Verified no website', icon: EyeOff, tone: 'text-amber-500' },
  { key: 'needs_review', label: 'Needs review', icon: HelpCircle, tone: 'text-muted-foreground' },
  { key: 'broken', label: 'Broken / inaccessible', icon: AlertTriangle, tone: 'text-destructive' },
  { key: 'needs_improvement', label: 'Needs improvement', icon: Wrench, tone: 'text-blue-500' },
  { key: 'failed', label: 'Failed checks', icon: XCircle, tone: 'text-destructive' },
];

export default function ResearchProgress({ job, verifyingCount }) {
  if (!job) return null;
  const counts = job.counts || {};
  const total = counts.saved || job.business_ids?.length || 0;
  const done = counts.verified || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const running = job.status === 'running';

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          <span className="text-sm font-semibold">{running ? 'Research in progress' : 'Research complete'}</span>
          {job.demo_mode && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">Demo data</span>}
        </div>
        <span className="text-xs text-muted-foreground">{done}/{total} verified ({pct}%)</span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      {verifyingCount > 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground">{verifyingCount} business(es) being verified now…</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {COUNT_KEYS.map((c) => {
          const v = counts[c.key] || 0;
          if (v === 0 && c.key !== 'discovered') return null;
          const Ico = c.icon;
          return (
            <div key={c.key} className="rounded-lg border border-border bg-background/50 p-2">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Ico className={`h-3 w-3 ${c.tone}`} />{c.label}</p>
              <p className="text-lg font-semibold">{v}</p>
            </div>
          );
        })}
      </div>

      {/* Classification breakdown */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Verification status breakdown</p>
        <div className="flex flex-wrap gap-1.5">
          {['website_found', 'verified_no_website', 'needs_checking', 'broken_inaccessible', 'needs_improvement'].map((cl) => {
            const map = { website_found: 'found', verified_no_website: 'no_website', needs_checking: 'needs_review', broken_inaccessible: 'broken', needs_improvement: 'needs_improvement' };
            const v = counts[map[cl]] || 0;
            if (!v) return null;
            return (
              <span key={cl} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs ${classBg(cl)}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${classDot(cl)}`} />
                <span className={classColor(cl)}>{classLabel(cl)}</span>
                <span className="font-semibold">{v}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Source coverage */}
      {job.source_usage && (
        <div className="mt-3 rounded-lg border border-border p-2">
          <p className="mb-1 text-[10px] font-medium text-muted-foreground">Sources searched</p>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {Object.entries(job.source_usage).map(([k, v]) => (
              <span key={k} className="rounded bg-muted px-1.5 py-0.5">
                <span className="font-medium">{k}:</span> <span className="text-muted-foreground">{String(v)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}