import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings as SettingsIcon, Save, Building2, Target, CreditCard, Palette, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/lib/theme';
import { INDUSTRIES } from '@/lib/appUtils';

const PLANS = {
  starter: { name: 'Starter', price: 99, limits: { searches: 500, audits: 50, ai: 100, seats: 1 } },
  pro: { name: 'Pro', price: 249, limits: { searches: 2500, audits: 250, ai: 500, seats: 3 } },
  agency: { name: 'Agency', price: 599, limits: { searches: 10000, audits: 1000, ai: Infinity, seats: 10 } },
};

export default function Settings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({ name: '', website: '', services: '', target_audience: '', tone: 'professional', pricing: '', portfolio: '', sender_name: '', sender_email: '' });
  const [idealClient, setIdealClient] = useState({ industries: [], min_rating: 4 });
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  useEffect(() => {
    if (user?.agency_profile) setProfile((p) => ({ ...p, ...user.agency_profile }));
    if (user?.ideal_client) setIdealClient((i) => ({ ...i, ...user.ideal_client }));
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ agency_profile: profile, ideal_client: idealClient });
      qc.invalidateQueries({ queryKey: ['me'] });
      toast({ title: 'Settings saved' });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleIndustry = (ind) => setIdealClient((i) => ({ ...i, industries: i.industries.includes(ind) ? i.industries.filter((x) => x !== ind) : [...i.industries, ind] }));

  return (
    <div>
      <PageHeader title="Settings" description="Configure your agency profile, ideal client criteria, plan, and appearance."
        actions={<Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Save className="mr-2 h-4 w-4" /> Save changes</>}</Button>} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-primary" /> Agency profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Agency name</Label><Input className="mt-1" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label className="text-xs">Website</Label><Input className="mt-1" value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Services offered</Label><Textarea className="mt-1" rows={2} value={profile.services} onChange={(e) => setProfile((p) => ({ ...p, services: e.target.value }))} placeholder="Website design, development, SEO…" /></div>
            <div><Label className="text-xs">Target audience</Label><Input className="mt-1" value={profile.target_audience} onChange={(e) => setProfile((p) => ({ ...p, target_audience: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Preferred tone</Label><Input className="mt-1" value={profile.tone} onChange={(e) => setProfile((p) => ({ ...p, tone: e.target.value }))} /></div>
              <div><Label className="text-xs">Pricing range</Label><Input className="mt-1" value={profile.pricing} onChange={(e) => setProfile((p) => ({ ...p, pricing: e.target.value }))} placeholder="AED 5k–50k" /></div>
            </div>
            <div><Label className="text-xs">Portfolio links</Label><Input className="mt-1" value={profile.portfolio} onChange={(e) => setProfile((p) => ({ ...p, portfolio: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Sender name</Label><Input className="mt-1" value={profile.sender_name} onChange={(e) => setProfile((p) => ({ ...p, sender_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Sender email</Label><Input className="mt-1" value={profile.sender_email} onChange={(e) => setProfile((p) => ({ ...p, sender_email: e.target.value }))} /></div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Target className="h-4 w-4 text-primary" /> Ideal client profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="mb-1.5 block text-xs">Target industries</Label>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRIES.map((ind) => (
                    <button key={ind} onClick={() => toggleIndustry(ind)} className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${idealClient.industries.includes(ind) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>{ind.split(' ')[0]}</button>
                  ))}
                </div>
              </div>
              <div><Label className="text-xs">Minimum business rating</Label><Input className="mt-1" type="number" step="0.1" min="0" max="5" value={idealClient.min_rating} onChange={(e) => setIdealClient((i) => ({ ...i, min_rating: Number(e.target.value) }))} /></div>
              <p className="text-[10px] text-muted-foreground">These criteria feed the opportunity scoring engine. Scores are rule-based and explainable — AI never silently changes them.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Palette className="h-4 w-4 text-primary" /> Appearance</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>Light</Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>Dark</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><CreditCard className="h-4 w-4 text-primary" /> Plan & usage</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2"><Badge variant="outline">Current plan: Starter</Badge><Badge variant="outline" className="text-amber-600 dark:text-amber-400">Billing: setup required</Badge></div>
          <p className="mt-2 text-xs text-muted-foreground">Payments and subscriptions activate only after a billing integration is configured and tested. Until then, all plan features are available for evaluation.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {Object.entries(PLANS).map(([k, p]) => (
              <div key={k} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-lg font-bold">AED {p.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  <li>{p.limits.searches.toLocaleString()} searches/mo</li>
                  <li>{p.limits.audits} audits/mo</li>
                  <li>{p.limits.ai === Infinity ? 'Unlimited' : p.limits.ai} AI generations</li>
                  <li>{p.limits.seats} team seats</li>
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}