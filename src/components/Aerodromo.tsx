import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FlightData, FlightStatus, OperatorProfile, Vehicle } from '../types';
import { OperatorCell } from './OperatorCell';
import { AirlineLogo, getNormalizedAirlineInfo } from './AirlineLogo';
import { 
  Search, LayoutGrid, Anchor, Ban, List, ChevronUp, ChevronDown, Map as MapIcon, Fuel 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { POSITIONS_BY_PATIO, PATIO_LABELS, PositionMetadata, getHydrantPitsForPosition } from '../constants/aerodromoConfig';
import { getCityName } from '../utils/destinos';
import { AerodromoMapView } from './AerodromoMapView';

interface AerodromoProps {
    operators?: OperatorProfile[];
    flights?: FlightData[];
    vehicles?: Vehicle[];
    disabledPositions?: Set<string>;
    positionsMetadata?: Record<string, PositionMetadata>;
    positionRestrictions?: Record<string, 'HYBRID' | 'CTA' | 'SRV'>;
    onRemoveFlight?: (flightId: string) => void;
    onSelectPitForFlight?: (flightId: string, positionId: string, pitId: string) => void;
}

interface ExternalSnapshot {
    posId: string;
    airline: string;
    flightNumber: string;
    registration?: string;
    updatedAt: string;
}

export const Aerodromo: React.FC<AerodromoProps> = ({ 
  operators = [], 
  flights = [], 
  vehicles = [],
  disabledPositions = new Set(),
  positionsMetadata = {},
  positionRestrictions = {},
  onRemoveFlight,
  onSelectPitForFlight
}) => {
  const { isDarkMode } = useTheme();
  const [externalSnapshot] = useState<Map<string, ExternalSnapshot>>(new Map());

  const [activeSectionTab, setActiveSectionTab] = useState<'POSICOES' | 'MAPA'>('POSICOES');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [activePatioId, setActivePatioId] = useState('2');
  const [searchTerm, setSearchTerm] = useState('');

  const [calcoInputPos, setCalcoInputPos] = useState<string | null>(null);
  const [calcoRegistration, setCalcoRegistration] = useState('');
  const [localFlights, setLocalFlights] = useState<FlightData[]>(flights);
  
  React.useEffect(() => {
    setLocalFlights(flights);
  }, [flights]);

  const allPositions = useMemo(() => Object.values(POSITIONS_BY_PATIO).flat(), []);
  const currentPositions = useMemo(() => POSITIONS_BY_PATIO[activePatioId] || [], [activePatioId]);

  const busyOperators = useMemo(() => {
    const busy = new Set<string>();
    localFlights.forEach(f => {
      if (f.operator && f.status !== FlightStatus.FINALIZADO && f.status !== FlightStatus.CANCELADO) {
        busy.add(f.operator);
      }
    });
    return busy;
  }, [localFlights]);

  const latestFlightIdByOperator = useMemo(() => {
    const latest = new Map<string, string>();
    const latestTime = new Map<string, string>();
    
    localFlights.forEach(f => {
      if (f.operator) {
        const currentEtd = f.etd || f.eta || '00:00';
        const existingLatest = latestTime.get(f.operator) || '00:00';
        
        if (currentEtd >= existingLatest) {
          latest.set(f.operator, f.id);
          latestTime.set(f.operator, currentEtd);
        }
      }
    });
    return latest;
  }, [localFlights]);

  const positionData = useMemo(() => {
      const map = new Map<string, FlightData>();
      localFlights.forEach(f => {
          if (f.positionId) {
             if (f.status === FlightStatus.FINALIZADO || f.status === FlightStatus.CANCELADO) {
                if (!f.operator || busyOperators.has(f.operator) || latestFlightIdByOperator.get(f.operator) !== f.id) {
                   return;
                }
             }
             map.set(f.positionId, f);
          }
      });
      return map;
  }, [localFlights, busyOperators, latestFlightIdByOperator]);

  const displayedPositions = useMemo(() => {
    const listToFilter = searchTerm ? allPositions : currentPositions;
    let filtered = listToFilter;

    if (searchTerm) {
        filtered = listToFilter.filter(posId => {
            if (posId.includes(searchTerm)) return true;
            const pits = getHydrantPitsForPosition(posId);
            if (pits.some(p => p.pitId.toUpperCase().includes(searchTerm))) return true;
            const flight = positionData.get(posId);
            if (flight) {
                return (
                    (flight.flightNumber?.toUpperCase() || '').includes(searchTerm) ||
                    (flight.departureFlightNumber?.toUpperCase() || '').includes(searchTerm) ||
                    (flight.airline?.toUpperCase() || '').includes(searchTerm) ||
                    (flight.registration?.toUpperCase() || '').includes(searchTerm) ||
                    (flight.operator?.toUpperCase() || '').includes(searchTerm) ||
                    (flight.fleet?.toUpperCase() || '').includes(searchTerm) ||
                    (flight.vehicleType?.toUpperCase() || '').includes(searchTerm) ||
                    (flight.status?.toUpperCase() || '').includes(searchTerm)
                );
            }
            return false;
        });
    }

    if (!sortConfig) return filtered;

    return [...filtered].sort((a, b) => {
        const flightA = positionData.get(a);
        const flightB = positionData.get(b);
        
        const getVal = (posId: string, flight?: FlightData) => {
            switch (sortConfig.key) {
                case 'pos': return posId;
                case 'flightNumber': return flight?.flightNumber || '';
                case 'airline': return flight?.airline || '';
                case 'registration': return flight?.registration || '';
                case 'destination': return flight?.destination || '';
                case 'calco': return flight?.eta || '';
                case 'etd': return flight?.etd || '';
                case 'operator': return flight?.operator || '';
                case 'status': return flight?.status || '';
                default: return '';
            }
        };

        const valA = getVal(a, flightA);
        const valB = getVal(b, flightB);
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [allPositions, currentPositions, searchTerm, positionData, sortConfig]);

  const handleSort = (key: string) => {
      setSortConfig(prev => {
          if (prev?.key === key) {
              return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
          }
          return { key, direction: 'asc' };
      });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
      const isActive = sortConfig?.key === columnKey;
      if (!isActive) return (
          <div className="flex flex-col ml-1.5 opacity-30 group-hover:opacity-100 transition-opacity">
              <ChevronUp size={6} className="-mb-0.5" />
              <ChevronDown size={6} />
          </div>
      );
      return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ml-1.5 text-blue-500 font-bold" /> : <ChevronDown size={14} className="ml-1.5 text-blue-500 font-bold" />;
  };

  const getStatusBadge = (status: FlightStatus) => {
      switch (status) {
          case FlightStatus.FINALIZADO: return <span className={`font-black text-[9px] px-1.5 py-0.5 rounded uppercase border ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>FINALIZADO</span>;
          case FlightStatus.ABASTECENDO: return <span className={`font-black text-[9px] px-1.5 py-0.5 rounded uppercase border ${isDarkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>ABASTECENDO</span>;
          case FlightStatus.DESIGNADO: return <span className={`font-black text-[9px] px-1.5 py-0.5 rounded uppercase border ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>DESIGNADO</span>;
          case FlightStatus.AGUARDANDO: return <span className={`font-black text-[9px] px-1.5 py-0.5 rounded uppercase border ${isDarkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>AGUARDANDO</span>;
          case FlightStatus.FILA: return <span className={`font-black text-[9px] px-1.5 py-0.5 rounded uppercase border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>FILA</span>;
          case FlightStatus.CANCELADO: return <span className={`font-black text-[9px] px-1.5 py-0.5 rounded uppercase border ${isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'}`}>CANCELADO</span>;
          default: return <span className={`text-[9px] font-black uppercase border ${isDarkMode ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>{status}</span>;
      }
  };

  const getStatusProgress = (status: FlightStatus) => {
    switch (status) {
        case FlightStatus.DESIGNADO: return { percent: 15, color: 'bg-indigo-500' };
        case FlightStatus.AGUARDANDO: return { percent: 30, color: 'bg-amber-500' };
        case FlightStatus.ABASTECENDO: return { percent: 65, color: 'bg-blue-500' };
        case FlightStatus.FINALIZADO: return { percent: 100, color: 'bg-emerald-500' };
        case FlightStatus.FILA: return { percent: 5, color: 'bg-slate-400' };
        case FlightStatus.CANCELADO: return { percent: 100, color: 'bg-red-500' };
        default: return { percent: 0, color: 'bg-slate-300' };
    }
  };

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
      setPortalTarget(document.getElementById('subheader-portal-target'));
  }, []);

  const subheaderContent = (
      <div className={`px-6 h-16 shrink-0 flex items-center justify-between border-b ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-[#3CA317] border-transparent text-white shadow-[0_2px_8px_rgba(0,0,0,0.5)]"} z-20 w-full`}>
        <div className="flex items-center gap-4 h-full">
          <div className="flex items-center gap-3">
            {activeSectionTab === 'MAPA' ? (
              <MapIcon className="text-emerald-400" size={20} />
            ) : (
              <LayoutGrid className="text-white" size={20} />
            )}
            <div>
              <h2 className="text-sm font-black text-white tracking-tighter uppercase leading-none">
                {activeSectionTab === 'MAPA' ? 'MAPA DO AERÓDROMO' : 'POSIÇÕES DO PÁTIO'}
              </h2>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-white/70'}`}>
                SBGR GROUND CONTROL
              </span>
            </div>
          </div>

          {/* Primary Tab Switcher: POSIÇÕES vs MAPA */}
          <div className="flex items-center bg-black/30 p-0.5 rounded-lg border border-white/15 h-8 gap-0.5">
            <button
              onClick={() => setActiveSectionTab('POSICOES')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-md text-[10px] h-full font-black uppercase tracking-widest transition-all ${
                activeSectionTab === 'POSICOES'
                  ? isDarkMode
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white text-[#3CA317] shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutGrid size={12} /> POSIÇÕES
            </button>
            <button
              onClick={() => setActiveSectionTab('MAPA')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-md text-[10px] h-full font-black uppercase tracking-widest transition-all ${
                activeSectionTab === 'MAPA'
                  ? isDarkMode
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white text-[#3CA317] shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MapIcon size={12} /> MAPA
            </button>
          </div>

          <div className="w-px h-6 bg-white/20"></div>

          {/* Patio Filter Buttons (Pátio 1 - Pátio 7) */}
          <div className="flex items-center bg-black/20 p-0.5 rounded border border-white/10 h-8 gap-0.5">
            {PATIO_LABELS.map(patio => (
              <button
                key={patio.id}
                onClick={() => setActivePatioId(patio.id)}
                className={`px-3 py-1 rounded text-[10px] h-full font-black uppercase tracking-widest transition-all ${
                  activePatioId === patio.id
                    ? isDarkMode
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white text-[#3CA317] shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {patio.label}
              </button>
            ))}
          </div>

          {activeSectionTab === 'POSICOES' && (
            <>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="flex items-center bg-black/20 p-0.5 rounded border border-white/10 h-8 gap-0.5">
                <button 
                  onClick={() => setViewMode('GRID')} 
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] h-full font-black uppercase tracking-widest transition-all ${viewMode === 'GRID' ? (isDarkMode ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-[#3CA317] shadow-sm') : 'text-white hover:bg-white/10'}`}
                  title="Visualização em Grade"
                >
                  <LayoutGrid size={12} /> GRADE
                </button>
                <button 
                  onClick={() => setViewMode('TABLE')} 
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] h-full font-black uppercase tracking-widest transition-all ${viewMode === 'TABLE' ? (isDarkMode ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-[#3CA317] shadow-sm') : 'text-white hover:bg-white/10'}`}
                  title="Visualização em Tabela"
                >
                  <List size={12} /> TABELA
                </button>
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="BUSCAR POS / PIT..."
            className="bg-black/20 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-[10px] text-white font-mono uppercase focus:border-white/30 outline-none w-36 focus:w-52 transition-all placeholder-white/50 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
          />
        </div>
      </div>
  );

  return (
    <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} overflow-hidden relative`}>
      {portalTarget ? createPortal(subheaderContent, portalTarget) : subheaderContent}
      {activeSectionTab === 'MAPA' ? (
        <div className="flex-1 overflow-hidden">
          <AerodromoMapView
            isDarkMode={isDarkMode}
            activePatioId={activePatioId}
            onSelectPatio={setActivePatioId}
            searchTerm={searchTerm}
            flights={localFlights}
            operators={operators}
            vehicles={vehicles}
            disabledPositions={disabledPositions}
            positionsMetadata={positionsMetadata}
            positionRestrictions={positionRestrictions}
            onSelectPitForFlight={(flightId, positionId, pitId) => {
              setLocalFlights(prev =>
                prev.map(f => (f.id === flightId ? { ...f, pitId } : f))
              );
              if (onSelectPitForFlight) {
                onSelectPitForFlight(flightId, positionId, pitId);
              }
            }}
            onRegisterCalco={posId => setCalcoInputPos(posId)}
            onRemoveFlight={onRemoveFlight}
          />
        </div>
      ) : (
        <div className={`flex-1 overflow-auto ${viewMode === 'GRID' ? 'p-6' : ''} ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
          {viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-24 auto-rows-fr">
              {displayedPositions.map(posId => {
                const flight = positionData.get(posId);
                const externalFlight = externalSnapshot.get(posId);
                const isThirdParty = externalFlight && (!flight || (flight.registration !== externalFlight.registration && flight.flightNumber !== externalFlight.flightNumber));
                const isConflict = flight && externalFlight && isThirdParty;
                
                const isOccupied = !!flight || !!externalFlight;
                const isFinished = flight?.status === FlightStatus.FINALIZADO || flight?.status === FlightStatus.CANCELADO;
                
                const isDisabled = disabledPositions.has(posId);
                const restriction = positionRestrictions[posId] || 'HYBRID';
                const metadata = positionsMetadata[posId];
                const subPits = getHydrantPitsForPosition(posId);
                
                const rawAirline = isThirdParty ? externalFlight.airline : (flight?.airline || null);
                const displayAirline = rawAirline ? getNormalizedAirlineInfo(rawAirline).name : null;
                const displayFlightNum = isThirdParty ? externalFlight.flightNumber : ((flight?.flightNumber && flight.flightNumber !== '--') ? flight.flightNumber : (flight?.departureFlightNumber || '--'));
                
                const isLivre = isFinished && flight?.operator && !busyOperators.has(flight.operator);
                const isVisuallyOccupied = isThirdParty ? isOccupied : (isOccupied && !isFinished);
                
                const getRestrictionColor = () => {
                  if (isDisabled) return isDarkMode ? 'border-red-900/50 bg-red-950/20' : 'border-red-200';
                  if (restriction === 'CTA') return isDarkMode ? 'border-yellow-900/50 bg-yellow-900/10' : 'border-yellow-200 bg-yellow-50/30';
                  if (restriction === 'SRV') return isDarkMode ? 'border-indigo-900/50 bg-indigo-900/10' : 'border-indigo-200 bg-indigo-50/30';
                  if (isOccupied) return (flight?.status === FlightStatus.FINALIZADO || flight?.status === FlightStatus.CANCELADO) ? (isDarkMode ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50') : (isDarkMode ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50/50');
                  return (isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white');
                };

                const destIcao = flight?.destination || flight?.origin || '';
                const destCity = getCityName(destIcao);

                return (
                  <div key={posId} className={`relative rounded-xl border-2 flex flex-col p-3 transition-all shadow-sm group min-h-[175px] overflow-hidden ${getRestrictionColor()} ${isThirdParty ? 'opacity-70 grayscale-[0.5]' : ''} ${isConflict ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
                  style={isDisabled ? { backgroundImage: isDarkMode ? 'repeating-linear-gradient(45deg, rgba(15, 23, 42, 1), rgba(15, 23, 42, 1) 10px, rgba(127, 29, 29, 0.1) 10px, rgba(127, 29, 29, 0.1) 20px)' : 'repeating-linear-gradient(45deg, rgba(248, 250, 252, 1), rgba(248, 250, 252, 1) 10px, rgba(226, 232, 240, 0.4) 10px, rgba(226, 232, 240, 0.4) 20px)' } : {}}
                  >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className="flex flex-col">
                         <div className="flex items-center gap-1.5">
                            <span className={`text-xl font-black font-mono ${isDisabled ? (isDarkMode ? 'text-slate-600' : 'text-slate-400') : isOccupied ? (isDarkMode ? 'text-white' : 'text-slate-800') : (isDarkMode ? 'text-slate-600' : 'text-slate-400')} ${restriction === 'CTA' && !isOccupied && !isDisabled ? 'text-yellow-600' : ''}`}>{posId}</span>
                            <span className={`text-[7px] font-black px-1 py-0.5 rounded ${metadata?.type === 'PIT' ? 'bg-emerald-500/20 text-emerald-500/70' : 'bg-slate-500/20 text-slate-500/70'}`}>
                               {metadata?.type}
                            </span>
                         </div>
                         {subPits.length > 0 && !isDisabled && (
                           <div className="flex flex-wrap gap-1 mt-1">
                             {subPits.slice(0, 3).map(sp => (
                               <span
                                 key={sp.id}
                                 className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border ${
                                   flight?.pitId === sp.pitId
                                     ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                                     : isDarkMode
                                     ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                                     : 'bg-slate-100 text-slate-500 border-slate-200'
                                 }`}
                                 title={`Pit de Hidrante ${sp.pitId} (${sp.wingHint})`}
                               >
                                 {sp.pitId}
                               </span>
                             ))}
                             {subPits.length > 3 && (
                               <span className="text-[8px] font-mono text-slate-500">
                                 +{subPits.length - 3}
                               </span>
                             )}
                           </div>
                         )}
                         {isConflict && <span className="text-[8px] bg-red-600 text-white px-1 py-0.5 rounded font-black animate-pulse w-fit">CONFLITO</span>}
                      </div>
                      {isDisabled ? (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border shadow-sm ${isDarkMode ? 'bg-red-900/30 text-red-500 border-red-900/50' : 'bg-red-100 text-red-600 border-red-200'}`}>OFF</span>
                      ) : (isVisuallyOccupied && displayAirline) ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black uppercase border px-2 py-0.5 rounded shadow-sm ${isThirdParty ? (isDarkMode ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200') : (isDarkMode ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-700 border-blue-200')}`}>{displayAirline}</span>
                          {flight && onRemoveFlight && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRemoveFlight(flight.id); }} 
                              className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-1 rounded transition-colors"
                              title="Desvincular Voo da Posição"
                            >
                               <Ban size={10} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center relative z-10">
                      {isDisabled ? (
                        <div className="flex flex-col items-center gap-2">
                          <Ban className="text-red-400" size={24} strokeWidth={2.5} />
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded shadow-sm border ${isDarkMode ? 'bg-slate-900 text-red-500 border-red-900/30' : 'bg-white text-red-600 border-red-100'}`}>INATIVO</span>
                        </div>
                      ) : isThirdParty ? (
                          <div className="flex flex-col gap-1.5 items-center justify-center py-2">
                             <div className="flex items-center gap-2">
                                <span className={`text-sm font-black font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{externalFlight.flightNumber}</span>
                                <span className="text-[10px] bg-slate-500/20 px-1 py-0.5 rounded text-slate-500 font-bold uppercase">GRU-LIVE</span>
                             </div>
                             <span className={`text-[10px] font-black tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase`}>OCUPADO POR TERCEIROS</span>
                             <div className={`mt-1 text-[9px] font-mono ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>UPDATE: {externalFlight.updatedAt}</div>
                          </div>
                      ) : isVisuallyOccupied && flight ? (
                         <div className="flex flex-col gap-1.5">
                          <div className={`flex justify-between items-baseline font-black`}>
                            <span className={`truncate mr-2 font-mono font-bold text-[14px] leading-5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{displayFlightNum}</span>
                            <span className={`font-bold font-[Verdana] ${isDarkMode ? 'text-slate-400' : 'text-[#50545c]'} text-[11px] truncate`}>
                              {destIcao || 'SBGR'}{destCity ? ` • ${destCity}` : ''}
                            </span>
                          </div>
                          
                          <div className={`h-px w-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                          
                          <div className={`flex justify-between text-[10px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span className="font-bold">CALÇO: <span className={`text-[12px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{flight.eta || '--:--'}</span></span>
                            <span className="font-bold">ETD: <span className="text-emerald-500 font-bold">{flight.etd || '--:--'}</span></span>
                          </div>
                          
                          <div className={`h-px w-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                          
                          <div className="flex justify-between items-center mt-1 h-10">
                            {flight.operator && (
                               <OperatorCell 
                                 operatorName={flight.operator} 
                                 operators={operators} 
                                 size="md" 
                               />
                            )}
                            <span className={`text-[12px] leading-[18px] font-black bg-clip-text text-transparent truncate ml-auto text-right mt-0 px-[5px] ${isDarkMode ? 'bg-gradient-to-br from-slate-200 to-slate-400' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>{flight.fleet || flight.vehicleType || ''}</span>
                          </div>
                          
                          <div className="flex flex-col gap-1 mt-1 pb-1">
                             <div className="flex justify-end">
                                {getStatusBadge(flight.status)}
                             </div>
                             <div className={`h-2 w-full rounded-none overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                               <div 
                                 className={`h-full transition-all duration-500 ${getStatusProgress(flight.status).color}`} 
                                 style={{ width: `${getStatusProgress(flight.status).percent}%` }}
                               />
                             </div>
                          </div>
                        </div>
                      ) : isLivre && flight?.operator ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 relative">
                           <span className={`text-[#383d47] font-sans font-bold text-[10px] text-center uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100 absolute top-0 w-full`}>POSIÇÃO LIVRE</span>
                           <OperatorCell 
                             operatorName={flight.operator} 
                             operators={operators} 
                             size="lg" 
                             isLivre={true} 
                           />
                        </div>
                      ) : (
                        <div className="text-center flex flex-col items-center justify-center h-full gap-1">
                            {restriction !== 'HYBRID' && (
                              <span className={`text-[10px] font-black uppercase tracking-widest ${restriction === 'CTA' ? 'text-yellow-600/70' : 'text-indigo-500/70'}`}>
                                  {restriction === 'SRV' ? 'APENAS SRV' : 'APENAS CTA'}
                              </span>
                            )}
                            {restriction === 'HYBRID' && !isDisabled && (
                              <span className={`text-[10px] font-black uppercase tracking-widest text-emerald-500/30`}>HÍBRIDO</span>
                            )}
                        </div>
                      )}
                    </div>
                    
                    <div className={`mt-auto pt-3 border-t ${isDisabled ? 'border-transparent' : (isDarkMode ? 'border-slate-800' : 'border-slate-200')} flex justify-between gap-2 items-center relative z-10`}>
                      {!isDisabled && (
                        <button onClick={() => setCalcoInputPos(posId)} className="text-[9px] font-black text-amber-600 hover:text-amber-500 flex items-center gap-1.5 transition-colors">
                          <Anchor size={12} strokeWidth={2.5} /> CALÇO
                        </button>
                      )}
                      {!isDisabled && (
                        <button
                          onClick={() => setActiveSectionTab('MAPA')}
                          className="text-[9px] font-black text-emerald-500/80 hover:text-emerald-400 flex items-center gap-1 transition-colors ml-auto"
                          title="Localizar posição e sub-pits no Mapa do Aeródromo"
                        >
                          <MapIcon size={11} /> VER MAPA
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col h-full overflow-hidden">
              <div className="overflow-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead className="sticky top-0 z-20">
                          <tr className={`${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                              <th onClick={() => handleSort('pos')} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center w-24 cursor-pointer hover:bg-black/5 transition-colors group">
                                  <div className="flex items-center justify-center">Pos / Pit <SortIcon columnKey="pos" /></div>
                              </th>
                              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center">Logo</th>
                              <th onClick={() => handleSort('airline')} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black/5 transition-colors group">
                                  <div className="flex items-center">Companhia. <SortIcon columnKey="airline" /></div>
                              </th>
                              <th onClick={() => handleSort('flightNumber')} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black/5 transition-colors group">
                                  <div className="flex items-center">Voo <SortIcon columnKey="flightNumber" /></div>
                              </th>
                              <th onClick={() => handleSort('registration')} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-black/5 transition-colors group">
                                  <div className="flex items-center justify-center">Prefixo <SortIcon columnKey="registration" /></div>
                              </th>
                              <th onClick={() => handleSort('destination')} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black/5 transition-colors group">
                                  <div className="flex items-center">DESTINO / CID <SortIcon columnKey="destination" /></div>
                              </th>
                              <th onClick={() => handleSort('calco')} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-black/5 transition-colors group">
                                  <div className="flex items-center justify-center">Calço <SortIcon columnKey="calco" /></div>
                              </th>
                              <th onClick={() => handleSort('etd')} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-black/5 transition-colors group">
                                  <div className="flex items-center justify-center">ETD <SortIcon columnKey="etd" /></div>
                              </th>
                              <th onClick={() => handleSort('operator')} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black/5 transition-colors group">
                                  <div className="flex items-center">Operador <SortIcon columnKey="operator" /></div>
                              </th>
                              <th onClick={() => handleSort('status')} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black/5 transition-colors group">
                                  <div className="flex items-center">Status <SortIcon columnKey="status" /></div>
                              </th>
                              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right px-6">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/20">
                          {displayedPositions.map(posId => {
                              const flight = positionData.get(posId);
                              const externalFlight = externalSnapshot.get(posId);
                              const isThirdParty = externalFlight && (!flight || (flight.registration !== externalFlight.registration && flight.flightNumber !== externalFlight.flightNumber));
                              const isConflict = flight && externalFlight && isThirdParty;

                              const isFinished = flight?.status === FlightStatus.FINALIZADO || flight?.status === FlightStatus.CANCELADO;
                              const isLivre = isFinished && flight?.operator && !busyOperators.has(flight.operator);
                              const isOccupied = !!flight || !!externalFlight;
                              const isVisuallyOccupied = isThirdParty ? isOccupied : (isOccupied && !isFinished);

                              const isDisabled = disabledPositions.has(posId);
                              const restriction = positionRestrictions[posId] || 'HYBRID';
                              const subPits = getHydrantPitsForPosition(posId);

                              const rawAirline = isThirdParty ? externalFlight.airline : (flight?.airline || null);
                              const displayAirline = rawAirline ? getNormalizedAirlineInfo(rawAirline).name : null;
                              const displayFlightNum = isThirdParty ? externalFlight.flightNumber : (flight?.flightNumber || '--');
                              const destIcao = flight?.destination || flight?.origin || '';
                              const destCity = getCityName(destIcao);

                              return (
                                  <tr key={posId} className={`group transition-colors ${isDarkMode ? 'hover:bg-white/5 border-slate-800' : 'hover:bg-slate-50 border-slate-100'} ${isDisabled ? 'opacity-60' : ''} ${isThirdParty ? 'opacity-70' : ''} ${isConflict ? 'bg-red-500/5' : ''}`}>
                                      <td className="px-4 py-3 text-center relative">
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className={`text-sm font-black font-mono px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'} ${restriction === 'CTA' ? 'ring-1 ring-yellow-500/50 text-yellow-500' : restriction === 'SRV' ? 'ring-1 ring-indigo-500/50 text-indigo-500' : ''} ${isConflict ? 'text-red-500' : ''}`}>
                                                {posId}
                                            </span>
                                            {subPits.length > 0 && (
                                              <span className="text-[8px] font-mono text-amber-500/80">
                                                {flight?.pitId || `${subPits[0].pitId}..`}
                                              </span>
                                            )}
                                          </div>
                                          {isConflict && <div className="absolute right-0 top-0 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50"></div>}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                          {isThirdParty ? (
                                              <div className={`text-[10px] font-black py-1 px-2 rounded ${isDarkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'}`}>EXT</div>
                                          ) : isVisuallyOccupied && flight ? (
                                              <div className="flex justify-center">
                                                  <AirlineLogo airlineCode={flight.airlineCode || flight.airline || 'GEN'} size="xl" showName={false} />
                                              </div>
                                          ) : '--'}
                                      </td>
                                      <td className="px-4 py-3">
                                           {isThirdParty ? (
                                               <span className={`text-[10px] font-black uppercase tracking-tight leading-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{displayAirline || '--'}</span>
                                           ) : isVisuallyOccupied ? (
                                               <div className="flex flex-col">
                                                   <span className={`text-xs font-black uppercase tracking-tight leading-5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{displayAirline || '--'}</span>
                                               </div>
                                           ) : '--'}
                                       </td>
                                      <td className="px-4 py-3 text-center">
                                          {isVisuallyOccupied ? (
                                              <span className={`text-xs font-mono font-bold ${isThirdParty ? (isDarkMode ? 'text-slate-500' : 'text-slate-400') : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{displayFlightNum}</span>
                                          ) : '--'}
                                      </td>
                                       <td className="px-4 py-3 text-center">
                                           {isVisuallyOccupied ? (
                                               <span className={`text-xs leading-5 font-sans font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isThirdParty ? externalFlight.registration : (flight?.registration || 'N/A')}</span>
                                           ) : '--'}
                                       </td>
                                       <td className="px-4 py-3 text-xs">
                                           {isVisuallyOccupied && !isThirdParty && flight ? (
                                               <span className={`text-xs font-sans font-bold ${isDarkMode ? 'text-slate-400' : 'text-[#50545c]'}`}>
                                                 {destIcao || 'SBGR'}{destCity ? ` (${destCity})` : ''}
                                               </span>
                                           ) : isThirdParty ? (
                                               <span className="text-[10px] font-black text-slate-400">DESCONHECIDO</span>
                                           ) : '--'}
                                       </td>
                                       <td className="px-4 py-3 text-center">
                                           <span className={`text-xs leading-5 font-sans font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                               {isThirdParty ? externalFlight.updatedAt : (flight?.eta || '--:--')}
                                           </span>
                                       </td>
                                       <td className="px-4 py-3 text-center">
                                           <span className={`text-xs leading-5 font-sans font-bold text-emerald-500`}>
                                               {flight?.etd || '--:--'}
                                           </span>
                                       </td>
                                       <td className="px-4 py-3">
                                           <OperatorCell 
                                             operatorName={flight?.operator} 
                                             operators={operators} 
                                             size="xl" 
                                             className="text-[13px] leading-5"
                                             isLivre={isLivre}
                                           />
                                       </td>
                                       <td className="px-4 py-3">
                                           {isDisabled ? (
                                               <span className={`text-xs font-black uppercase px-2 py-0.5 rounded border ${isDarkMode ? 'bg-red-900/30 text-red-500 border-red-900/50' : 'bg-red-100 text-red-600 border-red-200'}`}>OFF</span>
                                           ) : flight ? (
                                               <div className="flex flex-col gap-1 w-24">
                                                  {getStatusBadge(flight.status)}
                                                  <div className={`h-2 w-full rounded-none overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                    <div 
                                                      className={`h-full transition-all duration-500 ${getStatusProgress(flight.status).color}`} 
                                                      style={{ width: `${getStatusProgress(flight.status).percent}%` }}
                                                    />
                                                  </div>
                                               </div>
                                           ) : (
                                               <span className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}></span>
                                           )}
                                       </td>
                                      <td className="px-4 py-3 text-right">
                                          <div className="flex items-center justify-end gap-3 px-2">
                                              {!isDisabled && (
                                                  <button 
                                                    onClick={() => setCalcoInputPos(posId)} 
                                                    className={`p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors ${isOccupied ? 'opacity-20 cursor-not-allowed' : ''}`} 
                                                    title={isOccupied ? "Bloqueado: Já Ocupado" : "Registrar Calço"}
                                                    disabled={isOccupied}
                                                  >
                                                      <Anchor size={14} strokeWidth={2.5} />
                                                  </button>
                                              )}
                                              {flight && onRemoveFlight && (
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); onRemoveFlight(flight.id); }} 
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20" 
                                                    title="Liberar / Desvincular Posição"
                                                  >
                                                      <Ban size={14} strokeWidth={2.5} />
                                                  </button>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

