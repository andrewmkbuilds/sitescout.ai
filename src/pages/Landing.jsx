import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Search, Gauge, Target, Mail, Users, ShieldCheck, Sparkles, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import MarketingNav from '@/components/MarketingNav';
import MarketingFooter from '@/components/MarketingFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { AUTH_ENABLED } from '@/lib/authMode';

const features = [
  { icon: Search, title: 'Business Discovery', desc: 'Find local businesses by industry, city, and website status — no website, broken site, or needs an audit.' },
  { icon: Gauge, title: 'Website Intelligence', desc: 'Audit performance, mobile, SEO, security, accessibility, and conversion readiness with evidence-backed findings.' },
  { icon: Target, title: 'Opportunity Scoring', desc: 'A transparent, explainable score separates real prospects from noise using your ideal-client criteria.' },
  { icon: Mail, title: 'AI Outreach', desc: 'Generate personalized, evidence-based pitches — never invented relationships or fabricated metrics.' },
  { icon: Users, title: 'Lead Management', desc: 'A full CRM pipeline with table and Kanban views, assignments, follow-ups, and deal tracking.' },
  { icon: ShieldCheck, title: 'Team & Security', desc: 'Organization isolation, roles, audit logs, and server-side authorization keep client data private.' },
];

const steps = [
  { n: '01', title: 'Discover', desc: 'Search for businesses by location, industry, and website condition.' },
  { n: '02', title: 'Analyze', desc: 'Run website audits and let the scoring engine surface genuine opportunities.' },
  { n: '03', title: 'Pitch', desc: 'Generate personalized outreach grounded in real audit findings.' },
  { n: '04', title: 'Win', desc: 'Track leads through your pipeline and convert opportunities into clients.' },
];

const useCases = [
  'Restaurants & cafes', 'Dental clinics & healthcare', 'Beauty salons & spas', 'Gyms & fitness studios',
  'Automotive garages', 'Real estate agencies', 'Retail stores', 'Home service providers',
  'Professional services', 'Education & tutoring', 'Hotels & tourism', 'Other local businesses',
];

const plans = [
  {
    name: 'Starter', price: 'AED 99', period: '/month', desc: 'For solo freelancers getting started.',
    features: ['500 business searches / mo', '50 website audits / mo', '100 AI outreach drafts / mo', '1 team seat', 'Lead CRM', 'Email support'],
    cta: 'Start with Starter', highlight: false,
  },
  {
    name: 'Pro', price: 'AED 249', period: '/month', desc: 'For growing agencies closing more deals.',
    features: ['2,500 business searches / mo', '250 website audits / mo', '500 AI outreach drafts / mo', '3 team seats', 'Campaigns & follow-ups', 'Website concepts', 'Priority support'],
    cta: 'Choose Pro', highlight: true,
  },
  {
    name: 'Agency', price: 'AED 599', period: '/month', desc: 'For teams managing many clients.',
    features: ['10,000 business searches / mo', '1,000 website audits / mo', 'Unlimited AI outreach', '10 team seats', 'Advanced analytics', 'Integrations & API', 'Dedicated support'],
    cta: 'Choose Agency', highlight: false,
  },
];

const faqs = [
  { q: 'How does SiteScout AI find businesses?', a: 'It connects to a licensed business-data provider (such as Google Places) via secure server-side requests. Until you configure a provider key, a clearly labelled demo mode and CSV import keep your workflow moving.' },
  { q: 'Are the website scores real?', a: 'Audits run genuine checks for performance, SEO, security, mobile, and conversion signals where evidence is available. Heuristic findings are clearly labelled, and scores are never fabricated.' },
  { q: 'Does the AI invent problems to sell services?', a: 'No. Outreach is grounded in verified audit findings and your service offerings. The assistant never fabricates metrics, testimonials, or prior relationships.' },
  { q: 'Is my data isolated from other organizations?', a: 'Yes. Records are scoped to your account with server-side authorization. Users never access another organization’s leads, audits, or settings.' },
  { q: 'When is billing active?', a: 'Pricing is shown for planning. Payments and subscriptions activate only after a real billing integration is configured and tested — never before.' },
];

function DashboardPreview() {
  const stats = [
    { label: 'Discovered', value: '1,284', tone: 'text-primary' },
    { label: 'No website', value: '412', tone: 'text-amber-500' },
    { label: 'Audited', value: '318', tone: 'text-chart-3' },
    { label: 'High opportunity', value: '96', tone: 'text-accent' },
  ];
  return (
    <div className="relative rounded-2xl border border-border bg-card p-4 shadow-2xl card-glow">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-chart-5/70" />
        </div>
        <Badge variant="secondary" className="text-[10px]">Illustrative preview</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 p-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-2 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Lead discovery trend</p>
          <div className="mt-3 flex h-20 items-end gap-1.5">
            {[40, 55, 48, 70, 62, 80, 72, 90, 85, 95, 88, 100].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Opportunity funnel</p>
          <div className="mt-3 space-y-2">
            {[['Discovered', 100], ['Contacted', 58], ['Qualified', 32], ['Won', 12]].map(([l, w]) => (
              <div key={l}>
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>{l}</span></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${w}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-5 text-left">
        <span className="font-medium">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-sm text-muted-foreground">{a}</p>}
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated, authChecked } = useAuth();
  if (AUTH_ENABLED && authChecked && isAuthenticated) return <Navigate to="/app" replace />;
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-5 gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" /> AI-powered client acquisition for web agencies
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find Your Next Client <span className="text-gradient">Before Your Competitors Do.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              SiteScout AI discovers businesses without a website — or with performance, SEO, mobile, and conversion problems — scores the real opportunities, and helps your agency turn them into paying clients.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="gap-2">
                <Link to="/app/discover">Find Opportunities <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/app">Explore the Platform</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card required · Demo mode available</p>
          </div>
          <div className="mx-auto mt-16 max-w-5xl animate-fade-in">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Product */}
      <section id="product" className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From discovery to signed client</h2>
            <p className="mt-4 text-muted-foreground">One platform to discover prospects, audit their websites, score opportunities, and manage every lead to close.</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A simple, powerful workflow</h2>
            <p className="mt-4 text-muted-foreground">Four steps from a blank pipeline to a booked client.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6">
                <span className="text-3xl font-bold text-primary/30">{s.n}</span>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features detail */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Website intelligence you can trust</h2>
              <p className="mt-4 text-muted-foreground">Every audit is grounded in real, checkable signals. We never claim to measure things we can’t — heuristic findings are labelled, and the opportunity score is kept separate from website quality.</p>
              <ul className="mt-6 space-y-3">
                {['Performance & Core Web Vitals where measurable', 'Mobile usability, SEO, and security checks', 'Conversion readiness and trust signals', 'Accessibility signals with honest caveats', 'Shareable, professional audit reports'].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3" /></span>
                    <span className="text-sm">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 card-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Bloom Dental Clinic</p>
                  <p className="text-xs text-muted-foreground">bloomdental.ae · Healthcare</p>
                </div>
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">Opportunity 78</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[['Performance', 42, 'text-destructive'], ['SEO', 61, 'text-amber-500'], ['Mobile', 38, 'text-destructive']].map(([l, v, c]) => (
                  <div key={l} className="rounded-lg border border-border bg-background/60 p-3">
                    <p className="text-[11px] text-muted-foreground">{l}</p>
                    <p className={`text-lg font-bold ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {['No HTTPS — insecure connection', 'Missing meta description', 'Not mobile-friendly · horizontal overflow'].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-destructive" />{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Built for every local industry</h2>
            <p className="mt-4 text-muted-foreground">Discover prospects across the categories agencies serve most.</p>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {useCases.map((u) => (
              <span key={u} className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">{u}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground">Plans scale with your prospecting volume. Billing activates once a payment provider is configured.</p>
            <Badge variant="outline" className="mt-4">Billing integration: setup required</Badge>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={`relative rounded-2xl border bg-card p-6 ${p.highlight ? 'border-primary shadow-lg ring-1 ring-primary/30' : 'border-border'}`}>
                {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Most popular</span>}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <Button className="mt-6 w-full" variant={p.highlight ? 'default' : 'outline'} asChild>
                  <Link to="/app">{p.cta}</Link>
                </Button>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          <div className="mt-10">
            {faqs.map((f) => <FAQItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-navy to-navy-soft p-10 text-center text-primary-foreground sm:p-16">
            <div className="absolute inset-0 bg-radial-glow opacity-60" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Start finding clients today</h2>
              <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">Join agencies using SiteScout AI to discover opportunities their competitors miss.</p>
              <Button size="lg" asChild className="mt-8 gap-2">
                <Link to="/app">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}