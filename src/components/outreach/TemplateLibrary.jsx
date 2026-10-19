import { useState, useMemo, useEffect } from 'react';
import { Search, Copy, Star, FileText, Check, Wand2 } from 'lucide-react';
import { BUILTIN_TEMPLATES, TEMPLATE_CATEGORIES, TEMPLATE_CHANNELS, TEMPLATE_TONES } from '@/lib/builtinTemplates';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const FAV_KEY = 'sitescout_template_favorites';
const RECENT_KEY = 'sitescout_template_recent';

function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}
function saveSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* ignore */ }
}
function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(arr) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(arr)); } catch { /* ignore */ }
}

// Normalise an entity PitchTemplate record into the same shape as built-ins.
function normalizeEntity(t) {
  return {
    id: t.id,
    name: t.name,
    category: t.category || 'Custom templates',
    channel: t.channel || 'email',
    tone: t.tone || '',
    message_type: t.message_type || '',
    situation: t.situation || '',
    suitable_business_types: t.suitable_business_types || ['Any'],
    required_evidence: t.required_evidence || 'none',
    subject_template: t.subject_template || '',
    body_template: t.body_template || '',
    recommended_cta: t.recommended_cta || '',
    usage_note: t.usage_note || '',
    is_builtin: false,
    is_fallback: !!t.is_fallback,
    is_custom: !t.is_fallback,
  };
}

// Merge built-in templates with the user's entity templates, de-duplicating by
// name so a fallback entity record never shadows a built-in of the same name.
export function mergeTemplates(customTemplates = []) {
  const builtins = BUILTIN_TEMPLATES.map((t) => ({ ...t, is_custom: false }));
  const customs = (customTemplates || []).map(normalizeEntity);
  const seen = new Set();
  const merged = [];
  for (const t of [...builtins, ...customs]) {
    const key = t.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(t);
  }
  return merged;
}

function SourceBadge({ t }) {
  if (t.is_fallback) return <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400">Fallback</Badge>;
  if (t.is_custom) return <Badge variant="outline" className="text-[10px] border-violet-500/40 text-violet-600 dark:text-violet-400">Custom</Badge>;
  return <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Built-in</Badge>;
}

export default function TemplateLibrary({ customTemplates, onUse, compact = false }) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [tone, setTone] = useState('all');
  const [channel, setChannel] = useState('all');
  const [favOnly, setFavOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [favorites, setFavorites] = useState(loadSet(FAV_KEY));
  const [recent, setRecent] = useState(loadRecent);

  useEffect(() => { saveSet(FAV_KEY, favorites); }, [favorites]);
  useEffect(() => { saveRecent(recent); }, [recent]);

  const all = useMemo(() => mergeTemplates(customTemplates), [customTemplates]);

  const filtered = useMemo(() => {
    return all.filter((t) => {
      if (cat !== 'all' && t.category !== cat && !(cat === 'Custom templates' && t.is_custom)) return false;
      if (tone !== 'all' && t.tone !== tone) return false;
      if (channel !== 'all' && t.channel !== channel) return false;
      if (favOnly && !favorites.has(t.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!`${t.name} ${t.body_template} ${t.subject_template}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [all, cat, tone, channel, favOnly, search, favorites]);

  const selected = filtered.find((t) => t.id === selectedId)
    || all.find((t) => t.id === selectedId)
    || filtered[0]
    || null;

  const toggleFav = (id) => {
    setFavorites((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const copy = (t) => {
    const text = t.subject_template ? `Subject: ${t.subject_template}\n\n${t.body_template}` : t.body_template;
    navigator.clipboard.writeText(text);
    setRecent((r) => [t.id, ...r.filter((x) => x !== t.id)].slice(0, 8));
    toast({ title: 'Template copied', description: 'Placeholders kept for personalisation in Outreach.' });
  };

  const use = (t) => {
    setRecent((r) => [t.id, ...r.filter((x) => x !== t.id)].slice(0, 8));
    if (onUse) onUse(t);
  };

  const channelLabel = (c) => TEMPLATE_CHANNELS.find((x) => x.value === c)?.label || c;
  const toneLabel = (tn) => TEMPLATE_TONES.find((x) => x.value === tn)?.label || tn;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-8 pl-8 text-xs" placeholder="Search templates…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {[...TEMPLATE_CATEGORIES, 'Custom templates'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Tone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tones</SelectItem>
              {TEMPLATE_TONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Channel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              {TEMPLATE_CHANNELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant={favOnly ? 'default' : 'outline'} className="h-8 px-2.5 text-xs" onClick={() => setFavOnly((v) => !v)}>
            <Star className={`mr-1 h-3.5 w-3.5 ${favOnly ? 'fill-current' : ''}`} /> Favourites
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} of {all.length} templates</p>

        <div className="max-h-[560px] space-y-2 overflow-y-auto scrollbar-thin pr-1">
          {filtered.length ? filtered.map((t) => {
            const isFav = favorites.has(t.id);
            const isRecent = recent.includes(t.id);
            const isSel = selected?.id === t.id;
            return (
              <Card key={t.id} className={`cursor-pointer transition ${isSel ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/50'}`} >
                <CardContent className="p-3" onClick={() => setSelectedId(t.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        {isRecent && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" title="Recently used" />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <SourceBadge t={t} />
                        <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                        {t.tone && <Badge variant="outline" className="text-[10px]">{toneLabel(t.tone)}</Badge>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.body_template}</p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleFav(t.id); }} className="shrink-0 rounded p-1 hover:bg-muted" title="Favourite">
                      <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto mb-2 h-6 w-6 opacity-50" />
              No templates match your filters.
            </div>
          )}
        </div>
      </div>

      <div>
        {selected ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">{selected.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <SourceBadge t={selected} />
                    <Badge variant="secondary" className="text-[10px]">{selected.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{channelLabel(selected.channel)}</Badge>
                    {selected.tone && <Badge variant="outline" className="text-[10px]">{toneLabel(selected.tone)}</Badge>}
                  </div>
                </div>
                <button type="button" onClick={() => toggleFav(selected.id)} className="rounded p-1 hover:bg-muted" title="Favourite">
                  <Star className={`h-4 w-4 ${favorites.has(selected.id) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                </button>
              </div>

              {selected.situation && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">When:</span> {selected.situation}</p>}

              {selected.subject_template && (
                <div>
                  <Label className="text-xs">Subject</Label>
                  <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 text-sm">{selected.subject_template}</div>
                </div>
              )}
              <div>
                <Label className="text-xs">Message</Label>
                <pre className="mt-1 max-h-[260px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-2 text-sm leading-relaxed scrollbar-thin">{selected.body_template}</pre>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {selected.suitable_business_types && (
                  <div><span className="text-muted-foreground">Best for:</span> {selected.suitable_business_types.join(', ')}</div>
                )}
                <div><span className="text-muted-foreground">Evidence:</span> {selected.required_evidence === 'none' ? 'None' : selected.required_evidence === 'audit' ? 'Audit required' : 'Verified no-website'}</div>
                {selected.recommended_cta && <div><span className="text-muted-foreground">CTA:</span> {selected.recommended_cta}</div>}
              </div>
              {selected.usage_note && <p className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">{selected.usage_note}</p>}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => copy(selected)}><Copy className="mr-1 h-3.5 w-3.5" /> Copy</Button>
                {onUse && <Button size="sm" onClick={() => use(selected)}><Wand2 className="mr-1 h-3.5 w-3.5" /> Use template</Button>}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-2 h-6 w-6 opacity-50" />
            Select a template to preview it.
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children, className }) {
  return <label className={`text-xs font-medium text-muted-foreground ${className || ''}`}>{children}</label>;
}