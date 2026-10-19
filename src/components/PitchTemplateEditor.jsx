import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PLACEHOLDERS, fillTemplate } from '@/lib/pitchTemplates';
import { INDUSTRIES, MESSAGE_TYPES } from '@/lib/appUtils';
import { Save, X, Eye } from 'lucide-react';

const TONES = ['professional', 'friendly', 'concise', 'persuasive'];
const TYPES = ['Any', ...INDUSTRIES];

const empty = {
  name: '', business_type: 'Any', message_type: 'first_contact',
  tone: 'professional', subject_template: '', body_template: '',
};

export default function PitchTemplateEditor({ template, agency, onSave, onCancel }) {
  const [form, setForm] = useState(() => (template ? {
    name: template.name || '',
    business_type: template.business_type || 'Any',
    message_type: template.message_type || 'first_contact',
    tone: template.tone || 'professional',
    subject_template: template.subject_template || '',
    body_template: template.body_template || '',
  } : { ...empty }));

  const previewCtx = {
    business_name: 'Saffron Bistro',
    industry: 'Restaurants and cafes',
    city: 'Dubai',
    website_url: 'https://example.com',
    agency_name: agency?.name || 'Our Agency',
    agency_website: agency?.website || 'https://agency.example.com',
    agency_services: agency?.services || 'website design, development, and SEO',
    top_issue: 'Page title: Missing page title',
    audit_score: 42,
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const insert = (field, token) => setForm((f) => ({ ...f, [field]: (f[field] || '') + token }));

  const handleSave = async () => {
    await onSave(form);
  };

  const valid = form.name.trim() && form.body_template.trim();

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{template ? 'Edit template' : 'New pitch template'}</h3>
          <Button size="icon" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>

        <div>
          <Label className="text-xs">Template name</Label>
          <Input
            className="mt-1"
            placeholder="e.g. No-website restaurant pitch"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Business type</Label>
            <Select value={form.business_type} onValueChange={(v) => set('business_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Message type</Label>
            <Select value={form.message_type} onValueChange={(v) => set('message_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tone</Label>
            <Select value={form.tone} onValueChange={(v) => set('tone', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Subject template</Label>
          <Input
            className="mt-1"
            placeholder="{{business_name}} — a quick idea for your website"
            value={form.subject_template}
            onChange={(e) => set('subject_template', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs">Body template</Label>
          <Textarea
            className="mt-1"
            rows={8}
            placeholder={'Hi {{business_name}} team,\n\nI noticed...'}
            value={form.body_template}
            onChange={(e) => set('body_template', e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-medium">Insert placeholder into body</p>
          <div className="flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map((p) => (
              <button
                key={p.token}
                type="button"
                onClick={() => insert('body_template', p.token)}
                className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] hover:bg-accent"
                title={`${p.label} — ${p.desc}`}
              >
                {p.token}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {'Tip: use {{business_name}}, {{top_issue}}, and {{audit_score}} to personalize per prospect.'}
          </p>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium">
            <Eye className="h-3.5 w-3.5" /> Live preview
          </p>
          <p className="text-xs font-medium">{fillTemplate(form.subject_template, previewCtx) || '—'}</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
            {fillTemplate(form.body_template, previewCtx) || 'Your message preview will appear here.'}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!valid}>
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}