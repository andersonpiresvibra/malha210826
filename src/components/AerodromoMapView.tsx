import React, { useState, useMemo, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  Truck,
  Plane,
  Crosshair,
  Search,
  Layers,
  Maximize2,
} from 'lucide-react';
import { FlightData, OperatorProfile, Vehicle } from '../types';
import { PositionMetadata } from '../constants/aerodromoConfig';
import { LiveTrackingModal } from './live-tracking/LiveTrackingModal';

export interface AerodromoMapViewProps {
  isDarkMode?: boolean;
  activePatioId?: string;
  onSelectPatio?: (patioId: string) => void;
  searchTerm?: string;
  flights?: FlightData[];
  vehicles?: Vehicle[];
  operators?: OperatorProfile[];
  disabledPositions?: Set<string>;
  positionsMetadata?: Record<string, PositionMetadata>;
  positionRestrictions?: Record<string, 'HYBRID' | 'CTA' | 'SRV'>;
  activePatioFilter?: string;
  onPatioFilterChange?: (patioId: string) => void;
  onSelectPitForFlight?: (flightId: string, positionId: string, pitId: string) => void;
  onRegisterCalco?: (posId: string) => void;
  onRemoveFlight?: (flightId: string) => void;
  standaloneMode?: boolean;
  onSwitchToPositions?: () => void;
}

interface SbgrTargetDestination {
  id: string;
  code: string;
  label: string;
  patio: string;
  category: 'PATIO' | 'GATE' | 'TRUCK' | 'BASE';
  lat: number;
  lng: number;
  flightInfo?: string;
}

const SBGR_TARGETS: SbgrTargetDestination[] = [
  {
    id: 'PATIO_1',
    code: 'P1',
    label: 'Pátio 1 — Aviação Geral / Posições 101–115',
    patio: '1',
    category: 'PATIO',
    lat: -23.4320,
    lng: -46.4765,
  },
  {
    id: 'PATIO_2',
    code: 'P2',
    label: 'Pátio 2 — Doméstico / Posições 201–212',
    patio: '2',
    category: 'PATIO',
    lat: -23.4296,
    lng: -46.4735,
  },
  {
    id: 'PATIO_3',
    code: 'P3',
    label: 'Pátio 3 — Pier T2 / Posições 301–312',
    patio: '3',
    category: 'PATIO',
    lat: -23.4275,
    lng: -46.4702,
  },
  {
    id: 'PATIO_4',
    code: 'P4',
    label: 'Pátio 4 — Conector / Posições 401–412',
    patio: '4',
    category: 'PATIO',
    lat: -23.4262,
    lng: -46.4678,
  },
  {
    id: 'PATIO_5',
    code: 'P5',
    label: 'Pátio 5 — Remoto / Posições 501–509',
    patio: '5',
    category: 'PATIO',
    lat: -23.4249,
    lng: -46.4654,
  },
  {
    id: 'PATIO_6',
    code: 'P6',
    label: 'Pátio 6 — Internacional T3 / Posições 601–614',
    patio: '6',
    category: 'PATIO',
    lat: -23.4232,
    lng: -46.4622,
  },
  {
    id: 'GATE_207',
    code: 'POS 207',
    label: 'Posição 207 (Pátio 2 • Hidrante PIT 207-1)',
    patio: '2',
    category: 'GATE',
    lat: -23.4292,
    lng: -46.4729,
  },
  {
    id: 'GATE_303R',
    code: 'POS 303R',
    label: 'Posição 303R (Pátio 3 • Hidrante PIT 303-1)',
    patio: '3',
    category: 'GATE',
    lat: -23.4272,
    lng: -46.4698,
  },
  {
    id: 'GATE_402',
    code: 'POS 402',
    label: 'Posição 402 (Pátio 4 • Hidrante PIT 402-1)',
    patio: '4',
    category: 'GATE',
    lat: -23.4259,
    lng: -46.4673,
  },
  {
    id: 'GATE_606R',
    code: 'POS 606R',
    label: 'Posição 606R (Pátio 6 Widebody • Hidrante PIT 606-1)',
    patio: '6',
    category: 'GATE',
    lat: -23.4228,
    lng: -46.4618,
  },
  {
    id: 'TRUCK_2125',
    code: 'SRV 2125',
    label: 'Viatura SRV 2125 (Em deslocamento • Pátio 2)',
    patio: '2',
    category: 'TRUCK',
    lat: -23.4288,
    lng: -46.4722,
  },
  {
    id: 'TRUCK_2148',
    code: 'SRV 2148',
    label: 'Viatura SRV 2148 (Atendimento • Pátio 3)',
    patio: '3',
    category: 'TRUCK',
    lat: -23.4270,
    lng: -46.4692,
  },
  {
    id: 'BASE_PAA',
    code: 'BASE PAA',
    label: 'Parque de Abastecimento de Aeronaves (Vibra SBGR)',
    patio: 'ALL',
    category: 'BASE',
    lat: -23.4342,
    lng: -46.4795,
  },
];

export const AerodromoMapView: React.FC<AerodromoMapViewProps> = ({
  isDarkMode = true,
  activePatioId,
  onSelectPatio,
  searchTerm = '',
  flights = [],
  standaloneMode = false,
  onSwitchToPositions,
}) => {
  // Origem padrão: Base PAA Vibra SBGR ou GPS ao vivo do dispositivo
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number; label: string }>({
    lat: -23.4342,
    lng: -46.4795,
    label: 'Base PAA Vibra SBGR',
  });

  // Destino selecionado na malha viária / pátio
  const [selectedTargetId, setSelectedTargetId] = useState<string>('GATE_303R');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false);

  // Sincroniza quando o usuário clica em P1..P6 no cabeçalho do Aeródromo
  useEffect(() => {
    if (!activePatioId || activePatioId === 'ALL') return;
    const match = SBGR_TARGETS.find(
      (t) => t.category === 'PATIO' && t.patio === String(activePatioId)
    );
    if (match) {
      setSelectedTargetId(match.id);
    }
  }, [activePatioId]);

  // Enriquece alvos com voos reais ativos da malha quando disponíveis
  const targetsWithFlights = useMemo(() => {
    const dynamicGateTargets: SbgrTargetDestination[] = [];
    flights.slice(0, 8).forEach((f, idx) => {
      if (!f.positionId) return;
      const alreadyExists = SBGR_TARGETS.some((t) => t.code === `POS ${f.positionId}`);
      if (!alreadyExists) {
        dynamicGateTargets.push({
          id: `FLIGHT_POS_${f.id}`,
          code: `POS ${f.positionId}`,
          label: `Posição ${f.positionId} • Voo ${f.departureFlightNumber || f.flightNumber} (${f.airline})`,
          patio: f.positionId.charAt(0) || '3',
          category: 'GATE',
          lat: -23.4295 + idx * 0.0009,
          lng: -46.4740 + idx * 0.0014,
          flightInfo: `${f.airline} ${f.departureFlightNumber || f.flightNumber}`,
        });
      }
    });
    return [...SBGR_TARGETS, ...dynamicGateTargets];
  }, [flights]);

  const effectiveQuery = (searchTerm || localSearch).trim().toLowerCase();

  const filteredTargets = useMemo(() => {
    if (!effectiveQuery) return targetsWithFlights;
    return targetsWithFlights.filter(
      (t) =>
        t.code.toLowerCase().includes(effectiveQuery) ||
        t.label.toLowerCase().includes(effectiveQuery)
    );
  }, [targetsWithFlights, effectiveQuery]);

  const activeTarget = useMemo(
    () =>
      targetsWithFlights.find((t) => t.id === selectedTargetId) ||
      filteredTargets[0] ||
      SBGR_TARGETS[0],
    [targetsWithFlights, selectedTargetId, filteredTargets]
  );

  const handleUseDeviceGpsNow = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Meu Dispositivo Móvel (GPS)',
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const extraWaypoints = useMemo(
    () =>
      targetsWithFlights
        .filter((t) => t.id !== activeTarget.id)
        .map((t) => ({
          id: t.id,
          lat: t.lat,
          lng: t.lng,
          label: t.code,
          badgeColor:
            t.category === 'TRUCK'
              ? '#0284c7'
              : t.category === 'GATE'
              ? '#0f172a'
              : '#1e293b',
          textColor: '#ffffff',
          onSelect: () => {
            setSelectedTargetId(t.id);
            if (t.patio && t.patio !== 'ALL') {
              onSelectPatio?.(t.patio);
            }
          },
        })),
    [targetsWithFlights, activeTarget.id, onSelectPatio]
  );

  const customHeaderBar = (
    <div className="flex items-center justify-between gap-3 flex-nowrap w-full overflow-x-auto no-scrollbar">
      {/* Identificação Course-Up & Rota Ativa em Linha Única */}
      <div className="flex items-center gap-2.5 min-w-0 flex-nowrap overflow-hidden">
        <div className="vagou-rounded-box vagou-white-emerald w-7 h-7 rounded-[4px] bg-emerald-500 text-white flex items-center justify-center shrink-0">
          <Navigation className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center gap-2 min-w-0 whitespace-nowrap overflow-hidden">
          <span
            className={`text-xs font-black uppercase tracking-wider truncate ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {activeTarget.code} — {activeTarget.label}
          </span>
          <span
            className={`hidden lg:inline text-[10px] font-semibold truncate ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            • Saída: {originCoords.label}
          </span>
        </div>
      </div>

      {/* Filtro & Botões Táticos em Linha Única */}
      <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
        <div className="relative shrink-0">
          <Search
            className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              const val = e.target.value;
              setLocalSearch(val);
              const q = val.trim().toLowerCase();
              if (q) {
                const match = targetsWithFlights.find(
                  (t) =>
                    t.code.toLowerCase().includes(q) ||
                    t.label.toLowerCase().includes(q)
                );
                if (match) {
                  setSelectedTargetId(match.id);
                  if (match.patio !== 'ALL') {
                    onSelectPatio?.(match.patio);
                  }
                }
              }
            }}
            placeholder="Filtrar posição / frota..."
            className={`vagou-rounded-box h-8 pl-7 pr-2.5 text-xs rounded-[4px] border w-40 sm:w-48 ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500'
                : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-500'
            }`}
          />
        </div>

        <button
          type="button"
          onClick={handleUseDeviceGpsNow}
          className="vagou-rounded-box vagou-white-emerald h-8 px-2.5 rounded-[4px] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
          title="Usar coordenada GPS atual do seu dispositivo móvel"
        >
          <Crosshair className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="text-white hidden sm:inline">Meu GPS</span>
        </button>

        {standaloneMode && onSwitchToPositions && (
          <button
            type="button"
            onClick={onSwitchToPositions}
            className={`vagou-rounded-box h-8 px-2.5 rounded-[4px] border font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
            }`}
          >
            <Layers
              className={`w-3.5 h-3.5 shrink-0 ${
                isDarkMode ? 'text-emerald-400' : 'text-[#007a4d]'
              }`}
            />
            <span>Grade de Posições</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsFullscreenModalOpen(true)}
          className={`vagou-rounded-box h-8 px-2.5 rounded-[4px] border font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap ${
            isDarkMode
              ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
              : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
          }`}
          title="Abrir modal dedicado de navegação Course-Up"
        >
          <Maximize2
            className={`w-3.5 h-3.5 shrink-0 ${
              isDarkMode ? 'text-amber-400' : 'text-amber-600'
            }`}
          />
          <span className="hidden md:inline">Tela Cheia</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="vagou-navigation-root relative w-full h-full min-h-[540px] flex flex-col overflow-hidden">
      <LiveTrackingModal
        isOpen={true}
        embedded={true}
        isDark={isDarkMode}
        originLat={originCoords.lat}
        originLng={originCoords.lng}
        originLabel={originCoords.label}
        destLat={activeTarget.lat}
        destLng={activeTarget.lng}
        destLabel={`${activeTarget.code} • ${activeTarget.label}`}
        shareButtonLabel="Compartilhar com o Salão"
        extraWaypoints={extraWaypoints}
        headerSlot={customHeaderBar}
      />

      {isFullscreenModalOpen && (
        <LiveTrackingModal
          isOpen={isFullscreenModalOpen}
          onClose={() => setIsFullscreenModalOpen(false)}
          embedded={false}
          isDark={isDarkMode}
          originLat={originCoords.lat}
          originLng={originCoords.lng}
          originLabel={originCoords.label}
          destLat={activeTarget.lat}
          destLng={activeTarget.lng}
          destLabel={`${activeTarget.code} • ${activeTarget.label}`}
          shareButtonLabel="Compartilhar com o Salão"
          extraWaypoints={extraWaypoints}
        />
      )}
    </div>
  );
};
