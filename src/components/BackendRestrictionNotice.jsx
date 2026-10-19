import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BACKEND_FUNCTIONS_AVAILABLE } from '@/lib/env';

// Honest, reusable notice shown wherever a feature depends on a restricted
// backend function. Never claims the feature works when it cannot execute on
// the current plan. The restriction is confirmed (see src/lib/env.js).
export default function BackendRestrictionNotice({ title, description, fallback, className }) {
  if (BACKEND_FUNCTIONS_AVAILABLE) return null;
  return (
    <div className={cn('rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300', className)}>
      <p className="flex items-center gap-2 font-medium">
        <Lock className="h-4 w-4" />
        {title || 'Live backend feature unavailable on this plan'}
      </p>
      <p className="mt-1 text-xs">
        {description ||
          'This action runs in a Base44 backend function, which requires a Builder+ plan. Your saved data is preserved. A free fallback is shown where one exists.'}
      </p>
      {fallback && <p className="mt-1 text-xs">{fallback}</p>}
    </div>
  );
}