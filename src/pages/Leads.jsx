import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Users, Plus, Search, Download, Archive, Trash2, Mail, X, Loader2,
  GripVertical, StickyNote, ArrowRight, Filter, Wand2, Send, Check,
} from 'lucide-react';
import { PageHeader, EmptyState, DemoBadge } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { LEAD_STAGES, INDUSTRIES, stageLabel, stageColor, formatAED, formatDate, relativeDate, scoreTone } from '@/lib/appUtils';
import { BUILTIN_TEMPLATES } from '@/lib/builtinTemplates';
import { useOutreachPreferences } from '@/lib/outreachPreferences';
import { generateForLeads } from '@/lib/bulkOutreach';
import LeadsSummary from '@/components/leads/LeadsSummary';
import BulkActionBar from '@/components/leads/BulkActionBar';

function exportCSV(leads) {
  const headers = ['business_name', 'industry', 'city', 'website_url', 'stage', 'contact_name', 'contact_email', 'contact_phone', 'deal_value', 'lead_source', 'assigned_to', 'next_follow_up', 'tags'];
  const rows = leads.map((l) => headers.map((h) => {
    const v = l[h];
    if (Array.isArray(v)) return `"${v.join(';')}"`;
    if (v == null) return '';
    return `"${String(v).replace(/"/g, '""')}"`;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'leads.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Leads() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [newLead, setNewLead] = useState({ business_name: '', industry: '', city: '', website_url: '', stage: 'new' });
  const [prefs] = useOutreachPreferences();

  // Data needed for bulk outreach generation: linked businesses, their latest
  // audits, and custom templates merged with the built-in library.
  const { data: businessesRes } = useQuery({
    queryKey: ['leads-businesses'],
    queryFn: async () => { const p = await base44.entities.Business.filter({}, { limit: 200 }); return p.items || []; },
  });
  const { data: auditsRes } = useQuery({
    queryKey: ['leads-audits'],
    queryFn: async () => { const p = await base44.entities.WebsiteAudit.filter({}, { sort: '-created_date', limit: 100 }); return p.items || []; },
  });
  const { data: customTemplates } = useQuery({
    queryKey: ['pitch-templates'],
    queryFn: async () => { const p = await base44.entities.PitchTemplate.filter({}, { sort: '-created_date', limit: 100 }); return p.items || []; },
  });

  const businessesById = Object.fromEntries((businessesRes || []).map((b) => [b.id, b]));
  const auditsByBusinessId = {};
  for (const a of (auditsRes || [])) {
    if (a.business_id && !auditsByBusinessId[a.business_id]) auditsByBusinessId[a.business_id] = a;
  }
  const allTemplates = [
    ...BUILTIN_TEMPLATES,
    ...(customTemplates || []).map((t) => ({ ...t, is_custom: !t.is_fallback, is_builtin: false })),
  ];

  const { data: leadsRes, isLoading } = useQuery({
    queryKey: ['leads', { search, stageFilter }],
    queryFn: async () => {
      const q = {};
      if (stageFilter !== 'all') q.stage = stageFilter;
      if (search) q.business_name = { $regex: search, $options: 'i' };
      const page = await base44.entities.Lead.filter(q, { sort: '-created_date', limit: 200 });
      return page.items || [];
    },
  });
  const leads = leadsRes || [];

  const { data: notes } = useQuery({
    queryKey: ['notes', selected?.id],
    queryFn: async () => {
      if (!selected) return [];
      const page = await base44.entities.Note.filter({ lead_id: selected.id }, { sort: '-created_date', limit: 50 });
      return page.items || [];
    },
    enabled: !!selected,
  });

  const { data: activity } = useQuery({
    queryKey: ['lead-activity', selected?.id],
    queryFn: async () => {
      if (!selected) return [];
      const page = await base44.entities.OutreachActivity.filter({ lead_id: selected.id }, { sort: '-created_date', limit: 50 });
      return page.items || [];
    },
    enabled: !!selected,
  });

  const updateStage = async (id, stage) => {
    try {
      await base44.entities.Lead.update(id, { stage });
      qc.invalidateQueries({ queryKey: ['leads'] });
      if (selected?.id === id) setSelected((s) => ({ ...s, stage }));
      toast({ title: 'Moved', description: `Lead moved to ${stageLabel(stage)}` });
    } catch (e) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
  };

  const onDragEnd = (res) => {
    if (!res.destination) return;
    const id = res.draggableId;
    const stage = res.destination.droppableId;
    updateStage(id, stage);
  };

  const createLead = async () => {
    if (!newLead.business_name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    try {
      await base44.entities.Lead.create({ ...newLead, is_demo: false });
      qc.invalidateQueries({ queryKey: ['leads'] });
      setCreating(false);
      setNewLead({ business_name: '', industry: '', city: '', website_url: '', stage: 'new' });
      toast({ title: 'Lead created' });
    } catch (e) {
      toast({ title: 'Create failed', description: e.message, variant: 'destructive' });
    }
  };

  const saveField = async (field, value) => {
    try {
      await base44.entities.Lead.update(selected.id, { [field]: value });
      setSelected((s) => ({ ...s, [field]: value }));
      qc.invalidateQueries({ queryKey: ['leads'] });
    } catch (e) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
  };

  const addNote = async (content) => {
    if (!content.trim()) return;
    try {
      await base44.entities.Note.create({ lead_id: selected.id, business_id: selected.business_id, content });
      qc.invalidateQueries({ queryKey: ['notes', selected.id] });
      toast({ title: 'Note added' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const archive = async (id) => {
    try {
      await base44.entities.Lead.update(id, { archived: true });
      qc.invalidateQueries({ queryKey: ['leads'] });
      setSelected(null);
      toast({ title: 'Archived' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const remove = async (id) => {
    try {
      await base44.entities.Lead.delete(id);
      qc.invalidateQueries({ queryKey: ['leads'] });
      setSelected(null);
      toast({ title: 'Deleted' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const byStage = (stage) => leads.filter((l) => l.stage === stage && !l.archived);

  const toggleId = (id) => setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const clearSelection = () => setSelectedIds([]);

  const selectedLeads = leads.filter((l) => selectedIds.includes(l.id) && !l.archived);
  const allVisibleIds = leads.filter((l) => !l.archived).map((l) => l.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));

  const runBulk = async (logSent) => {
    if (!selectedLeads.length) return;
    setBulkBusy(true);
    try {
      const { drafts, activities, skipped } = generateForLeads(
        selectedLeads, businessesById, auditsByBusinessId, allTemplates, prefs,
      );
      if (drafts.length) await base44.entities.OutreachDraft.bulkCreate(drafts);
      if (logSent && activities.length) await base44.entities.OutreachActivity.bulkCreate(activities);
      qc.invalidateQueries({ queryKey: ['outreach-drafts'] });
      qc.invalidateQueries({ queryKey: ['lead-activity'] });
      toast({
        title: logSent ? 'Outreach generated & logged' : 'Drafts generated',
        description: `${drafts.length} message${drafts.length === 1 ? '' : 's'} created${logSent ? ' and logged as sent' : ''}${skipped.length ? ` · ${skipped.length} skipped (no fitting template)` : ''}.`,
      });
      clearSelection();
    } catch (e) {
      toast({ title: 'Bulk action failed', description: e.message, variant: 'destructive' });
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Manage your pipeline from new prospect to won client."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportCSV(leads)} disabled={!leads.length}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
            <Button size="sm" onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New lead</Button>
          </>
        }
      />

      <LeadsSummary />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search leads…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-48"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All stages</SelectItem>{LEAD_STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
        <Tabs value={view} onValueChange={setView}>
          <TabsList><TabsTrigger value="kanban">Kanban</TabsTrigger><TabsTrigger value="table">Table</TabsTrigger></TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !leads.length ? (
        <EmptyState icon={Users} title="No leads yet" description="Discover businesses and add them as leads, or create one manually." action={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New lead</Button>} />
      ) : view === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
            {LEAD_STAGES.map((s) => (
              <Droppable key={s.value} droppableId={s.value}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="w-64 shrink-0">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${s.color}`} />{s.label}</span>
                      <span className="text-xs text-muted-foreground">{byStage(s.value).length}</span>
                    </div>
                    <div className="space-y-2 rounded-xl bg-muted/30 p-2 min-h-[60px]">
                      {byStage(s.value).map((l, i) => (
                        <Draggable key={l.id} draggableId={l.id} index={i}>
                          {(p) => (
                            <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} onClick={() => setSelected(l)} className="cursor-pointer rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleId(l.id); }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selectedIds.includes(l.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
                                    aria-label="Select lead"
                                    aria-pressed={selectedIds.includes(l.id)}
                                  >
                                    {selectedIds.includes(l.id) && <Check className="h-3 w-3" />}
                                  </button>
                                  <p className="text-sm font-medium leading-tight">{l.business_name}</p>
                                </div>
                                <GripVertical className="h-3 w-3 text-muted-foreground/40" />
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{l.industry} · {l.city}</p>
                              <div className="mt-2 flex items-center justify-between">
                                {l.deal_value ? <span className="text-xs font-medium">{formatAED(l.deal_value)}</span> : <span />}
                                {l.is_demo && <DemoBadge />}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(allSelected ? [] : allVisibleIds)}
                    className={`flex h-4 w-4 items-center justify-center rounded border ${allSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
                    aria-label="Select all leads"
                    aria-pressed={allSelected}
                  >
                    {allSelected && <Check className="h-3 w-3" />}
                  </button>
                </th>
                <th className="px-3 py-2 text-left font-medium">Business</th>
                <th className="px-3 py-2 text-left font-medium">Industry</th>
                <th className="px-3 py-2 text-left font-medium">Stage</th>
                <th className="px-3 py-2 text-left font-medium">Deal value</th>
                <th className="px-3 py-2 text-left font-medium">Follow-up</th>
                <th className="px-3 py-2 text-left font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {leads.filter((l) => !l.archived).map((l) => (
                <tr key={l.id} className="cursor-pointer border-t border-border hover:bg-muted/40" onClick={() => setSelected(l)}>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleId(l.id)}
                      className={`flex h-4 w-4 items-center justify-center rounded border ${selectedIds.includes(l.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
                      aria-label="Select lead"
                      aria-pressed={selectedIds.includes(l.id)}
                    >
                      {selectedIds.includes(l.id) && <Check className="h-3 w-3" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 font-medium">{l.business_name}{l.is_demo && <span className="ml-2"><DemoBadge /></span>}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.industry}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{stageLabel(l.stage)}</Badge></td>
                  <td className="px-3 py-2">{formatAED(l.deal_value)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{relativeDate(l.next_follow_up)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.assigned_to || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto scrollbar-thin">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">{selected.business_name}{selected.is_demo && <DemoBadge />}</SheetTitle>
                <SheetDescription>{selected.industry} · {selected.city}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Stage</Label>
                    <Select value={selected.stage} onValueChange={(v) => { saveField('stage', v); }}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{LEAD_STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Deal value (AED)</Label>
                    <Input className="mt-1" type="number" defaultValue={selected.deal_value || ''} onBlur={(e) => saveField('deal_value', Number(e.target.value) || null)} />
                  </div>
                  <div>
                    <Label className="text-xs">Contact name</Label>
                    <Input className="mt-1" defaultValue={selected.contact_name || ''} onBlur={(e) => saveField('contact_name', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Contact email</Label>
                    <Input className="mt-1" defaultValue={selected.contact_email || ''} onBlur={(e) => saveField('contact_email', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Assigned to</Label>
                    <Input className="mt-1" defaultValue={selected.assigned_to || ''} onBlur={(e) => saveField('assigned_to', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Next follow-up</Label>
                    <Input className="mt-1" type="date" defaultValue={selected.next_follow_up ? selected.next_follow_up.slice(0, 10) : ''} onBlur={(e) => saveField('next_follow_up', e.target.value || null)} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Tags (comma separated)</Label>
                  <Input className="mt-1" defaultValue={(selected.tags || []).join(', ')} onBlur={(e) => saveField('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />
                </div>

                <div>
                  <Label className="mb-1 flex items-center gap-1.5 text-xs"><StickyNote className="h-3 w-3" /> Notes</Label>
                  <div className="space-y-2">
                    {(notes || []).map((n) => (
                      <div key={n.id} className="rounded-lg border border-border bg-muted/30 p-2 text-xs">
                        <p>{n.content}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(n.created_date)}</p>
                      </div>
                    ))}
                    <NoteInput onAdd={addNote} />
                  </div>
                </div>

                <div>
                  <Label className="mb-1 text-xs">Activity timeline</Label>
                  <div className="space-y-2">
                    {(activity || []).length ? activity.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="flex-1">{a.subject || a.channel}</span>
                        <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                      </div>
                    )) : <p className="text-xs text-muted-foreground">No outreach logged yet.</p>}
                  </div>
                </div>

                <div className="flex gap-2 border-t border-border pt-3">
                  <Button variant="outline" size="sm" onClick={() => archive(selected.id)}><Archive className="mr-2 h-3.5 w-3.5" /> Archive</Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(selected.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create lead dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>New lead</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label className="text-xs">Business name *</Label><Input className="mt-1" value={newLead.business_name} onChange={(e) => setNewLead((n) => ({ ...n, business_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Industry</Label>
                <Select value={newLead.industry} onValueChange={(v) => setNewLead((n) => ({ ...n, industry: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">City</Label><Input className="mt-1" value={newLead.city} onChange={(e) => setNewLead((n) => ({ ...n, city: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Website URL</Label><Input className="mt-1" value={newLead.website_url} onChange={(e) => setNewLead((n) => ({ ...n, website_url: e.target.value }))} /></div>
            <div>
              <Label className="text-xs">Stage</Label>
              <Select value={newLead.stage} onValueChange={(v) => setNewLead((n) => ({ ...n, stage: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={createLead}>Create lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkActionBar
        count={selectedIds.length}
        busy={bulkBusy}
        onGenerate={() => runBulk(false)}
        onLogSent={() => runBulk(true)}
        onClear={clearSelection}
      />
    </div>
  );
}

function NoteInput({ onAdd }) {
  const [text, setText] = useState('');
  return (
    <div className="flex gap-2">
      <Textarea className="text-xs" rows={2} placeholder="Add a note…" value={text} onChange={(e) => setText(e.target.value)} />
      <Button size="sm" variant="outline" onClick={() => { onAdd(text); setText(''); }}>Add</Button>
    </div>
  );
}