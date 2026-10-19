import { MapPin, LocateFixed, RefreshCw, Loader2, Edit3, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Shown once a search area is chosen. Displays the active area, radius
// selector, "Search this area", and change/re-request controls.
export default function LocationBar({ loc, starting, onSearchArea }) {
  const { area, radius, RADII, setRadius, changeLocation, retryPermission, denied } = loc;
  return (
    <Card className="mb-4 border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Search area</p>
              <p className="truncate text-sm font-semibold">{area.label}</p>
            </div>
          </div>
          <Badge variant={area.source === 'browser' ? 'default' : 'secondary'}>
            {area.source === 'browser' ? 'Detected' : 'Manual'}
          </Badge>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Radius</span>
              <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RADII.map((r) => <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={onSearchArea} disabled={starting}>
              {starting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching…</> : <><RefreshCw className="mr-2 h-4 w-4" /> Search this area</>}
            </Button>
            <Button size="sm" variant="outline" onClick={changeLocation}><Edit3 className="mr-2 h-4 w-4" /> Change location</Button>
            {!denied && (
              <Button size="sm" variant="ghost" onClick={retryPermission}><LocateFixed className="mr-2 h-4 w-4" /> Use my location</Button>
            )}
          </div>
        </div>
        {denied && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Location access is denied. To enable it, update site permissions in your browser settings — or keep using manual search.
          </p>
        )}
      </CardContent>
    </Card>
  );
}