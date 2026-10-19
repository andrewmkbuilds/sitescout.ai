import { useState } from 'react';
import { MapPin, LocateFixed, Loader2, ShieldAlert, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LocationSearchInput from '@/components/LocationSearchInput';

// First-time location-permission prompt. Shown only while no search area is
// chosen. Handles browser-geolocation, manual entry, and all failure states.
export default function LocationPermissionCard({ loc }) {
  const { requestLocation, locating, error, denied, unsupported } = loc;
  const [manual, setManual] = useState(false);

  return (
    <Card className="mb-4 overflow-hidden border-border">
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-6 sm:p-8">
          <div className="mx-auto max-w-xl text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <MapPin className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-semibold sm:text-2xl">Find Businesses Near You</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover local businesses that could benefit from a better website. Allow location access to find relevant opportunities near you.
            </p>

            {!manual && (
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" onClick={requestLocation} disabled={locating}>
                  {locating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding your location…</> : <><LocateFixed className="mr-2 h-4 w-4" /> Use My Location</>}
                </Button>
                <Button size="lg" variant="outline" onClick={() => setManual(true)}>
                  <Search className="mr-2 h-4 w-4" /> Enter Location Manually
                </Button>
              </div>
            )}

            {manual && (
              <div className="mt-5 text-left">
                <LocationSearchInput loc={loc} autoFocus />
                <div className="mt-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setManual(false)}>Back</Button>
                </div>
              </div>
            )}

            {(error || denied || unsupported) && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{error || 'Location access is unavailable. You can still discover businesses by entering a city, neighbourhood, or postcode.'}</p>
                  {denied && (
                    <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                      <ShieldAlert className="h-3.5 w-3.5" /> To enable location, update site permissions in your browser settings.
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="mt-4 text-[11px] text-muted-foreground">
              Your location is used to find nearby business opportunities. You can change your search area or enter a location manually at any time.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}