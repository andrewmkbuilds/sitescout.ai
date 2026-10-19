import {
  ExternalLink, RefreshCw, CheckCircle2, MinusCircle, XCircle, CircleDashed, Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { checkStatusInfo, formatDate } from '@/lib/appUtils';

const ICONS = { CheckCircle2, MinusCircle, XCircle, CircleDashed, Clock };

export default function VerificationLedger({ checks = [], candidateDomains = [], onRetry, busy, classification, confidence, independentMechanisms }) {
  const pad = [...checks];
  while (pad.length < 5) pad.push(null);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Source independence: <strong className="text-foreground">{independentMechanisms || 0}</strong> mechanism(s)</span>
        <span className="text-border">•</span>
        <span>Confidence: <strong className="text-foreground">{confidence != null ? confidence : '—'}</strong></span>
        {onRetry && (
          <Button variant="outline" size="sm" className="ml-auto h-7" disabled={busy} onClick={onRetry}>
            {busy ? <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
            {busy ? 'Re-running…' : 'Re-run all checks'}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {pad.map((c, i) => {
          if (!c) {
            return (
              <div key={i} className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <CircleDashed className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Check {i + 1} — not yet run</span>
                </div>
              </div>
            );
          }
          const info = checkStatusInfo(c.status);
          const Ico = ICONS[info.icon] || CircleDashed;
          return (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{i + 1}. {c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.source}</p>
                </div>
                <Badge variant="outline" className={`gap-1 ${info.color} ${info.bg}`}>
                  <Ico className="h-3 w-3" /> {info.label}
                </Badge>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <p><span className="font-medium text-foreground">Evidence:</span> {c.evidence}</p>
                {c.sourceUrl && (
                  <p className="flex items-center gap-1 truncate">
                    <span className="font-medium text-foreground">Source:</span>
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline truncate">
                      {c.sourceUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </p>
                )}
                <p><span className="font-medium text-foreground">Timestamp:</span> {formatDate(c.timestamp)}</p>
                <p><span className="font-medium text-foreground">Confidence:</span> {c.confidence ?? '—'}</p>
                {c.notes && <p><span className="font-medium text-foreground">Notes:</span> {c.notes}</p>}
                {c.candidateDomains?.length > 0 && (
                  <div>
                    <span className="font-medium text-foreground">Candidate domains:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.candidateDomains.map((d, j) => (
                        <a key={j} href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground hover:bg-muted/70">
                          {d.domain} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {candidateDomains?.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium">All candidate domains ({candidateDomains.length})</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {candidateDomains.map((d, i) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted">
                {d.domain} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}