import { LiveRouteCheckpoint, TransportMode as TrackingTransportMode } from '../types';

export type BookingTransportMode = 'driving' | 'motorcycle' | 'bicycling' | 'walking' | 'transit';

export interface GoogleRouteStep {
  instruction: string;
  maneuver: string;
  streetName: string;
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
}

export interface GoogleComputedRouteResult {
  distanceKm: number;
  etaMinutes: number;
  description: string;
  encodedPolyline: string;
  decodedPath: Array<{ lat: number; lng: number }>;
  steps: GoogleRouteStep[];
  checkpoints: LiveRouteCheckpoint[];
}

export function formatCurrentClockTime(offsetMinutes = 0): string {
  const now = new Date(Date.now() + offsetMinutes * 60000);
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function decodeGooglePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  if (!encoded) return [];
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20 && index <= len);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20 && index <= len);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

export function toGoogleTravelMode(
  mode?: BookingTransportMode | TrackingTransportMode | string
): 'DRIVE' | 'TWO_WHEELER' | 'BICYCLE' | 'WALK' | 'TRANSIT' {
  if (mode === 'walking') return 'WALK';
  if (mode === 'bicycling') return 'BICYCLE';
  if (mode === 'motorcycle') return 'TWO_WHEELER';
  if (mode === 'transit') return 'TRANSIT';
  return 'DRIVE';
}

function extractStreetFromInstruction(instruction: string, index: number): string {
  const clean = String(instruction || '')
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' — ')
    .trim();
  if (!clean) return `Trecho ${index + 1} da Rota`;

  const match = clean.match(
    /(?:na|para a|para|pela|pelo|em direção à|em direção a|pegue a|continue na|siga pela)\s+((?:R\.|Rua|Av\.|Avenida|Al\.|Alameda|Pça\.|Praça|Rod\.|Rodovia|Estr\.|Estrada|Marginal|Viaduto|Ponte|Túnel|Largo|Travessa|Via|Pátio|Taxiway)[^,.—\n]+)/i
  );
  if (match && match[1]) {
    return match[1].trim();
  }

  return clean.length > 64 ? `${clean.slice(0, 61)}...` : clean;
}

export async function computeGoogleDetailedRoute(params: {
  originLat?: number;
  originLng?: number;
  originAddress?: string;
  destLat?: number;
  destLng?: number;
  destAddress?: string;
  mode?: BookingTransportMode | TrackingTransportMode | string;
}): Promise<GoogleComputedRouteResult | null> {
  try {
    const travelMode = toGoogleTravelMode(params.mode);
    const res = await fetch('/api/geo/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originLat: params.originLat,
        originLng: params.originLng,
        originAddress: params.originAddress,
        destLat: params.destLat,
        destLng: params.destLng,
        destAddress: params.destAddress,
        travelMode,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;

    const leg = route.legs?.[0];
    const distMeters = Number(route.distanceMeters || leg?.distanceMeters || 0);
    const durSec =
      Number(String(route.duration || leg?.duration || '0s').replace('s', '')) || 0;

    const distanceKm = Math.max(0.2, Number((distMeters / 1000).toFixed(1)));
    const etaMinutes = Math.max(2, Math.ceil(durSec / 60));
    const encodedPolyline = route.polyline?.encodedPolyline || '';
    const decodedPath = decodeGooglePolyline(encodedPolyline);

    const rawSteps: any[] = Array.isArray(leg?.steps) ? leg.steps : [];
    const steps: GoogleRouteStep[] = rawSteps
      .map((s, idx) => {
        const rawInstruction = String(s?.navigationInstruction?.instructions || '')
          .replace(/\n+/g, ' • ')
          .trim();
        const maneuver = String(s?.navigationInstruction?.maneuver || 'STRAIGHT');
        const stepMeters = Number(s?.distanceMeters || 0);
        const stepSec = Number(String(s?.staticDuration || '0s').replace('s', '')) || 0;
        const distanceText =
          s?.localizedValues?.distance?.text ||
          (stepMeters >= 1000
            ? `${(stepMeters / 1000).toFixed(1)} km`
            : `${Math.max(10, stepMeters)} m`);
        const durationText =
          s?.localizedValues?.staticDuration?.text ||
          `${Math.max(1, Math.round(stepSec / 60))} min`;

        const streetName = extractStreetFromInstruction(rawInstruction, idx);

        return {
          instruction: rawInstruction || streetName,
          maneuver,
          streetName,
          distanceMeters: stepMeters,
          distanceText,
          durationSeconds: stepSec,
          durationText,
          startLat: s?.startLocation?.latLng?.latitude,
          startLng: s?.startLocation?.latLng?.longitude,
          endLat: s?.endLocation?.latLng?.latitude,
          endLng: s?.endLocation?.latLng?.longitude,
        };
      })
      .filter((s) => Boolean(s.instruction));

    const nowClock = formatCurrentClockTime(0);
    const checkpoints: LiveRouteCheckpoint[] = steps.slice(0, 12).map((step, idx) => ({
      street: step.instruction,
      distanceText: step.distanceText,
      status: idx === 0 ? 'current' : 'upcoming',
      timestamp: idx === 0 ? nowClock : undefined,
    }));

    return {
      distanceKm,
      etaMinutes,
      description: route.description ? `via ${route.description}` : 'Rota Google Maps',
      encodedPolyline,
      decodedPath,
      steps,
      checkpoints,
    };
  } catch {
    return null;
  }
}

export async function snapAndReverseGeocodeGps(
  lat: number,
  lng: number
): Promise<{ lat: number; lng: number; streetName: string; formattedAddress: string } | null> {
  try {
    const res = await fetch(
      `/api/maps/snap-and-reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
