import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Search, Gauge, Users, Target, Mail, MessageSquare, CheckCircle2, Trophy,
  Wallet, TrendingUp, ArrowRight, Building2, AlertTriangle, CalendarClock,
} from 'lucide-react';
import { StatCard, EmptyState, PageHeader, DemoBadge } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { statusLabel, statusColor, scoreTone, formatAED, formatDate, relativeDate } from '@/lib/appUtils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

function loadDashboard() {
  return Promise.all([
    base44.entities.Business.count(),
    base44.entities.Business.count({ website_status: 'no_website_listed' }),
    base44.entities.WebsiteAudit.count(),
    base44.entities.Business.count({ opportunity_score: { $gte: 70 } }),
    base44.entities.Business.filter({}, { sort: '-opportunity_score', limit: 5 }),
    base44.entities.Business.filter({}, { sort: '-created_date', limit: 5 }),
    base44.entities.WebsiteAudit.filter({}, { sort: '-created_date', limit: 5 }),
    base44.entities.Lead.count(),
    base44.entities.Lead.filter({ stage: { $in: ['contacted', 'replied', 'meeting_scheduled', 'proposal_sent'] } }, { limit: 1 }),
    base44.entities.Lead.filter({ stage: 'replied' }, { limit: 1 }),
    base44.entities.Lead.filter({ stage: 'qualified' }, { limit: 1 }),
    base44.entities.Lead.filter({ stage: 'won' }, { limit: 1 }),
    base44.entities.Lead.aggregate({ groupBy: 'stage', sum: 'deal_value' }),
    base44.entities.Business.aggregate({ groupBy: 'industry', sort: '-count', limit: 6 }),
    base44.entities.Business.aggregate({ groupBy: 'city', sort: '-count', limit: 6 }),
    base44.entities.Business.aggregate({ groupBy: 'website_status' }),
    base44.entities.Lead.filter({ next_follow_up: { $exists: true } }, { sort: 'next_follow_up', limit: 5 }),
    base44.entities.OutreachActivity.filter({}, { sort: '-created_date', limit: 6 }),
  ]).then(([
    totalBiz, noWebsite, totalAudits, highOppCount, highOpp, recentBiz, recentAudits,
    totalLeads, contactedPage, repliedPage, qualifiedPage, wonPage,
    stageAgg, industryAgg, cityAgg, statusAgg, followUps, activity,
  ]) => ({
    totalBiz, noWebsite, totalAudits, highOppCount, highOpp,
    // recentBiz arrives as a page object from filter(); normalise to an array.
    recentBiz: recentBiz.items || [],
    recentAudits: recentAudits.items || [],
    totalLeads,
    contacted: contactedPage.items?.length || 0,
    replied: repliedPage.items?.length || 0,
    qualified: qualifiedPage.items?.length || 0,
    won: wonPage.items?.length || 0,
    stageAgg: stageAgg.rows || [],
    industryAgg: industryAgg.rows || [],
    cityAgg: cityAgg.rows || [],
    statusAgg: statusAgg.rows || [],
    followUps: followUps.items || [],
    activity: activity.items || [],
  }));
}

function trendData(recentBiz) {
  // Build a simple 12-point trend from created_date of recent businesses (illustrative of own data volume)
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('en', { month: 'short' }), discovered: 0 });
  }
  (recentBiz || []).forEach((b) => {
    if (!b.created_date) return;
    const d = new Date(b.created_date);
    const idx = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()) + 11;
    if (idx >= 0 && idx < 12) months[idx].discovered += 1;
  });
  return months;
}

const STATUS_COLORS = {
  no_website_listed: '#f59e0b', unverified: '#94a3b8', reachable: '#10b981',
  redirecting: '#f59e0b', inaccessible: '#ef4444', error: '#ef4444', blocked: '#ef4444', audit_incomplete: '#94a3b8',
};

export default function Overview() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: loadDashboard });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>;
  }

  const d = data || {};
  const hasData = d.totalBiz > 0 || d.totalLeads > 0 || d.totalAudits > 0;
  const pipeline = (d.stageAgg || []).reduce((s, r) => s + (r.sum_deal_value || 0), 0);
  const trend = trendData(d.recentBiz);
  const statusPie = (d.statusAgg || []).map((r) => ({ name: statusLabel(r._id), value: r.count, key: r._id }));
  const funnel = [
    { label: 'Discovered', value: d.totalBiz || 0, color: 'hsl(var(--primary))' },
    { label: 'Contacted', value: d.contacted || 0, color: 'hsl(var(--chart-3))' },
    { label: 'Qualified', value: d.qualified || 0, color: 'hsl(var(--accent))' },
    { label: 'Won', value: d.won || 0, color: 'hsl(var(--chart-5))' },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Your prospecting pipeline at a glance — all numbers come from your own data."
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link to="/app/audits"><Gauge className="mr-2 h-4 w-4" /> Run audit</Link></Button>
            <Button asChild size="sm"><Link to="/app/discover"><Search className="mr-2 h-4 w-4" /> Discover businesses</Link></Button>
          </>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={Search}
          title="No data yet"
          description="Start by discovering businesses or importing a CSV. Your dashboard will populate as you work."
          action={<Button asChild><Link to="/app/discover">Discover your first businesses <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Discovered businesses" value={d.totalBiz || 0} icon={Building2} tone="text-primary" />
            <StatCard label="Without a website" value={d.noWebsite || 0} icon={AlertTriangle} tone="text-amber-500" />
            <StatCard label="Websites audited" value={d.totalAudits || 0} icon={Gauge} tone="text-chart-3" />
            <StatCard label="High opportunity" value={d.highOppCount || 0} icon={Target} tone="text-accent" />
            <StatCard label="Leads contacted" value={d.contacted || 0} icon={Mail} tone="text-chart-3" />
            <StatCard label="Replies received" value={d.replied || 0} icon={MessageSquare} tone="text-chart-2" />
            <StatCard label="Qualified" value={d.qualified || 0} icon={CheckCircle2} tone="text-chart-5" />
            <StatCard label="Clients won" value={d.won || 0} icon={Trophy} tone="text-emerald-500" />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Pipeline value</p>
                  <p className="text-lg font-bold">{formatAED(pipeline)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-primary" /> Lead discovery trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={trend} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="discovered" stroke="hsl(var(--primary))" fill="url(#g1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Website quality distribution</CardTitle></CardHeader>
              <CardContent>
                {statusPie.length ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={34}>
                        {statusPie.map((e) => <Cell key={e.key} fill={STATUS_COLORS[e.key] || '#94a3b8'} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="py-8 text-center text-sm text-muted-foreground">No website status data yet</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {statusPie.map((s) => <span key={s.name} className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.key] || '#94a3b8' }} />{s.name}</span>)}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Opportunities by industry</CardTitle></CardHeader>
              <CardContent>
                {(d.industryAgg || []).length ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={d.industryAgg.map((r) => ({ name: (r._id || '—').split(' ')[0], count: r.count }))} layout="vertical" margin={{ left: 8, right: 8 }}>
                      <XAxis type="number" hide /><YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-8 text-center text-sm text-muted-foreground">No industry data yet</p>}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Lead funnel</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {funnel.map((f) => {
                    const max = funnel[0].value || 1;
                    return (
                      <div key={f.label}>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{f.label}</span><span className="font-medium">{f.value}</span></div>
                        <div className="mt-1 h-2.5 rounded-full bg-muted"><div className="h-2.5 rounded-full" style={{ width: `${(f.value / max) * 100}%`, background: f.color }} /></div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">High-priority opportunities</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(d.highOpp?.items || []).length ? d.highOpp.items.map((b) => (
                  <Link key={b.id} to="/app/leads" className="flex items-center justify-between rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.industry} · {b.city}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${scoreTone(b.opportunity_score)}`}>{b.opportunity_score ?? '—'}</span>
                      {b.is_demo && <DemoBadge />}
                    </div>
                  </Link>
                )) : <p className="py-6 text-center text-sm text-muted-foreground">No scored opportunities yet</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /> Upcoming follow-ups</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(d.followUps || []).length ? d.followUps.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{l.business_name}</p>
                      <p className="text-xs text-muted-foreground">Due {relativeDate(l.next_follow_up)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{l.stage}</Badge>
                  </div>
                )) : <p className="py-6 text-center text-sm text-muted-foreground">No follow-ups scheduled</p>}
              </CardContent>
            </Card>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recent discoveries</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(d.recentBiz || []).length ? d.recentBiz.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.industry} · {formatDate(b.created_date)}</p>
                    </div>
                    <span className={`text-xs ${statusColor(b.website_status)}`}>{statusLabel(b.website_status)}</span>
                  </div>
                )) : <p className="py-6 text-center text-sm text-muted-foreground">No businesses discovered yet</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recent activity</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(d.activity || []).length ? d.activity.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{a.subject || a.channel || 'Outreach'} — {a.business_name}</p>
                      <p className="text-xs text-muted-foreground">{a.status} · {formatDate(a.created_date)}</p>
                    </div>
                  </div>
                )) : <p className="py-6 text-center text-sm text-muted-foreground">No recent activity</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}