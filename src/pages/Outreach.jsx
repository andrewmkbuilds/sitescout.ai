import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Mail, Copy, Save, Send, CheckCircle2, Ban, AlertTriangle, Wand2, Library,
  Settings2, ChevronDown, Sparkles, Info,
} from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { MESSAGE_TYPES } from '@/lib/appUtils';
import { buildContext, resolveTemplate, recommendTemplates, GENERATION_METHODS } from '@/lib/pitchTemplates';
import { useOutreachPreferences, CHANNEL_OPTIONS } from '@/lib/outreachPreferences';
import { BUILTIN_TEMPLATES, TEMPLATE_CHANNELS } from '@/lib/builtinTemplates';
import OutreachPreferencesCard from '@/components/outreach/OutreachPreferencesCard';
import TemplateLibrary from '@/components/outreach/TemplateLibrary';

export default function Outreach() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [prefs, setPrefs] = useOutreachPreferences();
  const [bizId, setBizId] = useState('');
  const [channel, setChannel] = useState(prefs.channel || 'email');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [draft, setDraft] = useState({ subject: '', content: '' });
  const [missingFields, setMissingFields] = useState([]);
  const [method, setMethod] = useState(GENERATION_METHODS.TEMPLATE);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const { data: businesses } = useQuery({
    queryKey: ['outreach-businesses'],
    queryFn: async () => { const p = await base44.entities.Business.filter({}, { sort: '-opportunity_score', limit: 200 }); return p.items || []; },
  });
  const { data: drafts } = useQuery({
    queryKey: ['outreach-drafts'],
    queryFn: async () => { const p = await base44.entities.OutreachDraft.filter({}, { sort: '-created_date', limit: 50 }); return p.items || []; },
  });
  const { data: suppression } = useQuery({
    queryKey: ['suppression'],
    queryFn: async () => { const p = await base44.entities.SuppressionList.filter({}, { limit: 100 }); return p.items || []; },
  });
  const { data: audits } = useQuery({
    queryKey: ['audits-for-outreach'],
    queryFn: async () => { const p = await base44.entities.WebsiteAudit.filter({}, { sort: '-created_date', limit: 100 }); return p.items || []; },
  });
  const { data: customTemplates } = useQuery({
    queryKey: ['pitch-templates'],
    queryFn: async () => { const p = await base44.entities.PitchTemplate.filter({}, { sort: '-created_date', limit: 100 }); return p.items || []; },
  });

  const selectedBiz = (businesses || []).find((b) => b.id === bizId);
  const latestAudit = selectedBiz ? (audits || []).find((a) => a.business_id === selectedBiz.id) : null;
  const isSuppressed = selectedBiz?.email && (suppression || []).some((s) => s.email === selectedBiz.email);

  const allTemplates = useMemo(
    () => [...BUILTIN_TEMPLATES, ...(customTemplates || []).map((t) => ({ ...t, is_custom: !t.is_fallback, is_builtin: false }))],
    [customTemplates]
  );
  const recommended = useMemo(
    () => (selectedBiz ? recommendTemplates(allTemplates, selectedBiz, latestAudit, prefs).slice(0, 6) : []),
    [selectedBiz, allTemplates, latestAudit, prefs]
  );
  const activeTemplate = allTemplates.find((t) => t.id === selectedTemplateId);

  const applyTemplate = (t) => {
    if (!selectedBiz) { toast({ title: 'Select a business first', variant: 'destructive' }); return; }
    const ctx = buildContext(selectedBiz, latestAudit, prefs);
    const r = resolveTemplate(t, ctx);
    setDraft({ subject: r.subject, content: r.content });
    setMissingFields(r.missingFields);
    setMethod(r.method);
    if (t.channel) setChannel(t.channel);
    setSelectedTemplateId(t.id);
    setShowLibrary(false);
    toast({ title: 'Template applied', description: t.name });
  };

  const copy = () => {
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.content}`);
    toast({ title: 'Copied to clipboard' });
  };

  const saveDraft = async () => {
    if (!draft.content) { toast({ title: 'Nothing to save', variant: 'destructive' }); return; }
    try {
      await base44.entities.OutreachDraft.create({
        business_id: selectedBiz?.id,
        business_name: selectedBiz?.name,
        message_type: activeTemplate?.message_type || 'first_contact',
        subject: draft.subject,
        content: draft.content,
        tone: activeTemplate?.tone || prefs.tone,
        is_demo: selectedBiz?.is_demo,
      });
      qc.invalidateQueries({ queryKey: ['outreach-drafts'] });
      toast({ title: 'Draft saved' });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  const logActivity = async (status) => {
    if (!selectedBiz) return;
    try {
      await base44.entities.OutreachActivity.create({
        business_id: selectedBiz.id,
        business_name: selectedBiz.name,
        channel: channel === 'instagram_dm' || channel === 'general_dm' ? 'other' : 'email',
        direction: 'outbound',
        subject: draft.subject,
        content: draft.content,
        status,
        sent_at: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ['outreach-drafts'] });
      toast({ title: 'Logged', description: `Outreach marked as ${status}.` });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Outreach"
        description="Generate personalised, evidence-based outreach from templates. Placeholders fill with each prospect's real data and audit findings — sentences that need missing evidence are removed, never fabricated."
      />

      {/* Preferences */}
      <div className="mb-4">
        <button type="button" onClick={() => setShowPrefs((v) => !v)} className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium">
          <span className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Outreach preferences</span>
          <span className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{CHANNEL_OPTIONS.find((c) => c.value === prefs.channel)?.label || prefs.channel}</Badge>
            <ChevronDown className={`h-4 w-4 transition ${showPrefs ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {showPrefs && <div className="mt-2"><OutreachPreferencesCard prefs={prefs} setPrefs={setPrefs} /></div>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Config */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <Label className="text-xs">Business</Label>
              <Select value={bizId} onValueChange={setBizId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a prospect" /></SelectTrigger>
                <SelectContent>{(businesses || []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name} · {b.industry}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedBiz?.email && isSuppressed && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <Ban className="h-3.5 w-3.5" /> This email is on your suppression list — do not contact.
              </div>
            )}
            <div>
              <Label className="text-xs">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TEMPLATE_CHANNELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {latestAudit && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <p className="font-medium">Using audit findings (score {latestAudit.overall_score}/100)</p>
                <p className="mt-1 text-muted-foreground">{(latestAudit.findings || []).filter((f) => f.status !== 'pass').slice(0, 3).map((f) => f.message).join(' · ')}</p>
              </div>
            )}

            {/* Recommended templates */}
            {selectedBiz ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium"><Sparkles className="h-3.5 w-3.5 text-primary" /> Recommended for this prospect</p>
                {recommended.length ? (
                  <div className="flex flex-wrap gap-2">
                    {recommended.map((t) => (
                      <Button key={t.id} size="sm" variant={selectedTemplateId === t.id ? 'default' : 'outline'} onClick={() => applyTemplate(t)}>
                        <Wand2 className="mr-1 h-3.5 w-3.5" /> {t.name}
                      </Button>
                    ))}
                  </div>
                ) : <p className="text-[11px] text-muted-foreground">No strong matches yet — browse all templates below.</p>}
                <Button size="sm" variant="ghost" className="w-full justify-start text-xs" onClick={() => setShowLibrary((v) => !v)}>
                  <Library className="mr-1 h-3.5 w-3.5" /> Browse all templates
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Select a business to see recommended templates.</p>
            )}

            {showLibrary && (
              <div className="rounded-lg border border-border p-3">
                <TemplateLibrary customTemplates={customTemplates || []} onUse={applyTemplate} compact />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Message</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{method}</Badge>
                {activeTemplate && <Badge variant="outline" className="text-[10px]">{activeTemplate.category}</Badge>}
              </div>
            </div>

            {missingFields.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Missing evidence for: {missingFields.join(', ')}. Sentences needing this data were removed — do not send until you have the real details.</span>
              </div>
            )}

            {draft.content ? (
              <>
                {channel !== 'instagram_dm' && channel !== 'general_dm' && (
                  <div><Label className="text-xs">Subject</Label><Input className="mt-1" value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} /></div>
                )}
                <div><Label className="text-xs">Body</Label><Textarea className="mt-1" rows={10} value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} /></div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={copy}><Copy className="mr-1 h-3.5 w-3.5" /> Copy</Button>
                  <Button size="sm" variant="outline" onClick={saveDraft}><Save className="mr-1 h-3.5 w-3.5" /> Save draft</Button>
                  <Button size="sm" variant="outline" onClick={() => logActivity('sent')}><Send className="mr-1 h-3.5 w-3.5" /> Log as sent</Button>
                  <Button size="sm" variant="outline" onClick={() => logActivity('replied')}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Log reply</Button>
                </div>
                <p className="text-[10px] text-muted-foreground">No messages are sent automatically. Logging records the activity manually.</p>
              </>
            ) : (
              <EmptyState icon={Mail} title="No message yet" description="Select a business and apply a recommended template, or browse all templates." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved drafts */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold">Saved drafts ({(drafts || []).length})</h3>
        {(drafts || []).length ? (
          <div className="space-y-2">
            {drafts.map((d) => (
              <Card key={d.id} className="cursor-pointer" onClick={() => { setBizId((businesses || []).find((b) => b.id === d.business_id)?.id || ''); setDraft({ subject: d.subject, content: d.content }); }}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{d.business_name} — {d.subject}</p>
                    <Badge variant="outline" className="text-[10px]">{MESSAGE_TYPES.find((m) => m.value === d.message_type)?.label || d.message_type}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{d.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No saved drafts yet.</p>}
      </div>
    </div>
  );
}