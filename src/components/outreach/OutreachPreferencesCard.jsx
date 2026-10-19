import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TONE_OPTIONS, LENGTH_OPTIONS, APPROACH_OPTIONS, CHANNEL_OPTIONS } from '@/lib/outreachPreferences';

// Outreach writing preferences. Persisted by the parent via useOutreachPreferences.
export default function OutreachPreferencesCard({ prefs, setPrefs }) {
  const set = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs">Tone</Label>
            <Select value={prefs.tone} onValueChange={(v) => set('tone', v)}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{TONE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Length</Label>
            <Select value={prefs.length} onValueChange={(v) => set('length', v)}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{LENGTH_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Approach</Label>
            <Select value={prefs.approach} onValueChange={(v) => set('approach', v)}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{APPROACH_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Default channel</Label>
            <Select value={prefs.channel} onValueChange={(v) => set('channel', v)}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{CHANNEL_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label className="text-xs">Your name / agency</Label>
            <Input className="mt-1 text-xs" placeholder="e.g. Andrew" value={prefs.agency_name} onChange={(e) => set('agency_name', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Services you sell</Label>
            <Input className="mt-1 text-xs" placeholder="e.g. web design, SEO" value={prefs.services} onChange={(e) => set('services', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Sign-off name</Label>
            <Input className="mt-1 text-xs" placeholder="e.g. Andrew" value={prefs.sign_off} onChange={(e) => set('sign_off', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Preferred call to action</Label>
            <Input className="mt-1 text-xs" placeholder="e.g. Want a quick chat?" value={prefs.preferred_cta} onChange={(e) => set('preferred_cta', e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <Label className="text-xs">Words / phrases to avoid</Label>
            <Input className="mt-1 text-xs" placeholder="e.g. synergy, revolutionise" value={prefs.avoid_phrases} onChange={(e) => set('avoid_phrases', e.target.value)} />
          </div>
        </div>

        <div>
          <Label className="text-xs">Custom writing instructions</Label>
          <Textarea className="mt-1 text-xs" rows={2} placeholder="Any extra guidance for how your messages should read" value={prefs.custom_instructions} onChange={(e) => set('custom_instructions', e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={prefs.allow_emojis} onCheckedChange={(v) => set('allow_emojis', v)} /> Allow emojis
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={prefs.mention_pricing} onCheckedChange={(v) => set('mention_pricing', v)} /> Mention pricing
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={prefs.offer_free_audit} onCheckedChange={(v) => set('offer_free_audit', v)} /> Offer free audit / review
          </label>
        </div>
      </CardContent>
    </Card>
  );
}