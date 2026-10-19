import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, Download, TrendingUp, PieChart as PieIcon, Activity, Trophy, Wallet } from 'lucide-react';
import { PageHeader, EmptyState, StatCard } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatAED, statusLabel, stageLabel } from '@/lib/appUtils';

const STATUS_COLORS = { no_website_listed: '#f59e0b', unverified: '#94a3b8', reachable: '#10b981', redirecting: '#f59e0b', inaccessible: '#ef4444', error: '#ef4444', blocked: '#ef4444', audit_incomplete: '#94a3b8' };

function loadAnalytics(range) {
  const since = range === 'all' ? null : new Date(Date.now() - (range === 30 ? 30 : 90) * 86400000).toISOString();
  return Promise.all([
    base44.entities.Business.aggregate({ groupBy: 'website_status' }),
    base44.entities.Business.aggregate({ groupBy: 'industry', sort: '-count', limit: 8 }),
    base44.entities.Business.aggregate({ groupBy: 'city', sort: '-count', limit: 8 }),
    base44.entities.Lead.aggregate({ groupBy: 'stage', sum: 'deal_value' }),
    base44.entities.WebsiteAudit.filter({}, { sort: '-created_date', limit: 100 }),
    base44.entities.OutreachActivity.aggregate({ groupBy: 'status' }),
    base44.entities.Business.filter(since ? { created_date: { $gte: since } } : {}, { sort: '-created_date', limit: 200 }),
    base44.entities.WebsiteAudit.count(),
    base44.entities.Lead.filter({ stage: 'won' }, { limit: 1 }),
  ]).then(([statusAgg, industryAgg, cityAgg, stageAgg, auditPage, outreachAgg, bizPage, auditCount, wonPage]) => {
    const findingsMap = {};
    (auditPage.items || []).forEach((a) => (a.findings || []).forEach((f) => { findingsMap[f.category] = (findingsMap[f.category] || 0) + 1; }));
    const findingsAgg = Object.entries(findingsMap).map(([k, v]) => ({ _id: k, count: v })).sort((a, b) => b.count - a.count);
    return {
      statusAgg: statusAgg.rows || [], industryAgg: industryAgg.rows || [], cityAgg: cityAgg.rows || [],
      stageAgg: stageAgg.rows || [], findingsAgg, outreachAgg: outreachAgg.rows || [],
      businesses: bizPage.items || [], auditCount, wonCount: wonPage.items?.length || 0,
    };
  });
}

export default function Analytics() {
  const [range, setRange] = useState('all');
  const { data, isLoading } = useQuery({ queryKey: ['analytics', range], queryFn: () => loadAnalytics(range) });

  if (isLoading) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>;
  const d = data || {};
  const pipeline = (d.stageAgg || []).reduce((s, r) => s + (r.sum_deal_value || 0), 0);

  const trend = (() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) { const dt = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ label: dt.toLocaleDateString('en', { month: 'short' }), v: 0 }); }
    (d.businesses || []).forEach((b) => { if (!b.created_date) return; const dt = new Date(b.created_date); const idx = (dt.getFullYear() - now.getFullYear()) * 12 + (dt.getMonth() - now.getMonth()) + 11; if (idx >= 0 && idx < 12) months[idx].v += 1; });
    return months;
  })();

  const statusPie = (d.statusAgg || []).map((r) => ({ name: statusLabel(r._id), value: r.count, key: r._id }));
  const exportData = () => {
    const rows = (d.stageAgg || []).map((r) => `${r._id},${r.count},${r.sum_deal_value || 0}`);
    const blob = new Blob([['stage,count,value', ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'analytics.csv'; a.click();
  };

  return (
    <div>
      <PageHeader title="Analytics" description="All metrics derive from your own persisted data. Missing data is excluded from calculations."
        actions={<>
          <Select value={String(range)} onValueChange={(v) => setRange(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="30">30 days</SelectItem><SelectItem value="90">90 days</SelectItem><SelectItem value="all">All time</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportData}><Download className="mr-2 h-4 w-4" /> Export</Button>
        </>} />

      {!d.auditCount && !(d.businesses || []).length ? (
        <EmptyState icon={BarChart3} title="No analytics yet" description="Discover businesses and run audits to populate your analytics." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Prospects discovered" value={(d.businesses || []).length} icon={TrendingUp} tone="text-primary" />
            <StatCard label="Audits run" value={d.auditCount || 0} icon={Activity} tone="text-chart-3" />
            <StatCard label="Clients won" value={d.wonCount || 0} icon={Trophy} tone="text-emerald-500" />
            <StatCard label="Pipeline value" value={formatAED(pipeline)} icon={Wallet} tone="text-accent" />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Prospects discovered over time</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trend} margin={{ left: -20, right: 8, top: 4 }}>
                    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="url(#ag)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><PieIcon className="h-4 w-4" /> Website status breakdown</CardTitle></CardHeader>
              <CardContent>
                {statusPie.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={{ fontSize: 10 }}>{statusPie.map((e) => <Cell key={e.key} fill={STATUS_COLORS[e.key] || '#94a3b8'} />)}</Pie><Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Audit findings by category</CardTitle></CardHeader>
              <CardContent>
                {(d.findingsAgg || []).length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={d.findingsAgg.map((r) => ({ name: r._id, count: r.count }))} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-sm text-muted-foreground">No audit findings yet</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Leads by stage</CardTitle></CardHeader>
              <CardContent>
                {(d.stageAgg || []).length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={d.stageAgg.map((r) => ({ name: stageLabel(r._id), count: r.count, value: r.value || 0 }))} layout="vertical" margin={{ left: 20, right: 8 }}>
                      <XAxis type="number" hide /><YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={110} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-sm text-muted-foreground">No leads yet</p>}
              </CardContent>
            </Card>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Performance by industry</CardTitle></CardHeader>
              <CardContent>
                {(d.industryAgg || []).length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={d.industryAgg.map((r) => ({ name: (r._id || '—').split(' ')[0], count: r.count }))} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Performance by location</CardTitle></CardHeader>
              <CardContent>
                {(d.cityAgg || []).length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={d.cityAgg.map((r) => ({ name: r._id || '—', count: r.count }))} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}