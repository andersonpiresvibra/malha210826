import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as L from 'leaflet';
import { Navigation, RotateCcw, RotateCw, Compass } from 'lucide-react';
import {
  GoogleComputedRouteResult,
  snapAndReverseGeocodeGps,
  decodeGooglePolyline,
} from '../../services/googleMapsService';

export interface InteractiveGoogleRouteMapProps {
  isDark?: boolean;
  originLat?: number;
  originLng?: number;
  originLabel: string;
  destLat?: number;
  destLng?: number;
  destLabel: string;
  userAvatarUrl?: string;
  routeData: GoogleComputedRouteResult | null;
  initialDistanceKm?: number;
  initialEtaMinutes?: number;
  fallbackEmbedUrl?: string;
  extraWaypoints?: Array<{
    id: string;
    lat: number;
    lng: number;
    label: string;
    badgeColor?: string;
    textColor?: string;
    onSelect?: () => void;
  }>;
  onLiveGpsUpdate?: (lat: number, lng: number, snappedStreet?: string) => void;
  onDestinationReachedChange?: (reached: boolean) => void;
  onSpeedUpdate?: (speedKmh: number) => void;
  onManeuverUpdate?: (maneuver: {
    instruction: string;
    distanceText: string;
    maneuver: string;
  }) => void;
  onTelemetryUpdate?: (distanceKm: number, etaMinutes: number) => void;
}

function hapticLight() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  } catch {}
}

function isValidAvatarUrlString(val?: string | null): val is string {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length < 12) return false;
  if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '[object Object]') return false;
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  );
}

export function computeHaversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function computeRoadDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const straight = computeHaversineKm(lat1, lng1, lat2, lng2);
  if (straight <= 0.05) return Number(straight.toFixed(2));
  return Number((straight * 1.32).toFixed(1));
}

export function computeBearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lng2 - lng1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function projectPointAhead(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceKm: number
): { lat: number; lng: number } {
  const R = 6371;
  const d = distanceKm / R;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lon2 * 180) / Math.PI,
  };
}

function smoothAngleDeg(prevDeg: number, nextDeg: number, factor = 0.35): number {
  const diff = ((((nextDeg - prevDeg) % 360) + 540) % 360) - 180;
  return (prevDeg + diff * factor + 360) % 360;
}

function angleDiffDeg(a: number, b: number): number {
  return Math.abs(((((a - b) % 360) + 540) % 360) - 180);
}

/**
 * MAP-MATCHING ORTOGONAL CONTÍNUO (Snap-to-Polyline):
 * Projeta a coordenada GPS sobre o segmento exato da rua e calcula o azimute ~45m à frente.
 */
export function findForwardRouteBearingAndRemainingPath(
  userLat: number,
  userLng: number,
  path: Array<{ lat: number; lng: number }>,
  destLat: number,
  destLng: number
): {
  forwardBearingDeg: number;
  snappedLat: number;
  snappedLng: number;
  remainingPath: Array<{ lat: number; lng: number }>;
  closestIndex: number;
  isOffRoute: boolean;
} {
  if (!path || path.length < 2) {
    return {
      forwardBearingDeg: computeBearingDeg(userLat, userLng, destLat, destLng),
      snappedLat: userLat,
      snappedLng: userLng,
      remainingPath: path || [],
      closestIndex: 0,
      isOffRoute: false,
    };
  }

  const cosLat = Math.cos((userLat * Math.PI) / 180);
  let bestSegIdx = 0;
  let bestDistSq = Infinity;
  let bestProjLat = path[0].lat;
  let bestProjLng = path[0].lng;

  for (let i = 0; i < path.length - 1; i++) {
    const A = path[i];
    const B = path[i + 1];
    const vx = (B.lng - A.lng) * cosLat;
    const vy = B.lat - A.lat;
    const wx = (userLng - A.lng) * cosLat;
    const wy = userLat - A.lat;

    const c1 = wx * vx + wy * vy;
    const c2 = vx * vx + vy * vy;
    let t = 0;
    if (c2 > 1e-12) {
      t = Math.max(0, Math.min(1, c1 / c2));
    }

    const projLat = A.lat + t * (B.lat - A.lat);
    const projLng = A.lng + t * (B.lng - A.lng);
    const dx = (userLng - projLng) * cosLat;
    const dy = userLat - projLat;
    const dSq = dx * dx + dy * dy;

    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestSegIdx = i;
      bestProjLat = projLat;
      bestProjLng = projLng;
    }
  }

  const distFromRoadMeters =
    computeHaversineKm(userLat, userLng, bestProjLat, bestProjLng) * 1000;
  const isOffRoute = distFromRoadMeters > 220;

  const snappedLat = distFromRoadMeters <= 95 ? bestProjLat : userLat;
  const snappedLng = distFromRoadMeters <= 95 ? bestProjLng : userLng;

  let lookAheadIdx = Math.min(bestSegIdx + 1, path.length - 1);
  let accMeters = 0;
  let prevPt = { lat: snappedLat, lng: snappedLng };
  for (let j = bestSegIdx + 1; j < path.length; j++) {
    const segMeters =
      computeHaversineKm(prevPt.lat, prevPt.lng, path[j].lat, path[j].lng) * 1000;
    accMeters += segMeters;
    lookAheadIdx = j;
    prevPt = path[j];
    if (accMeters >= 45) break;
  }

  const targetPt = path[lookAheadIdx] || { lat: destLat, lng: destLng };
  const segStart = path[bestSegIdx];
  const segEnd = path[Math.min(bestSegIdx + 1, path.length - 1)];

  const distToTargetMeters =
    computeHaversineKm(snappedLat, snappedLng, targetPt.lat, targetPt.lng) * 1000;

  const forwardBearingDeg =
    distToTargetMeters >= 4
      ? computeBearingDeg(snappedLat, snappedLng, targetPt.lat, targetPt.lng)
      : computeBearingDeg(segStart.lat, segStart.lng, segEnd.lat, segEnd.lng);

  return {
    forwardBearingDeg,
    snappedLat,
    snappedLng,
    remainingPath: [{ lat: snappedLat, lng: snappedLng }, ...path.slice(bestSegIdx + 1)],
    closestIndex: bestSegIdx,
    isOffRoute,
  };
}

function createPinBadge(bgHex: string, textHex: string, labelText: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'vagou-rounded-box';
  el.style.background = bgHex;
  el.style.color = textHex;
  el.style.padding = '3px 7px';
  el.style.borderRadius = '4px';
  el.style.fontWeight = '800';
  el.style.fontSize = '10.5px';
  el.style.fontFamily = 'Poppins, sans-serif';
  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
  el.style.whiteSpace = 'nowrap';
  el.style.transform = 'rotate(var(--map-counter-rotate, 0deg))';
  el.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)';
  el.textContent = labelText;
  return el;
}

function resolveActiveUserAvatarUrl(propAvatarUrl?: string): string {
  if (isValidAvatarUrlString(propAvatarUrl)) return propAvatarUrl.trim();
  if (typeof window !== 'undefined') {
    const savedAvatar = localStorage.getItem('vagou_user_avatar') || '';
    if (isValidAvatarUrlString(savedAvatar)) return savedAvatar.trim();
  }
  return '';
}

function createDirectionalUserMarkerElement(avatarUrl?: string): {
  container: HTMLDivElement;
  rotor: HTMLDivElement;
} {
  const hasValidPhoto = isValidAvatarUrlString(avatarUrl);

  const container = document.createElement('div');
  container.style.width = '56px';
  container.style.height = '56px';
  container.style.position = 'relative';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.pointerEvents = 'none';

  const rotor = document.createElement('div');
  rotor.className = 'vagou-nav-rotor';
  rotor.style.position = 'relative';
  rotor.style.width = '56px';
  rotor.style.height = '56px';
  rotor.style.display = 'flex';
  rotor.style.alignItems = 'center';
  rotor.style.justifyContent = 'center';
  rotor.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
  rotor.style.transformOrigin = '50% 50%';

  const visionCone = document.createElement('div');
  visionCone.style.position = 'absolute';
  visionCone.style.top = '-16px';
  visionCone.style.left = '50%';
  visionCone.style.transform = 'translateX(-50%)';
  visionCone.style.width = '42px';
  visionCone.style.height = '40px';
  visionCone.style.background =
    'linear-gradient(to top, rgba(16, 185, 129, 0.55) 0%, rgba(16, 185, 129, 0.0) 100%)';
  visionCone.style.clipPath = 'polygon(0% 0%, 100% 0%, 65% 100%, 35% 100%)';
  visionCone.style.borderRadius = '50% 50% 0 0';

  const defaultPuck = document.createElement('div');
  defaultPuck.className = 'vagou-puck-circle';
  defaultPuck.style.position = 'relative';
  defaultPuck.style.width = '26px';
  defaultPuck.style.height = '26px';
  defaultPuck.style.borderRadius = '9999px';
  defaultPuck.style.background = '#10b981';
  defaultPuck.style.border = '3px solid #ffffff';
  defaultPuck.style.boxShadow =
    '0 3px 12px rgba(0, 0, 0, 0.45), 0 0 0 4px rgba(16, 185, 129, 0.35)';
  defaultPuck.style.display = hasValidPhoto ? 'none' : 'flex';
  defaultPuck.style.alignItems = 'center';
  defaultPuck.style.justifyContent = 'center';

  const arrow = document.createElement('div');
  arrow.style.width = '0';
  arrow.style.height = '0';
  arrow.style.borderLeft = '5px solid transparent';
  arrow.style.borderRight = '5px solid transparent';
  arrow.style.borderBottom = '9px solid #ffffff';
  arrow.style.transform = 'translateY(-1px)';

  defaultPuck.appendChild(arrow);
  rotor.appendChild(visionCone);
  rotor.appendChild(defaultPuck);

  if (hasValidPhoto && avatarUrl) {
    const directionTip = document.createElement('div');
    directionTip.style.position = 'absolute';
    directionTip.style.top = '1px';
    directionTip.style.left = '50%';
    directionTip.style.transform = 'translateX(-50%)';
    directionTip.style.width = '0';
    directionTip.style.height = '0';
    directionTip.style.borderLeft = '6px solid transparent';
    directionTip.style.borderRight = '6px solid transparent';
    directionTip.style.borderBottom = '10px solid #10b981';
    directionTip.style.filter = 'drop-shadow(0 -1px 2px rgba(255,255,255,0.95))';
    rotor.appendChild(directionTip);

    const avatarBadge = document.createElement('div');
    avatarBadge.className = 'vagou-puck-circle';
    avatarBadge.style.position = 'absolute';
    avatarBadge.style.width = '34px';
    avatarBadge.style.height = '34px';
    avatarBadge.style.borderRadius = '9999px';
    avatarBadge.style.border = '2.5px solid #10b981';
    avatarBadge.style.boxShadow =
      '0 2px 10px rgba(0, 0, 0, 0.45), 0 0 0 2px #ffffff, 0 0 0 5px rgba(16, 185, 129, 0.3)';
    avatarBadge.style.background = '#0f172a';
    avatarBadge.style.overflow = 'hidden';
    avatarBadge.style.display = 'flex';
    avatarBadge.style.alignItems = 'center';
    avatarBadge.style.justifyContent = 'center';
    avatarBadge.style.zIndex = '2';
    avatarBadge.style.transform = 'rotate(var(--map-counter-rotate, 0deg))';
    avatarBadge.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)';

    const img = document.createElement('img');
    img.src = avatarUrl.trim();
    img.alt = 'Sua Posição';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.onerror = () => {
      avatarBadge.style.display = 'none';
      directionTip.style.display = 'none';
      defaultPuck.style.display = 'flex';
    };

    avatarBadge.appendChild(img);
    container.appendChild(rotor);
    container.appendChild(avatarBadge);
  } else {
    container.appendChild(rotor);
  }

  return { container, rotor };
}

export const InteractiveGoogleRouteMap: React.FC<InteractiveGoogleRouteMapProps> = ({
  isDark = true,
  originLat = -23.4285,
  originLng = -46.4815,
  destLat = -23.4258,
  destLng = -46.4685,
  destLabel,
  userAvatarUrl,
  routeData,
  initialDistanceKm,
  initialEtaMinutes,
  extraWaypoints = [],
  onLiveGpsUpdate,
  onDestinationReachedChange,
  onSpeedUpdate,
  onManeuverUpdate,
  onTelemetryUpdate,
}) => {
  const effectiveUserAvatar = useMemo(
    () => resolveActiveUserAvatarUrl(userAvatarUrl),
    [userAvatarUrl]
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletTileLayerRef = useRef<L.TileLayer | null>(null);
  const leafletOuterPolylineRef = useRef<L.Polyline | null>(null);
  const leafletInnerPolylineRef = useRef<L.Polyline | null>(null);
  const leafletOriginMarkerRef = useRef<L.Marker | null>(null);
  const leafletDestMarkerRef = useRef<L.Marker | null>(null);
  const leafletUserMarkerRef = useRef<L.Marker | null>(null);
  const extraMarkersRef = useRef<L.Marker[]>([]);
  const userMarkerRotorRef = useRef<HTMLDivElement | null>(null);

  const [isFollowingGps, setIsFollowingGps] = useState<boolean>(true);
  const [isCourseUp, setIsCourseUp] = useState<boolean>(true);
  const isCourseUpRef = useRef<boolean>(true);
  isCourseUpRef.current = isCourseUp;

  const [isManualRotationLocked, setIsManualRotationLocked] = useState<boolean>(false);
  const isManualRotationLockedRef = useRef<boolean>(false);
  isManualRotationLockedRef.current = isManualRotationLocked;

  const [mapBearingDeg, setMapBearingDeg] = useState<number>(0);
  const mapBearingDegRef = useRef<number>(0);
  const [stageSizePx, setStageSizePx] = useState<number>(1800);
  const [isTouchInteracting, setIsTouchInteracting] = useState<boolean>(false);
  const dragStateRef = useRef<{
    active: boolean;
    mode: 'pan' | 'rotate';
    pointerId: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  }>({
    active: false,
    mode: 'pan',
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    moved: false,
  });

  // Mede dinamicamente a diagonal do viewport para que o palco rotacionado nunca exiba cantos vazios
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateStageGeometry = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const diagonal = Math.ceil(Math.hypot(rect.width, rect.height)) + 120;
        const nextSize = Math.max(1200, diagonal);
        setStageSizePx((prev) => (Math.abs(prev - nextSize) > 8 ? nextSize : prev));
        window.requestAnimationFrame(() => {
          try {
            leafletMapRef.current?.invalidateSize({ animate: false });
          } catch {}
        });
      }
    };

    updateStageGeometry();
    const ro = new ResizeObserver(updateStageGeometry);
    ro.observe(el);
    window.addEventListener('resize', updateStageGeometry);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateStageGeometry);
    };
  }, []);

  const [, setIsCalculatingRoad] = useState<boolean>(true);
  const [, setCurrentSpeedKmh] = useState<number>(0);
  const [, setActiveManeuver] = useState<{
    instruction: string;
    distanceText: string;
    maneuver: string;
  }>({
    instruction: `Em direção a ${destLabel}`,
    distanceText: 'Em rota',
    maneuver: 'TURN-LEFT',
  });

  const roadPathRef = useRef<Array<{ lat: number; lng: number }>>([]);
  const lastGpsFixRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const lastSnappedApiTsRef = useRef<number>(0);
  const lastRerouteTsRef = useRef<number>(0);
  const hasActiveGpsFollowRef = useRef<boolean>(true);
  const userManualPanUntilRef = useRef<number>(0);

  const forwardHeadingRef = useRef<number>(
    computeBearingDeg(originLat, originLng, destLat, destLng)
  );
  const routeLookAheadBearingRef = useRef<number>(
    computeBearingDeg(originLat, originLng, destLat, destLng)
  );
  const liveUserPosRef = useRef<{ lat: number; lng: number }>({
    lat: originLat,
    lng: originLng,
  });

  const onLiveGpsUpdateRef = useRef(onLiveGpsUpdate);
  onLiveGpsUpdateRef.current = onLiveGpsUpdate;

  const onDestinationReachedRef = useRef(onDestinationReachedChange);
  onDestinationReachedRef.current = onDestinationReachedChange;

  const onSpeedUpdateRef = useRef(onSpeedUpdate);
  onSpeedUpdateRef.current = onSpeedUpdate;

  const onManeuverUpdateRef = useRef(onManeuverUpdate);
  onManeuverUpdateRef.current = onManeuverUpdate;

  const onTelemetryUpdateRef = useRef(onTelemetryUpdate);
  onTelemetryUpdateRef.current = onTelemetryUpdate;

  const updateManeuver = useCallback(
    (m: { instruction: string; distanceText: string; maneuver: string }) => {
      setActiveManeuver(m);
      onManeuverUpdateRef.current?.(m);
    },
    []
  );

  const baseDistanceKm = routeData?.distanceKm ?? initialDistanceKm ?? 3.2;
  const baseEtaMinutes = routeData?.etaMinutes ?? initialEtaMinutes ?? 14;

  const [remainingDistanceKm, setRemainingDistanceKm] = useState<number>(baseDistanceKm);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(baseEtaMinutes);

  useEffect(() => {
    setRemainingDistanceKm(baseDistanceKm);
    setRemainingMinutes(baseEtaMinutes);
    onTelemetryUpdateRef.current?.(baseDistanceKm, baseEtaMinutes);
  }, [baseDistanceKm, baseEtaMinutes]);

  const hasReachedDestination = remainingDistanceKm <= 0.15 || remainingMinutes <= 0;

  useEffect(() => {
    onDestinationReachedRef.current?.(hasReachedDestination);
  }, [hasReachedDestination]);

  // Sincroniza quando originLat/originLng mudam externamente
  useEffect(() => {
    liveUserPosRef.current = { lat: originLat, lng: originLng };
  }, [originLat, originLng]);

  const syncPositionAndOrientation = useCallback(
    (
      userLat: number,
      userLng: number,
      headingDeg: number,
      shouldPanCamera: boolean,
      forceInstant = false
    ) => {
      liveUserPosRef.current = { lat: userLat, lng: userLng };
      const lmap = leafletMapRef.current;
      if (!lmap) return;

      if (leafletUserMarkerRef.current) {
        leafletUserMarkerRef.current.setLatLng([userLat, userLng]);
      }

      if (userMarkerRotorRef.current) {
        userMarkerRotorRef.current.style.transform = `rotate(${headingDeg.toFixed(1)}deg)`;
      }

      const isManualPan = Date.now() < userManualPanUntilRef.current;
      const roadCourse = routeLookAheadBearingRef.current;

      if (!isManualPan && !isManualRotationLockedRef.current) {
        const targetMapBearing = isCourseUpRef.current ? roadCourse : 0;
        if (
          forceInstant ||
          angleDiffDeg(targetMapBearing, mapBearingDegRef.current) >= 1.2
        ) {
          const nextMapBearing = forceInstant
            ? targetMapBearing
            : smoothAngleDeg(mapBearingDegRef.current, targetMapBearing, 0.45);
          mapBearingDegRef.current = nextMapBearing;
          setMapBearingDeg(nextMapBearing);
        }
      }

      if (shouldPanCamera && !isManualPan) {
        const lookAheadCenter = isCourseUpRef.current
          ? projectPointAhead(userLat, userLng, roadCourse, 0.15)
          : { lat: userLat, lng: userLng };
        try {
          lmap.panTo([lookAheadCenter.lat, lookAheadCenter.lng], {
            animate: !forceInstant,
            duration: forceInstant ? 0 : 0.55,
            easeLinearity: 0.25,
          });
        } catch {}
      }
    },
    []
  );

  useEffect(() => {
    const containerEl = mapContainerRef.current;
    if (!containerEl) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const initialPos = liveUserPosRef.current;
    const lmap = L.map(containerEl, {
      center: [initialPos.lat, initialPos.lng],
      zoom: 17,
      zoomSnap: 1,
      zoomDelta: 1,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false,
      zoomControl: false,
      attributionControl: false,
    });

    const tileProviders = [
      {
        url: 'https://mt{s}.google.com/vt/lyrs=m&hl=pt-BR&x={x}&y={y}&z={z}',
        subdomains: ['0', '1', '2', '3'],
      },
      {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        subdomains: ['a'],
      },
    ];

    let currentProviderIdx = 0;
    let consecutiveTileErrors = 0;

    const mountTileLayer = (providerIdx: number) => {
      const provider = tileProviders[providerIdx] || tileProviders[0];
      if (leafletTileLayerRef.current) {
        try {
          lmap.removeLayer(leafletTileLayerRef.current);
        } catch {}
      }
      const layer = L.tileLayer(provider.url, {
        subdomains: provider.subdomains,
        maxZoom: 20,
        keepBuffer: 6,
        updateWhenIdle: false,
      });

      layer.on('tileload', () => {
        consecutiveTileErrors = 0;
      });

      layer.on('tileerror', () => {
        consecutiveTileErrors += 1;
        if (consecutiveTileErrors >= 4 && currentProviderIdx < tileProviders.length - 1) {
          consecutiveTileErrors = 0;
          currentProviderIdx += 1;
          mountTileLayer(currentProviderIdx);
        }
      });

      layer.addTo(lmap);
      leafletTileLayerRef.current = layer;
    };

    mountTileLayer(0);

    const outerPoly = L.polyline([], {
      color: isDark ? '#064e3b' : '#047857',
      weight: 9,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(lmap);

    const innerPoly = L.polyline([], {
      color: isDark ? '#10b981' : '#007a4d',
      weight: 5.5,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(lmap);

    leafletOuterPolylineRef.current = outerPoly;
    leafletInnerPolylineRef.current = innerPoly;

    const originIcon = L.divIcon({
      html: createPinBadge(isDark ? '#0f172a' : '#0f172a', '#ffffff', 'Saída'),
      className: 'vagou-leaflet-badge',
      iconSize: [60, 24],
      iconAnchor: [30, 12],
    });
    leafletOriginMarkerRef.current = L.marker([originLat, originLng], { icon: originIcon }).addTo(lmap);

    const destIcon = L.divIcon({
      html: createPinBadge(isDark ? '#10b981' : '#007a4d', '#ffffff', destLabel.slice(0, 22)),
      className: 'vagou-leaflet-badge',
      iconSize: [120, 24],
      iconAnchor: [60, 12],
    });
    leafletDestMarkerRef.current = L.marker([destLat, destLng], { icon: destIcon }).addTo(lmap);

    const { container, rotor } = createDirectionalUserMarkerElement(effectiveUserAvatar);
    userMarkerRotorRef.current = rotor;
    const userDivIcon = L.divIcon({
      html: container,
      className: 'vagou-leaflet-user-puck',
      iconSize: [56, 56],
      iconAnchor: [28, 28],
    });
    leafletUserMarkerRef.current = L.marker([initialPos.lat, initialPos.lng], {
      icon: userDivIcon,
      zIndexOffset: 1000,
    }).addTo(lmap);

    leafletMapRef.current = lmap;

    return () => {
      lmap.remove();
      leafletMapRef.current = null;
    };
  }, [isDark, effectiveUserAvatar]);

  // Atualiza label e coordenadas do marcador de destino quando destLabel/destLat/destLng mudam
  useEffect(() => {
    const lmap = leafletMapRef.current;
    if (!lmap || !leafletDestMarkerRef.current) return;
    const destIcon = L.divIcon({
      html: createPinBadge(isDark ? '#10b981' : '#007a4d', '#ffffff', destLabel.slice(0, 22)),
      className: 'vagou-leaflet-badge',
      iconSize: [120, 24],
      iconAnchor: [60, 12],
    });
    leafletDestMarkerRef.current.setIcon(destIcon);
    leafletDestMarkerRef.current.setLatLng([destLat, destLng]);
  }, [destLat, destLng, destLabel, isDark]);

  // Renderiza marcadores extras opcionais (ex: Pátios SBGR, Posições, Viaturas)
  useEffect(() => {
    const lmap = leafletMapRef.current;
    if (!lmap) return;

    extraMarkersRef.current.forEach((m) => {
      try {
        lmap.removeLayer(m);
      } catch {}
    });
    extraMarkersRef.current = [];

    for (const wp of extraWaypoints) {
      const badgeEl = createPinBadge(
        wp.badgeColor || (isDark ? '#1e293b' : '#0f172a'),
        wp.textColor || '#ffffff',
        wp.label
      );
      badgeEl.style.cursor = 'pointer';
      const icon = L.divIcon({
        html: badgeEl,
        className: 'vagou-leaflet-badge',
        iconSize: [86, 22],
        iconAnchor: [43, 11],
      });
      const marker = L.marker([wp.lat, wp.lng], { icon }).addTo(lmap);
      if (wp.onSelect) {
        marker.on('click', () => wp.onSelect?.());
      }
      extraMarkersRef.current.push(marker);
    }
  }, [extraWaypoints, isDark]);

  const applyRoadGeometry = useCallback(
    (roadPath: Array<{ lat: number; lng: number }>) => {
      if (!roadPath || roadPath.length <= 2) return;
      roadPathRef.current = roadPath;
      setIsCalculatingRoad(false);

      const startPt = roadPath[0];
      const endPt = roadPath[roadPath.length - 1];
      const currentPos = liveUserPosRef.current;

      const { forwardBearingDeg, snappedLat, snappedLng, remainingPath } =
        findForwardRouteBearingAndRemainingPath(
          currentPos.lat,
          currentPos.lng,
          roadPath,
          endPt.lat,
          endPt.lng
        );

      const polyToDraw = remainingPath.length > 2 ? remainingPath : roadPath;
      routeLookAheadBearingRef.current = forwardBearingDeg;
      forwardHeadingRef.current = forwardBearingDeg;

      leafletOuterPolylineRef.current?.setLatLngs(
        polyToDraw.map((p) => [p.lat, p.lng] as [number, number])
      );
      leafletInnerPolylineRef.current?.setLatLngs(
        polyToDraw.map((p) => [p.lat, p.lng] as [number, number])
      );
      leafletOriginMarkerRef.current?.setLatLng([startPt.lat, startPt.lng]);
      leafletDestMarkerRef.current?.setLatLng([endPt.lat, endPt.lng]);

      syncPositionAndOrientation(snappedLat, snappedLng, forwardBearingDeg, true, true);

      if (routeData?.steps && routeData.steps.length > 0) {
        const step = routeData.steps[0];
        updateManeuver({
          instruction: step.instruction,
          distanceText: step.distanceText,
          maneuver: step.maneuver,
        });
      }
    },
    [syncPositionAndOrientation, routeData, updateManeuver]
  );

  const fetchRealRoadNetwork = useCallback(
    async (startLat: number, startLng: number, targetLat: number, targetLng: number) => {
      setIsCalculatingRoad(true);
      try {
        const routeRes = await fetch('/api/geo/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originLat: startLat,
            originLng: startLng,
            destLat: targetLat,
            destLng: targetLng,
            destAddress: destLabel,
            travelMode: 'DRIVE',
          }),
        });
        if (routeRes.ok) {
          const routeJson = await routeRes.json();
          const encoded = routeJson?.routes?.[0]?.polyline?.encodedPolyline;
          if (encoded) {
            const pts = decodeGooglePolyline(encoded);
            if (pts.length > 2) {
              applyRoadGeometry(pts);
              return true;
            }
          }
        }
      } catch {}
      setIsCalculatingRoad(false);
      return false;
    },
    [applyRoadGeometry, destLabel]
  );

  useEffect(() => {
    if (routeData?.decodedPath && routeData.decodedPath.length > 2) {
      applyRoadGeometry(routeData.decodedPath);
      return;
    }
    fetchRealRoadNetwork(liveUserPosRef.current.lat, liveUserPosRef.current.lng, destLat, destLng);
  }, [routeData, destLat, destLng, applyRoadGeometry, fetchRealRoadNetwork]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    const avgMinutesPerKm = baseDistanceKm > 0 ? baseEtaMinutes / baseDistanceKm : 4.2;

    const handleGpsFix = async (pos: GeolocationPosition, isInitial = false) => {
      const rawLat = pos.coords.latitude;
      const rawLng = pos.coords.longitude;
      const gpsSpeed = pos.coords.speed ?? 0;

      const kmh = Math.max(0, Math.round(gpsSpeed * 3.6));
      setCurrentSpeedKmh(kmh);
      onSpeedUpdateRef.current?.(kmh);

      const prev = lastGpsFixRef.current;
      const now = Date.now();
      const movedMeters = prev
        ? computeHaversineKm(prev.lat, prev.lng, rawLat, rawLng) * 1000
        : 9999;

      if (!isInitial && prev && movedMeters < 4.5 && now - prev.ts < 4000) return;
      lastGpsFixRef.current = { lat: rawLat, lng: rawLng, ts: now };

      const {
        forwardBearingDeg,
        snappedLat,
        snappedLng,
        remainingPath,
        isOffRoute,
      } = findForwardRouteBearingAndRemainingPath(
        rawLat,
        rawLng,
        roadPathRef.current,
        destLat,
        destLng
      );

      liveUserPosRef.current = { lat: snappedLat, lng: snappedLng };
      routeLookAheadBearingRef.current = forwardBearingDeg;
      forwardHeadingRef.current = forwardBearingDeg;

      if (remainingPath.length > 2) {
        leafletOuterPolylineRef.current?.setLatLngs(
          remainingPath.map((p) => [p.lat, p.lng] as [number, number])
        );
        leafletInnerPolylineRef.current?.setLatLngs(
          remainingPath.map((p) => [p.lat, p.lng] as [number, number])
        );
      }

      if (isOffRoute && now - lastRerouteTsRef.current >= 6000) {
        lastRerouteTsRef.current = now;
        fetchRealRoadNetwork(rawLat, rawLng, destLat, destLng);
      }

      syncPositionAndOrientation(snappedLat, snappedLng, forwardBearingDeg, true, isInitial);

      const liveDistKm = computeRoadDistanceKm(snappedLat, snappedLng, destLat, destLng);
      if (liveDistKm <= 250) {
        setRemainingDistanceKm(liveDistKm);
        const nextMin = liveDistKm <= 0.15 ? 0 : Math.max(1, Math.round(liveDistKm * avgMinutesPerKm));
        setRemainingMinutes(nextMin);
        onTelemetryUpdateRef.current?.(liveDistKm, nextMin);
      }

      if (isInitial || now - lastSnappedApiTsRef.current >= 15000) {
        lastSnappedApiTsRef.current = now;
        const snapped = await snapAndReverseGeocodeGps(rawLat, rawLng);
        onLiveGpsUpdateRef.current?.(snappedLat, snappedLng, snapped?.streetName);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => handleGpsFix(pos, false),
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [destLat, destLng, baseDistanceKm, baseEtaMinutes, syncPositionAndOrientation, fetchRealRoadNetwork]);

  // Funções de Rotação Manual (Botões Esquerda / Direita & Bússola Norte / Course-Up)
  const handleRotateByStep = (deltaDeg: number) => {
    hapticLight();
    setIsManualRotationLocked(true);
    isManualRotationLockedRef.current = true;
    // deltaDeg > 0 gira o mapa visualmente para a direita; deltaDeg < 0 gira para a esquerda
    const nextBearing = (mapBearingDegRef.current - deltaDeg + 360) % 360;
    mapBearingDegRef.current = nextBearing;
    setMapBearingDeg(nextBearing);
  };

  const handleToggleCompassMode = () => {
    hapticLight();
    if (isManualRotationLockedRef.current || Math.round(mapBearingDegRef.current) !== 0) {
      // Se estiver rotacionado, alinha com o Norte (0°)
      setIsManualRotationLocked(true);
      isManualRotationLockedRef.current = true;
      setIsCourseUp(false);
      isCourseUpRef.current = false;
      mapBearingDegRef.current = 0;
      setMapBearingDeg(0);
    } else {
      // Se já estiver em 0° Norte, reativa o modo automático Course-Up
      setIsManualRotationLocked(false);
      isManualRotationLockedRef.current = false;
      setIsCourseUp(true);
      isCourseUpRef.current = true;
      const roadCourse = routeLookAheadBearingRef.current;
      mapBearingDegRef.current = roadCourse;
      setMapBearingDeg(roadCourse);
    }
  };

  const handleRecenterGps = () => {
    hapticLight();
    userManualPanUntilRef.current = 0;
    setIsManualRotationLocked(false);
    isManualRotationLockedRef.current = false;
    setIsCourseUp(true);
    isCourseUpRef.current = true;
    setIsFollowingGps(true);
    hasActiveGpsFollowRef.current = true;
    const pos = liveUserPosRef.current;
    syncPositionAndOrientation(pos.lat, pos.lng, routeLookAheadBearingRef.current, true, false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
    const targetEl = e.target as HTMLElement | null;
    if (targetEl?.closest('button, a, input, select, .vagou-leaflet-badge')) {
      return;
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const isRotateGesture = e.button === 2 || e.shiftKey;
    dragStateRef.current = {
      active: true,
      mode: isRotateGesture ? 'rotate' : 'pan',
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
    };
    setIsTouchInteracting(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;

    const dx = e.clientX - st.lastX;
    const dy = e.clientY - st.lastY;
    if (!st.moved && Math.hypot(dx, dy) < 2) return;

    st.moved = true;
    st.lastX = e.clientX;
    st.lastY = e.clientY;

    if (st.mode === 'rotate') {
      // Arrastar com botão direito ou Shift gira o mapa suavemente para a direita ou esquerda
      setIsManualRotationLocked(true);
      isManualRotationLockedRef.current = true;
      const nextBearing = (mapBearingDegRef.current - dx * 0.45 + 360) % 360;
      mapBearingDegRef.current = nextBearing;
      setMapBearingDeg(nextBearing);
      return;
    }

    userManualPanUntilRef.current = Date.now() + 60000;
    if (hasActiveGpsFollowRef.current) {
      hasActiveGpsFollowRef.current = false;
      setIsFollowingGps(false);
    }

    const lmap = leafletMapRef.current;
    if (!lmap) return;

    const theta = (mapBearingDegRef.current * Math.PI) / 180;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const localDx = dx * cosT - dy * sinT;
    const localDy = dx * sinT + dy * cosT;

    lmap.panBy([-localDx, -localDy], { animate: false });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (st.pointerId !== e.pointerId) return;
    st.active = false;
    st.pointerId = -1;
    setIsTouchInteracting(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const normalizedHeadingDisplay = ((Math.round(mapBearingDeg) % 360) + 360) % 360;

  return (
    <div
      ref={viewportRef}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`vagou-navigation-root relative flex-1 w-full h-full min-h-[340px] overflow-hidden flex flex-col select-none touch-none cursor-grab active:cursor-grabbing ${
        isDark ? 'bg-slate-950' : 'bg-slate-200'
      }`}
    >
      {/* PALCO DINÂMICO PELA DIAGONAL DO VIEWPORT — COBERTURA 100% EM QUALQUER ROTAÇÃO */}
      <div
        className={`absolute z-0 ${isDark ? 'vagou-map-dark' : ''}`}
        style={
          {
            width: `${stageSizePx}px`,
            height: `${stageSizePx}px`,
            left: '50%',
            top: '50%',
            '--map-counter-rotate': `${mapBearingDeg.toFixed(1)}deg`,
            transform: `translate(-50%, -50%) rotate(${-mapBearingDeg.toFixed(1)}deg)`,
            transition: isTouchInteracting
              ? 'none'
              : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
          } as React.CSSProperties
        }
      >
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* BARRA DE CONTROLE DE ROTAÇÃO (ESQUERDA / BÚSSOLA / DIREITA) + RECENTRALIZAR */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        <div
          className={`vagou-rounded-box flex items-center border shadow-lg ${
            isDark
              ? 'bg-slate-900/95 border-slate-700 text-white'
              : 'bg-white/95 border-slate-300 text-slate-900'
          }`}
        >
          <button
            type="button"
            onClick={() => handleRotateByStep(-20)}
            title="Girar mapa para a esquerda (ou arraste com o botão direito do mouse)"
            className={`px-2.5 py-1.5 flex items-center gap-1 text-xs font-bold transition cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px]">Esq.</span>
          </button>

          <button
            type="button"
            onClick={handleToggleCompassMode}
            title="Alternar entre Norte (0°) e Proa da Rota (Course-Up)"
            className={`px-2.5 py-1.5 border-x flex items-center gap-1 text-[11px] font-mono tabular-nums font-bold transition cursor-pointer ${
              isDark
                ? 'border-slate-700 hover:bg-slate-800 text-emerald-400'
                : 'border-slate-200 hover:bg-slate-100 text-[#007a4d]'
            }`}
          >
            <Compass
              className="w-3.5 h-3.5 shrink-0 transition-transform duration-300"
              style={{ transform: `rotate(${-mapBearingDeg.toFixed(1)}deg)` }}
            />
            <span>{normalizedHeadingDisplay}°</span>
          </button>

          <button
            type="button"
            onClick={() => handleRotateByStep(20)}
            title="Girar mapa para a direita (ou arraste com o botão direito do mouse)"
            className={`px-2.5 py-1.5 flex items-center gap-1 text-xs font-bold transition cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
            }`}
          >
            <span className="hidden sm:inline text-[11px]">Dir.</span>
            <RotateCw className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        {(!isFollowingGps || isManualRotationLocked) && (
          <button
            type="button"
            onClick={handleRecenterGps}
            className="vagou-rounded-box vagou-white-emerald px-3 py-1.5 rounded-[4px] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-white" />
            <span className="text-white">Recentralizar</span>
          </button>
        )}
      </div>
    </div>
  );
};
