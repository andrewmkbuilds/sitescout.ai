import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Globe, Phone, Mail, Star, RefreshCw, ShieldCheck, AlertTriangle, Save, Clock,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import VerificationLedger from '@/components/VerificationLedger';
import { classLabel, classColor, classBg, statusLabel, statusColor, formatDate, CLASSIFICATIONS } from '@/lib/appUtils';

export default function BusinessDetailDrawer({ business, open, onOpenChange, onVerify, verifying }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [overrideClass, setOverrideClass] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  if (!business) return null;
  const checks = business.verification_checks || [];
  const busy = verifying?.has(business.id);

  const submitOverride = async () => {
    if (!overrideClass) { toast({ title: 'Select a classification', variant: 'destructive' }); return; }
    setSavingOverride(true);
    try {
      const prev = business.website_classification;
      await base44.entities.Business.update(business.id, {
        website_classification: overrideClass,
        manual_overrides: [...(business.manual_overrides || []), {
          previous_classification: prev, new_classification: overrideClass,
          reason: overrideReason || 'Manual correction', timestamp: new Date().toISOString(),
        }],
      });
      await base44.entities.VerificationOverride.create({
        business_id: business.id, business_name: business.name,
        previous_classification: prev, new_classification: overrideClass,
        reason: overrideReason || 'Manual correction',
      }).catch(() => {});
      qc.invalidateQueries({ queryKey: ['businesses'] });
      toast({ title: 'Classification updated', description: `${business.name} → ${classLabel(overrideClass)}` });
      setOverrideClass(''); setOverrideReason('');
      onOpenChange?.(false);
    } catch (e) {
      toast({ title: 'Override failed', description: e.message, variant: 'destructive' });
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {business.name}
            {business.is_demo && <Badge variant="outline" className="text-[10px]">Demo</Badge>}
          </SheetTitle>
          <SheetDescription>{business.industry} • {business.city}, {business.country}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {/* Classification */}
          <div className={`rounded-lg border p-3 ${classBg(business.website_classification)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Classification</p>
                <p className={`text-sm font-semibold ${classColor(business.website_classification)}`}>
                  {classLabel(business.website_classification)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Checks</p>
                <p className="text-sm font-semibold">{business.checks_completed || 0}/5</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-sm font-semibold">{business.verification_confidence ?? '—'}</p>
              </div>
            </div>
            {business.confirmed_website_url && (
              <a href={business.confirmed_website_url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-primary hover:underline">
                {business.confirmed_website_url}
              </a>
            )}
          </div>

          {business.prospect_scores && (
            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-semibold">Prospect scores</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[['Website opportunity', business.prospect_scores.website_opportunity], ['Identity confidence', business.prospect_scores.identity_confidence], ['Contactability', business.prospect_scores.contactability], ['Data freshness', business.prospect_scores.data_freshness]].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-semibold">{v ?? '—'}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Explainable estimates, not certainties. Confidence is shown separately from opportunity.</p>
            </div>
          )}

          {/* Business details */}
          <div className="grid gap-1.5 rounded-lg border border-border p-3 text-xs">
            <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" />{business.address || `${business.city}, ${business.country}`}</p>
            <p className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-muted-foreground" />{business.website_url || 'No website in listing'}</p>
            {business.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" />{business.phone}</p>}
            {business.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" />{business.email}</p>}
            {business.rating != null && <p className="flex items-center gap-1.5"><Star className="h-3 w-3 text-amber-500" />{business.rating} ({business.review_count || 0} reviews)</p>}
            {business.opening_hours && <p className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-muted-foreground" />{business.opening_hours}</p>}
            <p className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-muted-foreground" />Last verified: {formatDate(business.last_verified)}</p>
            {business.website_quality_score != null && (
              <p className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-muted-foreground" />Audit score: {business.website_quality_score}/100</p>
            )}
          </div>

          {/* Verification ledger */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Website verification ledger</h4>
            <VerificationLedger
              checks={checks}
              candidateDomains={business.candidate_domains}
              classification={business.website_classification}
              confidence={business.verification_confidence}
              independentMechanisms={business.source_coverage ? Object.keys(business.source_coverage).length : 0}
              onRetry={() => onVerify?.(business.id)}
              busy={busy}
            />
          </div>

          {/* Manual override */}
          <div className="rounded-lg border border-border p-3">
            <h4 className="text-sm font-semibold">Manual correction</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">Override the classification. Records user, timestamp, previous and new classification, and reason.</p>
            <div className="mt-2 grid gap-2">
              <Select value={overrideClass} onValueChange={setOverrideClass}>
                <SelectTrigger><SelectValue placeholder="New classification" /></SelectTrigger>
                <SelectContent>
                  {CLASSIFICATIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Reason for correction" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={2} />
              <Button size="sm" disabled={savingOverride} onClick={submitOverride}>
                {savingOverride ? <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
                Save correction
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}