import { Wand2, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sticky bulk-action bar shown when one or more leads are selected.
// Generate = save a personalised draft per lead. Generate & log sent = save the
// draft and record an outbound "sent" activity per lead. No email is sent
// automatically — outreach is never sent without a configured provider.
export default function BulkActionBar({ count, busy, onGenerate, onLogSent, onClear }) {
  if (!count) return null;
  return (
    <div className="sticky bottom-3 z-30 flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onGenerate} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1 h-3.5 w-3.5" />}
          Generate drafts
        </Button>
        <Button size="sm" onClick={onLogSent} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
          Generate &amp; log sent
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={busy} aria-label="Clear selection">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}