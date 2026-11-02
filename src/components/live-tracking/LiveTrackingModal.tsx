import React, { useState, useEffect, useRef } from 'react';
import {
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
  ArrowUp,
  Gauge,
  AlertTriangle,
  Radio,
  ChevronRight,
  Share2,
  CheckCircle2,
  ExternalLink,
  Navigation,
  MapPin,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { RouteTrafficAlertItem, TransportMode } from '../../types';
import {
  GoogleComputedRouteResult,
  computeGoogleDetailedRoute,
} from '../../services/googleMapsService';
import {
  buildUniversalNavigationLinks,
  formatRemainingDurationClock,
} from '../../services/transportService';
import { InteractiveGoogleRouteMap } from './InteractiveGoogleRouteMap';

// 1. Renderizador da Seta de Direção (100% da altura do container, sem texto)
export function renderManeuverIcon(maneuver: string, instruction: string) {
  const text = (instruction || '').toLowerCase();
  const m = (maneuver || '').toUpperCase();
  const iconClass = 'w-full h-full text-amber-500 dark:text-amber-400 stroke-[2.75] shrink-0';
  if (m.includes('LEFT') || text.includes('esquerda')) {
    return <CornerUpLeft className={iconClass} />;
  }
  if (m.includes('RIGHT') || text.includes('direita')) {
    return <CornerUpRight className={iconClass} />;
  }
  if (m.includes('UTURN') || text.includes('retorno')) {
    return <RotateCcw className={iconClass} />;
  }
  return <ArrowUp className={iconClass} />;
}

// 2. Container de Trânsito, Acidentes e Radares (Waze Live Map + OpenStreetMap Overpass)
export const WazeTrafficAlertsContainer: React.FC<{
  isDark: boolean;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  maneuverDistanceText?: string;
}> = ({ isDark, originLat, originLng, destLat, destLng, maneuverDistanceText }) => {
  const [alerts, setAlerts] = useState<RouteTrafficAlertItem[]>([
    {
      id: 'init-radar',
      type: 'radar',
      title: 'Radar 50 km/h',
      subtitle: 'Fiscalização na via',
      distanceMeters: 320,
      speedLimitKmh: 50,
      source: 'osm_overpass',
    },
    {
      id: 'init-jam',
      type: 'jam',
      title: 'Trânsito moderado',
      subtitle: 'Fluxo urbano à frente',
      distanceMeters: 650,
      source: 'waze',
    },
  ]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/traffic/route-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originLat, originLng, destLat, destLng }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !Array.isArray(data?.alerts) || data.alerts.length === 0) return;
        setAlerts(data.alerts);
        setActiveIndex(0);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [originLat.toFixed(3), originLng.toFixed(3), destLat.toFixed(3), destLng.toFixed(3)]);

  // Alternância automática a cada 5,5s
  useEffect(() => {
    if (alerts.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % Math.max(1, alerts.length));
    }, 5500);
    return () => window.clearInterval(timer);
  }, [alerts.length]);

  const currentAlert = alerts[activeIndex % alerts.length] || alerts[0];
  const distLabel =
    currentAlert.distanceMeters >= 1000
      ? `${(currentAlert.distanceMeters / 1000).toFixed(1)} km`
      : `${currentAlert.distanceMeters} m`;

  return (
    <button
      type="button"
      onClick={() => setActiveIndex((prev) => (prev + 1) % Math.max(1, alerts.length))}
      className={`vagou-rounded-box flex-1 h-11 sm:h-12 px-2.5 rounded-[4px] border flex items-center justify-between gap-2 min-w-0 text-left transition cursor-pointer ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="vagou-rounded-box w-7 h-7 rounded-[4px] bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
          {currentAlert.type === 'radar' ? (
            <Gauge className="w-4 h-4 stroke-[2.5]" />
          ) : currentAlert.type === 'accident' ? (
            <AlertTriangle className="w-4 h-4 stroke-[2.5] text-rose-400" />
          ) : (
            <Radio className="w-4 h-4 stroke-[2.5] text-amber-400" />
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-extrabold font-['Poppins'] truncate text-slate-900 dark:text-white leading-tight">
              {currentAlert.title}
            </span>
            <span className="text-[10px] font-mono tabular-nums font-bold text-amber-500 dark:text-amber-400 shrink-0">
              • {distLabel}
            </span>
          </div>
          <span className="text-[10px] font-semibold truncate text-slate-500 dark:text-slate-400 leading-tight">
            {currentAlert.subtitle}
            {maneuverDistanceText ? ` • Curva ${maneuverDistanceText}` : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">
          {(activeIndex % alerts.length) + 1}/{alerts.length}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </div>
    </button>
  );
};

// 3. Rodapé do Mapa com Menu Swipe em Efeito Vidro (MapGlassBottomSwipeMenu)
export const MapGlassBottomSwipeMenu: React.FC<{
  isDark: boolean;
  distanceKm: number;
  etaMinutes: number;
  speedKmh: number;
  originLat?: number;
  originLng?: number;
  destLat: number;
  destLng: number;
  destLabel: string;
  hasReachedGeofence?: boolean;
  shareButtonLabel?: string;
  onShareLiveLocation?: () => void;
}> = ({
  isDark,
  distanceKm,
  etaMinutes,
  speedKmh,
  originLat,
  originLng,
  destLat,
  destLng,
  destLabel,
  hasReachedGeofence = false,
  shareButtonLabel = 'Compartilhar com o Salão',
  onShareLiveLocation,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isShared, setIsShared] = useState<boolean>(false);
  const touchStartYRef = useRef<number | null>(null);

  // Aciona geofence automático quando <= 150m (0.15 km)
  useEffect(() => {
    if (distanceKm <= 0.15 || hasReachedGeofence) {
      setIsShared(true);
    }
  }, [distanceKm, hasReachedGeofence]);

  const { googleMapsUrl, wazeUrl } = buildUniversalNavigationLinks({
    originLat,
    originLng,
    destLat,
    destLng,
    destLabel,
  });

  const formattedDist = `${Math.max(0.1, distanceKm).toFixed(1).replace('.', ',')} km`;
  const formattedTime = formatRemainingDurationClock(etaMinutes);
  const formattedSpeed = `${Math.max(0, Math.round(speedKmh))} km/h`;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    const deltaY = endY - touchStartYRef.current;
    if (deltaY < -24) {
      setIsExpanded(true);
    } else if (deltaY > 24) {
      setIsExpanded(false);
    }
    touchStartYRef.current = null;
  };

  const handleShareClick = () => {
    setIsShared(true);
    onShareLiveLocation?.();
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`vagou-glass-sheet absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t backdrop-blur-xl transition-all duration-300 ${
        isDark
          ? 'bg-slate-900/60 border-white/20 text-white'
          : 'bg-white/75 border-white/85 text-slate-900'
      }`}
    >
      {/* Alça superior de swipe + clique */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full pt-2 pb-1.5 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        aria-label={isExpanded ? 'Recolher menu de telemetria' : 'Expandir menu de telemetria'}
      >
        <div
          className={`vagou-puck-circle w-10 h-1 rounded-full ${
            isDark ? 'bg-white/35' : 'bg-slate-400/70'
          }`}
        />
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
          {isExpanded ? (
            <>
              <ChevronDown className="w-3 h-3" /> Recolher
            </>
          ) : (
            <>
              <ChevronUp className="w-3 h-3" /> Telemetria & Ações
            </>
          )}
        </span>
      </button>

      {/* Barra de Telemetria em Vidro Alpha Claro (3 colunas fixas) */}
      <div className="px-3 pb-2.5">
        <div
          className={`vagou-rounded-box grid grid-cols-3 divide-x rounded-[4px] border px-2 py-2 ${
            isDark
              ? 'bg-white/10 border-white/15 divide-white/15'
              : 'bg-white/95 border-slate-300 divide-slate-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col items-center justify-center px-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Distância
            </span>
            <span
              className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                isDark ? 'text-emerald-400' : 'text-[#007a4d]'
              }`}
            >
              {formattedDist}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Temp. Restante
            </span>
            <span
              className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {formattedTime}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Velocidade
            </span>
            <span
              className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                isDark ? 'text-amber-400' : 'text-amber-600'
              }`}
            >
              {formattedSpeed}
            </span>
          </div>
        </div>

        {/* Gaveta Expandida */}
        {isExpanded && (
          <div className="mt-2.5 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={handleShareClick}
              className="vagou-rounded-box vagou-white-emerald w-full py-2.5 px-3 rounded-[4px] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isShared ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span className="text-white">
                    {distanceKm <= 0.15
                      ? 'Geofence <= 150m Ativo • Chegada Confirmada'
                      : 'Telemetria Compartilhada em Tempo Real'}
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-white shrink-0" />
                  <span className="text-white">{shareButtonLabel}</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`vagou-rounded-box py-2 px-3 rounded-[4px] border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  isDark
                    ? 'bg-slate-900/85 border-slate-700 text-white hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Abrir no Maps</span>
                <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`vagou-rounded-box py-2 px-3 rounded-[4px] border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  isDark
                    ? 'bg-slate-900/85 border-slate-700 text-white hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Navigation className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Abrir no Waze</span>
                <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface LiveTrackingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
  isDark?: boolean;
  originLat?: number;
  originLng?: number;
  originLabel?: string;
  destLat: number;
  destLng: number;
  destLabel: string;
  userAvatarUrl?: string;
  transportMode?: TransportMode;
  shareButtonLabel?: string;
  extraWaypoints?: Array<{
    id: string;
    lat: number;
    lng: number;
    label: string;
    badgeColor?: string;
    textColor?: string;
    onSelect?: () => void;
  }>;
  headerSlot?: React.ReactNode;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  isOpen = true,
  onClose,
  embedded = false,
  isDark = true,
  originLat = -23.4285,
  originLng = -46.4815,
  originLabel = 'Base PAA / Sua Posição',
  destLat,
  destLng,
  destLabel,
  userAvatarUrl,
  transportMode = 'driving',
  shareButtonLabel = 'Compartilhar com o Salão',
  extraWaypoints = [],
  headerSlot,
}) => {
  const [routeData, setRouteData] = useState<GoogleComputedRouteResult | null>(null);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number; street?: string }>({
    lat: originLat,
    lng: originLng,
  });
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [telemetry, setTelemetry] = useState<{ distanceKm: number; etaMinutes: number }>({
    distanceKm: 1.8,
    etaMinutes: 6,
  });
  const [maneuver, setManeuver] = useState<{
    instruction: string;
    distanceText: string;
    maneuver: string;
  }>({
    instruction: `Siga em direção a ${destLabel}`,
    distanceText: '180 m',
    maneuver: 'STRAIGHT',
  });
  const [destinationReached, setDestinationReached] = useState<boolean>(false);

  useEffect(() => {
    setLiveCoords((prev) => ({ ...prev, lat: originLat, lng: originLng }));
  }, [originLat, originLng]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    computeGoogleDetailedRoute({
      originLat: liveCoords.lat,
      originLng: liveCoords.lng,
      originAddress: originLabel,
      destLat,
      destLng,
      destAddress: destLabel,
      mode: transportMode,
    }).then((res) => {
      if (!active || !res) return;
      setRouteData(res);
      setTelemetry({ distanceKm: res.distanceKm, etaMinutes: res.etaMinutes });
      if (res.steps.length > 0) {
        setManeuver({
          instruction: res.steps[0].instruction,
          distanceText: res.steps[0].distanceText,
          maneuver: res.steps[0].maneuver,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, destLat, destLng, destLabel, transportMode]);

  if (!isOpen) return null;

  const content = (
    <div
      className={`vagou-navigation-root flex flex-col w-full h-full overflow-hidden ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Subcabeçalho em Linha Única */}
      <div
        className={`shrink-0 px-4 h-12 flex items-center border-b z-20 ${
          isDark ? 'bg-slate-950/95 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {headerSlot ? (
          headerSlot
        ) : (
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="min-w-0 flex items-center gap-2">
              <div className="vagou-rounded-box vagou-white-emerald w-7 h-7 rounded-[4px] bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                <span className="text-xs font-black uppercase tracking-wider truncate">
                  Navegação Course-Up • {destLabel}
                </span>
                <span className="hidden sm:inline text-[10px] font-semibold text-slate-400 truncate">
                  • {liveCoords.street || originLabel} ➔ {destLabel}
                </span>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="vagou-rounded-box p-1.5 rounded-[4px] border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Palco do Mapa Rotacionável Course-Up + Rodapé Glass Swipe */}
      <div className="relative flex-1 w-full min-h-[360px] flex flex-col overflow-hidden">
        <InteractiveGoogleRouteMap
          isDark={isDark}
          originLat={liveCoords.lat}
          originLng={liveCoords.lng}
          originLabel={originLabel}
          destLat={destLat}
          destLng={destLng}
          destLabel={destLabel}
          userAvatarUrl={userAvatarUrl}
          routeData={routeData}
          initialDistanceKm={telemetry.distanceKm}
          initialEtaMinutes={telemetry.etaMinutes}
          extraWaypoints={extraWaypoints}
          onLiveGpsUpdate={(lat, lng, snappedStreet) => {
            setLiveCoords({ lat, lng, street: snappedStreet || liveCoords.street });
          }}
          onDestinationReachedChange={setDestinationReached}
          onSpeedUpdate={setSpeedKmh}
          onManeuverUpdate={setManeuver}
          onTelemetryUpdate={(distanceKm, etaMinutes) => {
            setTelemetry({ distanceKm, etaMinutes });
          }}
        />

        {/* Rodapé do Mapa com Menu Swipe em Efeito Vidro */}
        <MapGlassBottomSwipeMenu
          isDark={isDark}
          distanceKm={telemetry.distanceKm}
          etaMinutes={telemetry.etaMinutes}
          speedKmh={speedKmh}
          originLat={liveCoords.lat}
          originLng={liveCoords.lng}
          destLat={destLat}
          destLng={destLng}
          destLabel={destLabel}
          hasReachedGeofence={destinationReached}
          shareButtonLabel={shareButtonLabel}
        />
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[9995] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-3xl h-[88vh] border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
        {content}
      </div>
    </div>
  );
};
