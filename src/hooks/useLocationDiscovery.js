// Smart location permission + location-aware discovery state for the Discover page.
// Persists only the resolved search area (city/region/country + city-centre
// centroid) and the user's choice — never the raw browser GPS coordinates.
import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const LS_CHOICE = 'sitescout.loc.choice';
const LS_AREA = 'sitescout.loc.area';
const LS_RADIUS = 'sitescout.loc.radius';

export const RADII = [
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
];

function readLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function writeLS(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ } }

export function useLocationDiscovery() {
  const [choice, setChoice] = useState(() => readLS(LS_CHOICE, null));
  const [area, setArea] = useState(() => readLS(LS_AREA, null));
  const [radius, setRadius] = useState(() => readLS(LS_RADIUS, 2000));
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [denied, setDenied] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => { writeLS(LS_CHOICE, choice); }, [choice]);
  useEffect(() => { writeLS(LS_AREA, area); }, [area]);
  useEffect(() => { writeLS(LS_RADIUS, radius); }, [radius]);

  const reverseGeocode = useCallback(async (lat, lon) => {
    const res = await base44.functions.invoke('geocodeLocation', { mode: 'reverse', lat, lon });
    const data = res.data || res;
    if (data.error) throw new Error(data.error);
    return data;
  }, []);

  const forwardGeocode = useCallback(async (query) => {
    const res = await base44.functions.invoke('geocodeLocation', { mode: 'search', query });
    const data = res.data || res;
    if (data.error) throw new Error(data.error);
    return data.items || [];
  }, []);

  const requestBrowserLocation = useCallback(() => {
    setError(null);
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setUnsupported(true);
      setError('Geolocation is not supported by this browser. Enter a location manually.');
      return;
    }
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setUnsupported(true);
      setError('Location access requires a secure (HTTPS) connection. Enter a location manually.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode at city zoom — returns a city-level centroid, not the
          // user's exact point. The raw GPS coords are discarded after this call.
          const place = await reverseGeocode(latitude, longitude);
          const label = place.label || [place.city, place.region, place.country].filter(Boolean).join(', ') || place.display_name || 'Your location';
          setArea({
            label,
            city: place.city || '', region: place.region || '', country: place.country || '',
            centroid: (place.lat != null && place.lon != null) ? { lat: place.lat, lon: place.lon } : null,
            source: 'browser',
          });
          setChoice('browser');
          setDenied(false);
          setUnsupported(false);
        } catch (e) {
          setError('Could not resolve your location: ' + (e?.message || 'unknown error') + '. Enter a location manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setDenied(true);
          setError('Location access was denied. You can still discover businesses by entering a city, neighbourhood, or postcode.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location is unavailable. Enter a location manually.');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out. Retry, or enter a location manually.');
        } else {
          setError('Location error: ' + err.message);
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  }, [reverseGeocode]);

  const searchManual = useCallback(async (query) => {
    if (!query || query.trim().length < 2) { setSuggestions([]); return; }
    setSearching(true);
    setError(null);
    try {
      const items = await forwardGeocode(query);
      setSuggestions(items);
    } catch (e) {
      setSuggestions([]);
      setError('Location search failed: ' + (e?.message || 'unknown error'));
    } finally {
      setSearching(false);
    }
  }, [forwardGeocode]);

  const selectManual = useCallback((item) => {
    const label = item.label || [item.city, item.region, item.country].filter(Boolean).join(', ') || item.display_name || '';
    setArea({
      label,
      city: item.city || '', region: item.region || '', country: item.country || '',
      centroid: (item.lat != null && item.lon != null) ? { lat: item.lat, lon: item.lon } : null,
      source: 'manual',
    });
    setChoice('manual');
    setSuggestions([]);
    setError(null);
    setDenied(false);
  }, []);

  const changeLocation = useCallback(() => {
    setChoice(null);
    setArea(null);
    setError(null);
    setSuggestions([]);
  }, []);

  const retryPermission = useCallback(() => {
    setDenied(false);
    setError(null);
    requestBrowserLocation();
  }, [requestBrowserLocation]);

  const clearLocation = useCallback(() => {
    setChoice(null); setArea(null); setError(null); setSuggestions([]);
  }, []);

  return {
    choice, area, radius, locating, error, suggestions, searching, denied, unsupported,
    RADII, setRadius, requestLocation: requestBrowserLocation, searchManual, selectManual, changeLocation, retryPermission, clearLocation,
  };
}