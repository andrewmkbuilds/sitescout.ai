import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Debounced manual location search with Nominatim suggestions.
export default function LocationSearchInput({ loc, autoFocus }) {
  const { searchManual, suggestions, searching, selectManual, error } = loc;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const t = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    if (q.trim().length < 2) { setOpen(false); return; }
    t.current = setTimeout(() => { searchManual(q); setOpen(true); }, 350);
    return () => { if (t.current) clearTimeout(t.current); };
  }, [q, searchManual]);

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (item) => { selectManual(item); setOpen(false); setQ(''); };

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          className="pl-9"
          placeholder="Enter a city, neighbourhood, or postcode"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && (suggestions.length > 0 || (error && q.trim().length >= 2)) && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {suggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => pick(s)} className="flex w-full items-start gap-2 border-b border-border/50 px-3 py-2 text-left text-sm last:border-0 hover:bg-muted/50">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.label || [s.city, s.region].filter(Boolean).join(', ') || s.display_name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{s.country}</span>
              </span>
            </button>
          ))}
          {!suggestions.length && error && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Location search failed. Try a different term.</div>
          )}
        </div>
      )}
    </div>
  );
}