import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, Plus, Users, Target, Trash2, X, Loader2 } from 'lucide-react';
import { PageHeader, EmptyState, DemoBadge } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { INDUSTRIES, LEAD_STAGES, stageLabel } from '@/lib/appUtils';

const STATUSES = ['draft', 'active', 'paused', 'completed', 'archived'];

export default function Campaigns() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', objective: '', industry: '', stage: '', status: 'draft' });
  const [selected, setSelected] = useState(null);

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const page = await base44.entities.Campaign.filter({}, { sort: '-created_date', limit: 50 });
      return page.items || [];
    },
  });

  const { data: leads } = useQuery({
    queryKey: ['campaign-leads'],
    queryFn: async () => {
      const page = await base44.entities.Lead.filter({ archived: { $ne: true } }, { sort: '-created_date', limit: 200 });
      return page.items || [];
    },
  });

  const { data: campaignLeads } = useQuery({
    queryKey: ['campaign-leads-list', selected?.id],
    queryFn: async () => {
      if (!selected?.lead_ids?.length) return [];
      const page = await base44.entities.Lead.filter({ id: { $in: selected.lead_ids } }, { limit: 100 });
      return page.items || [];
    },
    enabled: !!selected?.lead_ids?.length,
  });

  const createCampaign = async () => {
    if (!form.name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    try {
      const filters = {};
      if (form.industry) filters.industry = form.industry;
      if (form.stage) filters.stage = form.stage;
      const matched = (leads || []).filter((l) => (!form.industry || l.industry === form.industry) && (!form.stage || l.stage === form.stage));
      await base44.entities.Campaign.create({
        name: form.name, objective: form.objective, target_filters: filters,
        lead_ids: matched.map((l) => l.id), status: form.status,
      });
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setCreating(false);
      setForm({ name: '', objective: '', industry: '', stage: '', status: 'draft' });
      toast({ title: 'Campaign created', description: `${matched.length} leads matched.` });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const setStatus = async (id, status) => {
    try {
      await base44.entities.Campaign.update(id, { status });
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setSelected((s) => s && s.id === id ? { ...s, status } : s);
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const remove = async (id) => {
    try {
      await base44.entities.Campaign.delete(id);
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setSelected(null);
      toast({ title: 'Deleted' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader title="Campaigns" description="Organize prospects into campaigns by industry, city, and website condition. No messages are sent automatically."
        actions={<Button size="sm" onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New campaign</Button>} />

      {!(campaigns || []).length ? (
        <EmptyState icon={Megaphone} title="No campaigns yet" description="Group your leads into targeted outreach campaigns." action={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New campaign</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <p className="font-medium">{c.name}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">{c.status}</Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{c.objective || 'No objective set'}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{(c.lead_ids || []).length} leads</span>
                  {c.is_demo && <DemoBadge />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Campaign detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto scrollbar-thin bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div><h3 className="font-semibold">{selected.name}</h3><p className="text-sm text-muted-foreground">{selected.objective}</p></div>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4">
              <Label className="text-xs">Status</Label>
              <Select value={selected.status} onValueChange={(v) => setStatus(selected.id, v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><Target className="h-3 w-3 text-primary" /> Target filters</p>
              <pre className="rounded-lg border border-border bg-muted/30 p-3 text-xs">{JSON.stringify(selected.target_filters || {}, null, 2)}</pre>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold">Leads ({(campaignLeads || []).length || (selected.lead_ids || []).length})</p>
              <div className="space-y-1.5">
                {(campaignLeads || []).map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                    <span>{l.business_name}</span><Badge variant="outline" className="text-[10px]">{stageLabel(l.stage)}</Badge>
                  </div>
                ))}
                {!campaignLeads?.length && <p className="text-xs text-muted-foreground">No leads in this campaign yet.</p>}
              </div>
            </div>
            <Button variant="destructive" size="sm" className="mt-4" onClick={() => remove(selected.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete campaign</Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>New campaign</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label className="text-xs">Name *</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-xs">Objective</Label><Textarea className="mt-1" rows={2} value={form.objective} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Filter by industry</Label>
                <Select value={form.industry} onValueChange={(v) => setForm((f) => ({ ...f, industry: v === 'all' ? '' : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Any</SelectItem>{INDUSTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Filter by stage</Label>
                <Select value={form.stage} onValueChange={(v) => setForm((f) => ({ ...f, stage: v === 'all' ? '' : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Any</SelectItem>{LEAD_STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button><Button onClick={createCampaign}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}