import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { LEAD_STAGES, formatAED } from '@/lib/appUtils';
import { Card } from '@/components/ui/card';

// Total potential deal value broken down by pipeline stage. Uses a single
// aggregate call grouped by stage (sum of deal_value), so the server does the
// math rather than loading every lead.
export default function LeadsSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['leads-summary'],
    queryFn: async () => {
      const res = await base44.entities.Lead.aggregate({
        query: { archived: { $ne: true } },
        groupBy: 'stage',
        sum: 'deal_value',
      });
      return res.rows || [];
    },
  });

  if (isLoading) {
    return (
      <div className="mb-4 flex h-16 items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const byStage = {};
  let totalValue = 0;
  let totalCount = 0;
  for (const row of data || []) {
    byStage[row.stage] = { count: row.count || 0, value: row.sum_deal_value || 0 };
    totalValue += row.sum_deal_value || 0;
    totalCount += row.count || 0;
  }

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {/* Total */}
      <Card className="border-primary/30 bg-primary/5 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Total pipeline</p>
        <p className="mt-1 text-base font-bold leading-tight">{formatAED(totalValue)}</p>
        <p className="text-[11px] text-muted-foreground">{totalCount} lead{totalCount === 1 ? '' : 's'}</p>
      </Card>

      {LEAD_STAGES.map((s) => {
        const v = byStage[s.value] || { count: 0, value: 0 };
        return (
          <Card key={s.value} className="p-3">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${s.color}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</span>
            </div>
            <p className="mt-1 text-sm font-bold leading-tight">{formatAED(v.value)}</p>
            <p className="text-[11px] text-muted-foreground">{v.count} lead{v.count === 1 ? '' : 's'}</p>
          </Card>
        );
      })}
    </div>
  );
}