import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Gauge, Loader2, PlayCircle, FileText, AlertCircle, CheckCircle2, AlertTriangle,
  XCircle, History, Target,
} from 'lucide-react';
import { PageHeader, EmptyState, ScoreRing, DemoBadge } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { scoreOpportunity, statusLabel, statusColor, scoreTone, formatDate } from '@/lib/appUtils';
import { BACKEND_FUNCTIONS_AVAILABLE } from '@/lib/env';
import BackendRestrictionNotice from '@/components/BackendRestrictionNotice';

const SEV = {
  high: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  medium: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  low: { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
};
const STATUS_ICON = { pass: CheckCircle2, fail: XCircle, warning: AlertTriangle };

export default function Audits() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [auditing, setAuditing] = useState(null);
  const [report, setReport] = useState(null);
  const [historyBiz, setHistoryBiz] = useState(null);

  const { data: businesses } = useQuery({
    queryKey: ['audit-businesses'],
    queryFn: async () => {
      const page = await base44.entities.Business.filter({ website_url: { $ne: '' } }, { sort: '-created_date', limit: 100 });
      return page.items || [];
    },
  });

  const { data: audits } = useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const page = await base44.entities.WebsiteAudit.filter({}, { sort: '-created_date', limit: 100 });
      return page.items || [];
    },
  });

  const { data: history } = useQuery({
    queryKey: ['audit-history', historyBiz?.id],
    queryFn: async () => {
      if (!historyBiz) return [];
      const page = await base44.entities.WebsiteAudit.filter({ business_id: historyBiz.id }, { sort: '-audit_timestamp', limit: 20 });
      return page.items || [];
    },
    enabled: !!historyBiz,
  });

  const latestAuditFor = (bizId) => (audits || []).find((a) => a.business_id === bizId);

  const runAudit = async (biz) => {
    if (!BACKEND_FUNCTIONS_AVAILABLE) {
      toast({ title: 'Live audits unavailable', description: 'Backend functions require a Builder+ plan. Saved audits are still viewable.', variant: 'destructive' });
      return;
    }
    setAuditing(biz.id);
    try {
      const res = await base44.functions.invoke('auditWebsite', { url: biz.website_url });
      const a = res.data || res;
      if (a.error) throw new Error(a.error);
      const created = await base44.entities.WebsiteAudit.create({
        business_id: biz.id, business_name: biz.name, website_url: a.website_url,
        overall_score: a.overall_score, performance_score: a.performance_score, mobile_score: a.mobile_score,
        seo_score: a.seo_score, security_score: a.security_score, conversion_score: a.conversion_score,
        accessibility_score: a.accessibility_score, findings: a.findings, suggested_services: a.suggested_services,
        audit_source: a.audit_source, audit_timestamp: a.audit_timestamp, is_demo: biz.is_demo,
      });
      // update business quality score + status + opportunity
      const opp = scoreOpportunity({ ...biz, website_status: 'reachable' }, a);
      await base44.entities.Business.update(biz.id, {
        website_quality_score: a.overall_score,
        website_status: a.overall_score != null ? 'reachable' : biz.website_status,
        opportunity_score: opp.score,
        confidence: opp.confidence,
        suggested_services: a.suggested_services,
      });
      qc.invalidateQueries({ queryKey: ['audits'] });
      qc.invalidateQueries({ queryKey: ['audit-businesses'] });
      setReport({ ...created, note: a.note });
      toast({ title: 'Audit complete', description: `Website quality score: ${a.overall_score}/100` });
    } catch (e) {
      toast({ title: 'Audit failed', description: e.message, variant: 'destructive' });
    } finally {
      setAuditing(null);
    }
  };

  return (
    <div>
      <PageHeader title="Website Audits" description="Run real website audits with server-side checks. Scores are evidence-based, not fabricated." />

      {!(businesses || []).length ? (
        <EmptyState icon={Gauge} title="No businesses with websites yet" description="Discover and save businesses first, then audit their websites here." />
      ) : (
        <>
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold">Saved audits ({(audits || []).length})</h3>
            {(audits || []).length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {audits.slice(0, 9).map((a) => (
                  <Card key={a.id} className="cursor-pointer" onClick={() => setReport(a)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0"><p className="truncate font-medium">{a.business_name}</p><p className="text-xs text-muted-foreground">{formatDate(a.audit_timestamp)}</p></div>
                        <ScoreRing score={a.overall_score} size={48} />
                      </div>
                      {a.is_demo && <div className="mt-2"><DemoBadge /></div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No audits run yet.</p>}
          </div>

          <h3 className="mb-3 text-sm font-semibold">Audit a business</h3>
          <BackendRestrictionNotice
            title="Live audits unavailable on this plan"
            description="Running a new audit uses a Base44 backend function (auditWebsite), which requires a Builder+ plan. Saved audits below remain fully viewable."
            fallback="Fallback: heuristic audits can be run from the server sandbox, or self-host a Lighthouse worker after migration (see MIGRATION.md)."
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(businesses || []).map((biz) => {
              const latest = latestAuditFor(biz.id);
              return (
                <Card key={biz.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{biz.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{biz.website_url}</p>
                        <p className={`mt-1 text-xs ${statusColor(biz.website_status)}`}>{statusLabel(biz.website_status)}</p>
                      </div>
                      {latest && <ScoreRing score={latest.overall_score} size={44} />}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" disabled={auditing === biz.id || !BACKEND_FUNCTIONS_AVAILABLE} onClick={() => runAudit(biz)}>
                        {auditing === biz.id ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Auditing…</> : <><PlayCircle className="mr-1 h-3.5 w-3.5" /> {latest ? 'Re-run' : 'Run audit'}</>}
                      </Button>
                      {latest && <Button size="sm" variant="outline" onClick={() => setReport(latest)}><FileText className="mr-1 h-3.5 w-3.5" /> Report</Button>}
                      {latest && <Button size="sm" variant="ghost" onClick={() => setHistoryBiz(biz)}><History className="h-3.5 w-3.5" /></Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Audit report */}
      <Sheet open={!!report} onOpenChange={(o) => !o && setReport(null)}>
        <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-2xl">
          {report && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">Audit report{report.is_demo && <DemoBadge />}</SheetTitle>
                <SheetDescription>{report.business_name} · {report.website_url}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <ScoreRing score={report.overall_score} size={72} label="Overall" />
                  <div className="grid flex-1 grid-cols-3 gap-2 text-center text-xs">
                    {[['Perf', report.performance_score], ['Mobile', report.mobile_score], ['SEO', report.seo_score], ['Security', report.security_score], ['Conv.', report.conversion_score], ['A11y', report.accessibility_score]].map(([l, v]) => (
                      <div key={l}><p className="text-muted-foreground">{l}</p><p className={`mt-0.5 font-bold ${scoreTone(v)}`}>{v ?? '—'}</p></div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{report.note || 'Score is an assessment based on available checks, not a guarantee of commercial performance.'}</p>

                {report.suggested_services?.length > 0 && (
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold"><Target className="h-3 w-3 text-primary" /> Suggested services</p>
                    <div className="flex flex-wrap gap-1.5">{report.suggested_services.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold">Findings ({(report.findings || []).length})</p>
                  <div className="space-y-2">
                    {(report.findings || []).map((f, i) => {
                      const SIcon = STATUS_ICON[f.status] || AlertCircle;
                      const sev = SEV[f.severity] || SEV.low;
                      return (
                        <div key={i} className="rounded-lg border border-border p-3">
                          <div className="flex items-center gap-2">
                            <SIcon className={`h-4 w-4 ${f.status === 'pass' ? 'text-emerald-500' : f.status === 'warning' ? 'text-amber-500' : 'text-destructive'}`} />
                            <span className="text-sm font-medium">{f.check}</span>
                            <Badge variant="outline" className={`ml-auto text-[10px] ${sev.color}`}>{f.category}</Badge>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">{f.message}</p>
                          {f.recommendation && <p className="mt-1 text-xs text-primary">→ {f.recommendation}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Source: {report.audit_source} · {formatDate(report.audit_timestamp)}</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* History */}
      <Sheet open={!!historyBiz} onOpenChange={(o) => !o && setHistoryBiz(null)}>
        <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-md">
          {historyBiz && (
            <>
              <SheetHeader><SheetTitle>Audit history</SheetTitle><SheetDescription>{historyBiz.name}</SheetDescription></SheetHeader>
              <div className="mt-4 space-y-2">
                {(history || []).length ? history.map((h) => (
                  <button key={h.id} onClick={() => { setReport(h); setHistoryBiz(null); }} className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50">
                    <div><p className="text-sm font-medium">{formatDate(h.audit_timestamp)}</p><p className="text-xs text-muted-foreground">{h.audit_source}</p></div>
                    <ScoreRing score={h.overall_score} size={40} />
                  </button>
                )) : <p className="text-sm text-muted-foreground">No history yet.</p>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}