import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sun, Moon, User, Maximize, Minimize, Plane, Power, X, SlidersHorizontal, ChevronDown, HardDrive } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
  ltName: string;
  ltPhotoUrl?: string;
  setLtName: (name: string) => void;
  operators?: any[];
  onOpenLayoutPrefs?: () => void;
  onOpenGoogleDrive?: () => void;
  density: number;
  setDensity: (val: number) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  isSupabaseOffline?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isDarkMode,
  toggleDarkMode,
  isFullscreen,
  onToggleFullscreen,
  ltName,
  ltPhotoUrl,
  setLtName,
  operators = [],
  onOpenLayoutPrefs,
  onOpenGoogleDrive,
  density,
  setDensity,
  temperature,
  setTemperature,
}) => {
  const { signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingField, setEditingField] = useState<'density' | 'temperature' | 'ltName' | null>(null);
  const [densityN, setDensityN] = useState(String(density));
  const [tempN, setTempN] = useState(String(temperature));
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDensityN(String(density));
  }, [density]);

  useEffect(() => {
    setTempN(String(temperature));
  }, [temperature]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'H');
  };

  const formatDate = (date: Date) => {
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
    const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${weekday} - ${dayMonth}`;
  };

  const dividerClass = isDarkMode ? 'w-px h-8 bg-white/20' : 'w-px h-8 bg-slate-200';

  return (
    <>
      <header
        className={`ops-main-header h-16 ${
          isDarkMode
            ? 'bg-slate-950 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        } border-b flex items-center justify-between px-6 md:px-8 z-[100] relative transition-colors duration-300`}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 flex items-center justify-center ${
                isDarkMode
                  ? 'bg-white/15 text-white border border-white/25'
                  : 'bg-[#007a4d] text-white border border-[#00633e]'
              }`}
            >
              <Plane className="text-white" size={18} />
            </div>
          </div>

          <div className={dividerClass}></div>

          <div className="relative" ref={avatarMenuRef}>
            <div
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
            >
              <div
                className={`w-9 h-9 flex items-center justify-center transition-colors overflow-hidden border ${
                  isDarkMode
                    ? 'bg-white/10 border-white/25 group-hover:border-white/50 text-white'
                    : 'bg-slate-100 border-slate-300 group-hover:border-[#007a4d] text-slate-700'
                }`}
              >
                {ltPhotoUrl ? (
                  <img
                    src={ltPhotoUrl}
                    alt={ltName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={16} className={isDarkMode ? 'text-white' : 'text-slate-700'} />
                )}
              </div>
              <div className="text-left flex items-center gap-2">
                <div>
                  <span
                    className={`text-xs font-extrabold transition-colors uppercase block select-none leading-tight ${
                      isDarkMode
                        ? 'text-white group-hover:text-emerald-200'
                        : 'text-slate-900 group-hover:text-[#007a4d]'
                    }`}
                  >
                    {ltName || 'SELECIONE O LÍDER'}
                  </span>
                  <span
                    className={`text-[9px] font-black tracking-widest uppercase block leading-none mt-0.5 ${
                      isDarkMode ? 'text-emerald-200' : 'text-[#007a4d]'
                    }`}
                  >
                    Líder de Turno
                  </span>
                </div>
                <ChevronDown
                  className={`transition-colors ${
                    isDarkMode
                      ? 'text-white/60 group-hover:text-white'
                      : 'text-slate-500 group-hover:text-slate-900'
                  }`}
                  size={14}
                />
              </div>
            </div>

            {isAvatarMenuOpen && (
              <div
                className={`absolute top-full left-0 mt-3 w-52 shadow-2xl py-1 ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } border z-[110]`}
              >
                <button
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    setEditingField('ltName');
                  }}
                  className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-[#007a4d]'
                  }`}
                >
                  <User size={14} /> Mudar Usuário
                </button>
                {onOpenLayoutPrefs && (
                  <button
                    onClick={() => {
                      setIsAvatarMenuOpen(false);
                      onOpenLayoutPrefs();
                    }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-700 hover:bg-emerald-50 hover:text-[#007a4d]'
                    }`}
                  >
                    <SlidersHorizontal size={14} /> Personalizar Tema
                  </button>
                )}
                {onOpenGoogleDrive && (
                  <button
                    onClick={() => {
                      setIsAvatarMenuOpen(false);
                      onOpenGoogleDrive();
                    }}
                    className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300'
                        : 'text-[#007a4d] hover:bg-emerald-50 hover:text-emerald-900'
                    }`}
                  >
                    <HardDrive size={14} /> Google Drive
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    onToggleFullscreen();
                  }}
                  className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-[#007a4d]'
                  }`}
                >
                  {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                  Tela Cheia
                </button>
                <button
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    toggleDarkMode();
                  }}
                  className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-[#007a4d]'
                  }`}
                >
                  {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                  Claro/Escuro
                </button>
                <div className={`w-full h-px my-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <button
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    signOut();
                  }}
                  className={`w-full flex items-center justify-start gap-3 px-4 py-2.5 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                    isDarkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Power size={14} /> Sair do Sistema
                </button>
              </div>
            )}
          </div>

          {editingField === 'ltName' &&
            createPortal(
              <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div
                  className={`w-full max-w-2xl shadow-2xl overflow-hidden ${
                    isDarkMode
                      ? 'bg-[#1a1f2e] border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } border flex flex-col max-h-[80vh]`}
                >
                  <div
                    className={`flex items-center justify-between p-4 border-b ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-200'
                    } shrink-0`}
                  >
                    <h3 className="text-lg font-bold">Selecionar Líder de Turno</h3>
                    <button
                      onClick={() => setEditingField(null)}
                      className={`p-2 transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'hover:bg-slate-800 text-slate-400'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-4 overflow-y-auto">
                    {operators?.length === 0 ? (
                      <p
                        className={`text-center py-8 ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        } italic`}
                      >
                        Nenhum operador encontrado.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {operators?.map((op) => (
                          <button
                            key={op.id}
                            onClick={() => {
                              setLtName(op.name || op.warName || '');
                              setEditingField(null);
                            }}
                            className={`flex items-center gap-3 p-2 transition-all select-none text-left w-full cursor-pointer ${
                              ltName === (op.name || op.warName)
                                ? isDarkMode
                                  ? 'bg-emerald-500/20 border-emerald-500/50'
                                  : 'bg-emerald-50 border-[#007a4d]'
                                : isDarkMode
                                ? 'bg-slate-800/50 border-transparent hover:bg-slate-800'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            } border`}
                          >
                            <div
                              className={`w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 ${
                                isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                              }`}
                            >
                              {op.photoUrl ? (
                                <img
                                  src={op.photoUrl}
                                  alt={op.warName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <User
                                  size={16}
                                  className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 w-full">
                              <p
                                className={`text-sm font-bold truncate ${
                                  isDarkMode ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {op.warName || op.name}
                              </p>
                              <p
                                className={`text-[10px] uppercase font-bold tracking-wider ${
                                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                {op.role || 'LT'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>,
              document.body
            )}

          <div className={dividerClass}></div>

          <div className="flex flex-col justify-center">
            <h1
              className={`text-2xl font-bold tracking-tighter font-mono tabular-nums leading-none ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {formatTime(currentTime)}
            </h1>
            <p
              className={`text-[10px] font-bold tracking-widest leading-none mt-1 ${
                isDarkMode ? 'text-emerald-100' : 'text-slate-500'
              }`}
            >
              {formatDate(currentTime)}
            </p>
          </div>

          <div className={dividerClass}></div>

          <div className="flex items-center gap-6">
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-[10px] uppercase w-9 ${
                    isDarkMode ? 'text-white/80' : 'text-slate-500'
                  }`}
                >
                  DENS.
                </span>
                {editingField === 'density' ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    value={densityN}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (!isNaN(Number(val)) || val === '' || val === '.') {
                        setDensityN(val);
                      }
                    }}
                    onBlur={() => {
                      setEditingField(null);
                      const valNum = Number(densityN) || 0.803;
                      setDensity(valNum);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingField(null);
                        const valNum = Number(densityN) || 0.803;
                        setDensity(valNum);
                      }
                    }}
                    autoFocus
                    className={`w-14 font-mono font-bold text-sm px-1 outline-none ${
                      isDarkMode
                        ? 'bg-white/10 text-white'
                        : 'bg-white text-slate-900 border border-[#007a4d]'
                    }`}
                  />
                ) : (
                  <span
                    className={`font-mono tabular-nums font-bold text-sm cursor-pointer transition-colors w-14 inline-block ${
                      isDarkMode
                        ? 'text-white hover:text-emerald-200'
                        : 'text-slate-900 hover:text-[#007a4d]'
                    }`}
                    onClick={() => setEditingField('density')}
                  >
                    {density.toFixed(3)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`font-bold text-[10px] uppercase w-9 ${
                    isDarkMode ? 'text-white/80' : 'text-slate-500'
                  }`}
                >
                  TEMP.
                </span>
                {editingField === 'temperature' ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tempN}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (!isNaN(Number(val)) || val === '' || val === '-' || val === '.') {
                        setTempN(val);
                      }
                    }}
                    onBlur={() => {
                      setEditingField(null);
                      const valNum = Number(tempN) || 24.5;
                      setTemperature(valNum);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingField(null);
                        const valNum = Number(tempN) || 24.5;
                        setTemperature(valNum);
                      }
                    }}
                    autoFocus
                    className={`w-14 font-mono font-bold text-sm px-1 outline-none ${
                      isDarkMode
                        ? 'bg-white/10 text-white'
                        : 'bg-white text-slate-900 border border-[#007a4d]'
                    }`}
                  />
                ) : (
                  <span
                    className={`font-mono tabular-nums font-bold text-sm cursor-pointer transition-colors w-14 inline-block ${
                      isDarkMode
                        ? 'text-white hover:text-emerald-200'
                        : 'text-slate-900 hover:text-[#007a4d]'
                    }`}
                    onClick={() => setEditingField('temperature')}
                  >
                    {temperature.toFixed(1)}°C
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Alternar para Tema Claro' : 'Alternar para Tema Escuro'}
            className={`flex items-center gap-1.5 px-3 py-1.5 border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun size={14} className="text-amber-300" />
                <span className="hidden md:inline">Tema Claro</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-slate-700" />
                <span className="hidden md:inline">Tema Escuro</span>
              </>
            )}
          </button>

          {onOpenGoogleDrive && (
            <button
              type="button"
              onClick={onOpenGoogleDrive}
              title="Abrir Google Drive NOC"
              className={`flex items-center gap-2 px-3 py-1.5 border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer group ${
                isDarkMode
                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                  : 'bg-[#007a4d] hover:bg-[#00633e] border-[#00633e] text-white'
              }`}
            >
              <HardDrive
                size={14}
                className={`${
                  isDarkMode ? 'text-emerald-300' : 'text-white'
                } group-hover:scale-110 transition-transform`}
              />
              <span className="hidden sm:inline text-white">Google Drive</span>
            </button>
          )}
          <div id="header-options-portal-target"></div>
        </div>
      </header>
    </>
  );
};
