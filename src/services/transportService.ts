import { TransportMode } from '../types';

export interface ExternalNavDeepLinks {
  googleMapsUrl: string;
  wazeUrl: string;
}

export function buildUniversalNavigationLinks(params: {
  originLat?: number;
  originLng?: number;
  destLat: number;
  destLng: number;
  destLabel?: string;
  mode?: TransportMode;
}): ExternalNavDeepLinks {
  const { originLat, originLng, destLat, destLng, mode = 'driving' } = params;
  const travelmode =
    mode === 'walking'
      ? 'walking'
      : mode === 'bicycling'
      ? 'bicycling'
      : mode === 'transit'
      ? 'transit'
      : 'driving';

  const originParam =
    typeof originLat === 'number' && typeof originLng === 'number'
      ? `&origin=${originLat},${originLng}`
      : '';

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destLat},${destLng}&travelmode=${travelmode}&dir_action=navigate`;
  const wazeUrl = `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;

  return {
    googleMapsUrl,
    wazeUrl,
  };
}

export function formatRemainingDurationClock(minutes: number): string {
  const safeMin = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(safeMin / 60);
  const mins = safeMin % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
