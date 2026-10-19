import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Eye, Save, ExternalLink, Monitor } from 'lucide-react';
import { PageHeader, EmptyState, DemoBadge } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const STYLES = ['modern', 'minimal', 'bold', 'elegant', 'playful'];
const PAGE_OPTIONS = ['Home', 'About', 'Services', 'Portfolio', 'Pricing', 'Testimonials', 'Blog', 'Contact', 'Booking'];

export default function Concepts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [bizId, setBizId] = useState('');
  const [style, setStyle] = useState('modern');
  const [pages, setPages] = useState(['Home', 'About', 'Services', 'Contact']);
  const [cta, setCta] = useState('Book Now');
  const [generating, setGenerating] = useState(false);
  const [concept, setConcept] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: businesses } = useQuery({
    queryKey: ['concept-businesses'],
    queryFn: async () => {
      const page = await base44.entities.Business.filter({}, { sort: '-created_date', limit: 200 });
      return page.items || [];
    },
  });

  const { data: concepts } = useQuery({
    queryKey: ['concepts'],
    queryFn: async () => {
      const page = await base44.entities.WebsiteConcept.filter({}, { sort: '-created_date', limit: 50 });
      return page.items || [];
    },
  });

  const selectedBiz = (businesses || []).find((b) => b.id === bizId);

  const togglePage = (p) => setPages((arr) => arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]);

  const generate = async () => {
    if (!selectedBiz) { toast({ title: 'Select a business', variant: 'destructive' }); return; }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateConcept', {
        business: { name: selectedBiz.name, industry: selectedBiz.industry, description: selectedBiz.address },
        style, pages, cta,
      });
      const c = res.data || res;
      if (c.error) throw new Error(c.error);
      setConcept(c);
    } catch (e) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const saveConcept = async () => {
    try {
      await base44.entities.WebsiteConcept.create({
        business_id: selectedBiz?.id, business_name: selectedBiz?.name, industry: selectedBiz?.industry,
        style, pages, hero: concept?.hero, cta, structure: { sections: concept?.sections }, preview_html: concept?.preview_html,
        is_demo: selectedBiz?.is_demo,
      });
      qc.invalidateQueries({ queryKey: ['concepts'] });
      toast({ title: 'Concept saved' });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader title="Website Concepts" description="Generate homepage concepts for prospects. Outputs are unapproved concepts — not the business's official website." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <Label className="text-xs">Business</Label>
              <Select value={bizId} onValueChange={setBizId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a prospect" /></SelectTrigger>
                <SelectContent>{(businesses || []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STYLES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Primary CTA</Label>
                <Input className="mt-1" value={cta} onChange={(e) => setCta(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Recommended pages</Label>
              <div className="flex flex-wrap gap-1.5">
                {PAGE_OPTIONS.map((p) => (
                  <button key={p} onClick={() => togglePage(p)} className={`rounded-full border px-3 py-1 text-xs transition-colors ${pages.includes(p) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>{p}</button>
                ))}
              </div>
            </div>
            <Button onClick={generate} disabled={generating || !selectedBiz} className="w-full">
              {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating concept…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate concept</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Concept</h3>
              {concept && <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setPreviewOpen(true)}><Eye className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={saveConcept}><Save className="h-3.5 w-3.5" /></Button>
              </div>}
            </div>
            {concept ? (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium">Hero</p>
                  <p className="mt-1 text-sm">{concept.hero}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium">Sections</p>
                  <div className="space-y-1.5">
                    {(concept.sections || []).map((s, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
                        <Badge variant="outline" className="text-[10px]">{i + 1}</Badge>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">— {s.purpose}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">⚠ Unapproved concept — not the business's official website.</p>
              </>
            ) : (
              <EmptyState icon={Sparkles} title="No concept yet" description="Select a business and generate a homepage concept." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold">Saved concepts ({(concepts || []).length})</h3>
        {(concepts || []).length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concepts.map((c) => (
              <Card key={c.id} className="cursor-pointer" onClick={() => { setBizId((businesses || []).find((b) => b.id === c.business_id)?.id || ''); setStyle(c.style); setPages(c.pages || []); setCta(c.cta); setConcept({ hero: c.hero, sections: c.structure?.sections, preview_html: c.preview_html }); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between"><p className="font-medium">{c.business_name}</p>{c.is_demo && <DemoBadge />}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.style} · {c.cta}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{c.hero}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No saved concepts yet.</p>}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Monitor className="h-4 w-4" /> Concept preview <Badge variant="outline" className="text-[10px]">Unapproved</Badge></DialogTitle></DialogHeader>
          {concept?.preview_html && (
            <iframe srcDoc={concept.preview_html} title="preview" className="h-[60vh] w-full rounded-lg border border-border" sandbox="allow-same-origin" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}