import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, HardDrive, RefreshCw, FolderPlus, Upload, Search, 
  Trash2, ExternalLink, Download, FileText, Table, FileSpreadsheet, 
  Folder, CheckCircle, AlertTriangle, User as UserIcon, ArrowUpDown, ShieldCheck,
  CloudUpload
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  initGoogleDriveAuth, googleDriveSignIn, googleDriveLogout,
  listDriveFiles, getDriveAbout, uploadFileToDrive, createDriveFolder,
  downloadDriveFile, deleteDriveFile, exportOperationalMeshToDrive,
  DriveFileItem, DriveStorageInfo, getOrCreateMalhaFolder
} from '../../services/googleDriveService';
import { FlightData } from '../../types';

interface GoogleDriveModalProps {
  isDarkMode: boolean;
  onClose: () => void;
  flights?: FlightData[];
  onImportFlightsFromFile?: (file: File) => void;
  onImportFlightsFromJson?: (flights: FlightData[]) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isDarkMode,
  onClose,
  flights = [],
  onImportFlightsFromFile,
  onImportFlightsFromJson
}) => {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'FILES' | 'BACKUP' | 'UPLOAD'>('FILES');

  // Drive state
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<DriveStorageInfo | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<'ALL' | 'SPREADSHEET' | 'PDF' | 'JSON' | 'FOLDER'>('ALL');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Backup state
  const [isExporting, setIsExporting] = useState(false);

  // Upload state
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Folder creation
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Delete Confirmation Dialog (Mandatory user confirmation)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = initGoogleDriveAuth(
      (authUser) => {
        setNeedsAuth(false);
        setUser(authUser);
        loadDriveData();
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadDriveData = async () => {
    setIsLoadingFiles(true);
    setStatusMessage(null);
    try {
      const [driveFiles, aboutInfo] = await Promise.all([
        listDriveFiles(),
        getDriveAbout().catch(() => null)
      ]);
      setFiles(driveFiles);
      if (aboutInfo) setStorageInfo(aboutInfo);
    } catch (err: any) {
      console.error('Error loading Drive files:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao carregar dados do Google Drive' });
      if (err.message?.includes('401') || err.message?.includes('autenticado')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const result = await googleDriveSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        await loadDriveData();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao conectar ao Google Drive' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await googleDriveLogout();
    setUser(null);
    setNeedsAuth(true);
    setFiles([]);
  };

  const handleSearch = async () => {
    setIsLoadingFiles(true);
    setStatusMessage(null);
    try {
      let mimeType: string | undefined = undefined;
      if (fileFilter === 'SPREADSHEET') mimeType = 'application/vnd.google-apps.spreadsheet';
      if (fileFilter === 'PDF') mimeType = 'application/pdf';
      if (fileFilter === 'FOLDER') mimeType = 'application/vnd.google-apps.folder';

      const results = await listDriveFiles({
        query: searchQuery.trim() || undefined,
        mimeType: mimeType
      });
      setFiles(results);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao pesquisar no Drive' });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      await createDriveFolder(newFolderName.trim());
      setNewFolderName('');
      setStatusMessage({ type: 'success', text: `Pasta "${newFolderName}" criada no Google Drive com sucesso!` });
      await loadDriveData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao criar pasta' });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleBackupToDrive = async () => {
    if (flights.length === 0) {
      setStatusMessage({ type: 'error', text: 'Não há voos na malha atual para exportar.' });
      return;
    }

    setIsExporting(true);
    setStatusMessage(null);
    try {
      const todayStr = new Date().toLocaleDateString('pt-BR');
      const exportedFile = await exportOperationalMeshToDrive(flights, todayStr);
      setStatusMessage({ 
        type: 'success', 
        text: `Backup salvo com sucesso na pasta "MALHA SBGR - Operações & Relatórios" (${exportedFile.name})!` 
      });
      await loadDriveData();
    } catch (err: any) {
      console.error('Backup error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao realizar backup no Google Drive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleUploadLocalFile = async () => {
    if (!selectedUploadFile) return;
    setIsUploading(true);
    setStatusMessage(null);
    try {
      const malhaFolderId = await getOrCreateMalhaFolder();
      await uploadFileToDrive({
        name: selectedUploadFile.name,
        mimeType: selectedUploadFile.type || 'application/octet-stream',
        content: selectedUploadFile,
        folderId: malhaFolderId
      });
      setSelectedUploadFile(null);
      setStatusMessage({ type: 'success', text: `Arquivo "${selectedUploadFile.name}" enviado com sucesso ao Google Drive!` });
      await loadDriveData();
      setActiveTab('FILES');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao enviar arquivo para o Google Drive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFile = async (file: DriveFileItem) => {
    try {
      setStatusMessage({ type: 'info', text: `Baixando "${file.name}"...` });
      const { blob, name } = await downloadDriveFile(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: `Download de "${file.name}" concluído!` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao baixar arquivo' });
    }
  };

  const handleImportToMalha = async (file: DriveFileItem) => {
    try {
      setStatusMessage({ type: 'info', text: `Processando importação de "${file.name}"...` });
      const { blob, name, mimeType } = await downloadDriveFile(file.id);
      
      if (name.endsWith('.json') || mimeType === 'application/json') {
        const text = await blob.text();
        const parsed = JSON.parse(text);
        if (parsed.flights && Array.isArray(parsed.flights) && onImportFlightsFromJson) {
          onImportFlightsFromJson(parsed.flights);
          setStatusMessage({ type: 'success', text: `Importação de ${parsed.flights.length} voos concluída da malha do Drive!` });
          onClose();
          return;
        }
      }

      if (onImportFlightsFromFile) {
        const localFile = new File([blob], name, { type: blob.type });
        onImportFlightsFromFile(localFile);
        setStatusMessage({ type: 'success', text: `Arquivo "${name}" enviado para o analisador de malha!` });
        onClose();
      } else {
        setStatusMessage({ type: 'info', text: 'Arquivo baixado para importação.' });
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao importar arquivo para a Malha' });
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setStatusMessage({ type: 'success', text: `Arquivo "${fileToDelete.name}" removido do Google Drive.` });
      setFileToDelete(null);
      await loadDriveData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao excluir arquivo' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '--';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType.includes('folder')) return <Folder className="text-amber-400" size={18} />;
    if (mimeType.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
      return <FileSpreadsheet className="text-emerald-400" size={18} />;
    }
    if (mimeType.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="text-rose-400" size={18} />;
    }
    if (name.endsWith('.json')) {
      return <Table className="text-blue-400" size={18} />;
    }
    return <FileText className="text-slate-400" size={18} />;
  };

  const filteredFiles = files.filter(f => {
    if (fileFilter === 'ALL') return true;
    if (fileFilter === 'SPREADSHEET') {
      return f.mimeType.includes('spreadsheet') || f.name.endsWith('.xlsx') || f.name.endsWith('.csv');
    }
    if (fileFilter === 'PDF') {
      return f.mimeType.includes('pdf') || f.name.endsWith('.pdf');
    }
    if (fileFilter === 'JSON') {
      return f.name.endsWith('.json') || f.mimeType.includes('json');
    }
    if (fileFilter === 'FOLDER') {
      return f.mimeType.includes('folder');
    }
    return true;
  });

  return createPortal(
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9995] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}>
        
        {/* HEADER */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#004D24] text-white border-transparent'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
              <HardDrive size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-wider text-white">Google Drive NOC</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-white/70">Gerenciamento seguro de relatórios, malhas e backups em nuvem</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* AUTH BANNER */}
        {needsAuth ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
              <HardDrive size={32} />
            </div>
            <h3 className="text-lg font-bold">Conecte sua conta do Google Drive</h3>
            <p className={`text-xs max-w-md ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Acesse suas planilhas operacionais, salve cópias de segurança da malha e exporte relatórios de voo com permissão de acesso ao Google Workspace.
            </p>

            <button 
              className="gsi-material-button mt-4" 
              onClick={handleLogin} 
              disabled={isLoggingIn}
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper flex items-center px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 text-slate-800 text-sm font-semibold transition-all">
                <div className="gsi-material-button-icon mr-3">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">{isLoggingIn ? 'Conectando ao Google...' : 'Sign in with Google'}</span>
              </div>
            </button>
          </div>
        ) : (
          <>
            {/* SUBHEADER TABS & USER BAR */}
            <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('FILES')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    activeTab === 'FILES'
                      ? isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#004D24] text-white shadow-sm'
                      : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <HardDrive size={14} />
                  Arquivos no Drive
                </button>

                <button
                  onClick={() => setActiveTab('BACKUP')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    activeTab === 'BACKUP'
                      ? isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#004D24] text-white shadow-sm'
                      : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <CloudUpload size={14} />
                  Backup da Malha ({flights.length})
                </button>

                <button
                  onClick={() => setActiveTab('UPLOAD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    activeTab === 'UPLOAD'
                      ? isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#004D24] text-white shadow-sm'
                      : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Upload size={14} />
                  Enviar Arquivo
                </button>
              </div>

              {/* USER STATUS */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    <UserIcon size={12} />
                  </div>
                  <span className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} truncate max-w-[180px]`}>
                    {user?.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border transition-colors ${
                    isDarkMode ? 'border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Desconectar
                </button>
              </div>
            </div>

            {/* STATUS NOTIFICATION */}
            {statusMessage && (
              <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
                statusMessage.type === 'success' 
                  ? isDarkMode ? 'bg-emerald-950/60 text-emerald-300 border-emerald-900' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? isDarkMode ? 'bg-red-950/60 text-red-300 border-red-900' : 'bg-red-50 text-red-800 border-red-200'
                  : isDarkMode ? 'bg-blue-950/60 text-blue-300 border-blue-900' : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  {statusMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                  <span>{statusMessage.text}</span>
                </div>
                <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: FILES EXPLORER */}
              {activeTab === 'FILES' && (
                <div className="space-y-4">
                  {/* Search and Filters Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                      <div className={`relative flex-1 flex items-center rounded-lg border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}>
                        <Search size={16} className="text-slate-400 ml-3 shrink-0" />
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="Buscar arquivos ou planilhas no Drive..."
                          className={`w-full bg-transparent px-3 py-2 text-xs outline-none ${isDarkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Buscar
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(['ALL', 'SPREADSHEET', 'PDF', 'JSON', 'FOLDER'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setFileFilter(filter)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                            fileFilter === filter
                              ? isDarkMode ? 'bg-slate-800 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-900 border-emerald-400'
                              : isDarkMode ? 'border-slate-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {filter === 'ALL' ? 'Todos' : filter === 'SPREADSHEET' ? 'Planilhas' : filter === 'PDF' ? 'PDFs' : filter === 'JSON' ? 'Backups' : 'Pastas'}
                        </button>
                      ))}
                      <button
                        onClick={loadDriveData}
                        title="Atualizar lista"
                        className={`p-2 rounded-lg border transition-colors ${
                          isDarkMode ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <RefreshCw size={14} className={isLoadingFiles ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Create Folder Box */}
                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <FolderPlus size={18} className="text-amber-400 shrink-0" />
                    <input 
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Nome da nova pasta no Google Drive..."
                      className={`flex-1 bg-transparent border-b text-xs py-1 outline-none ${isDarkMode ? 'border-slate-700 text-white placeholder-slate-600 focus:border-amber-400' : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'}`}
                    />
                    <button
                      onClick={handleCreateFolder}
                      disabled={isCreatingFolder || !newFolderName.trim()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        !newFolderName.trim() || isCreatingFolder
                          ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-400'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                      }`}
                    >
                      {isCreatingFolder ? 'Criando...' : 'Criar Pasta'}
                    </button>
                  </div>

                  {/* Files Table */}
                  <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
                    {isLoadingFiles ? (
                      <div className="py-16 flex flex-col items-center justify-center space-y-3 opacity-60">
                        <RefreshCw className="animate-spin text-emerald-500" size={28} />
                        <span className="text-xs font-mono uppercase tracking-widest">Sincronizando com o Google Drive...</span>
                      </div>
                    ) : filteredFiles.length === 0 ? (
                      <div className="py-16 text-center space-y-2 opacity-50">
                        <HardDrive className="mx-auto text-slate-400" size={36} />
                        <p className="text-xs font-bold uppercase tracking-wider">Nenhum arquivo encontrado</p>
                        <p className="text-[11px] text-slate-500">Crie pastas ou envie arquivos para visualizá-los aqui.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-[380px] custom-scrollbar">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className={`sticky top-0 z-10 text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}`}>
                            <tr>
                              <th className="px-4 py-3">Arquivo / Pasta</th>
                              <th className="px-4 py-3">Modificado</th>
                              <th className="px-4 py-3">Tamanho</th>
                              <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40 font-medium">
                            {filteredFiles.map((file) => {
                              const isSpreadsheetOrData = file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.json') || file.mimeType.includes('spreadsheet');

                              return (
                                <tr key={file.id} className={`hover:bg-emerald-500/5 transition-colors ${isDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50'}`}>
                                  <td className="px-4 py-3 flex items-center gap-3">
                                    <div className="shrink-0">{getFileIcon(file.mimeType, file.name)}</div>
                                    <div className="truncate max-w-[280px]">
                                      <span className={`block font-bold text-xs truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{file.name}</span>
                                      <span className="text-[10px] text-slate-500 font-mono block truncate">{file.mimeType}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                                    {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('pt-BR') : '--'}
                                  </td>
                                  <td className="px-4 py-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                                    {formatFileSize(file.size)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {isSpreadsheetOrData && (
                                        <button
                                          onClick={() => handleImportToMalha(file)}
                                          title="Importar para o Sistema de Malha"
                                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors"
                                        >
                                          <Download size={11} />
                                          Importar
                                        </button>
                                      )}

                                      {file.webViewLink && (
                                        <a
                                          href={file.webViewLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          title="Abrir no Google Drive"
                                          className={`p-1.5 rounded border transition-colors ${
                                            isDarkMode ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                          }`}
                                        >
                                          <ExternalLink size={13} />
                                        </a>
                                      )}

                                      <button
                                        onClick={() => handleDownloadFile(file)}
                                        title="Baixar arquivo"
                                        className={`p-1.5 rounded border transition-colors ${
                                          isDarkMode ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                      >
                                        <Download size={13} />
                                      </button>

                                      <button
                                        onClick={() => setFileToDelete(file)}
                                        title="Excluir arquivo do Google Drive"
                                        className="p-1.5 rounded border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: OPERATIONAL MESH BACKUP */}
              {activeTab === 'BACKUP' && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck size={18} className="text-emerald-500" />
                          Backup da Malha Operacional SBGR
                        </h4>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Gera um snapshot integral com todos os {flights.length} voos registrados, status de calço, operadores e logs de auditoria, salvando diretamente na nuvem corporativa do Google Drive.
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                        {flights.length} Voos Carregados
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={handleBackupToDrive}
                        disabled={isExporting || flights.length === 0}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-white shadow-lg transition-all ${
                          isExporting || flights.length === 0
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        }`}
                      >
                        {isExporting ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Enviando ao Drive...
                          </>
                        ) : (
                          <>
                            <CloudUpload size={16} />
                            Salvar Backup Agora no Drive
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: UPLOAD LOCAL FILE */}
              {activeTab === 'UPLOAD' && (
                <div className="space-y-6">
                  <div className={`p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center ${
                    isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                  }`}>
                    <Upload size={36} className="text-emerald-500 mb-3 opacity-80" />
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-1">Selecionar Arquivo para o Google Drive</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-4 max-w-sm`}>
                      Envie relatórios operacionais, planilhas da escala ou documentos técnicos para a pasta central da Malha SBGR.
                    </p>

                    <input 
                      type="file"
                      id="drive-local-upload"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSelectedUploadFile(e.target.files[0]);
                        }
                      }}
                    />

                    {selectedUploadFile ? (
                      <div className="space-y-4">
                        <div className={`p-3 rounded-lg border flex items-center gap-3 text-left ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                          <FileText size={20} className="text-emerald-400 shrink-0" />
                          <div>
                            <span className="block font-bold text-xs">{selectedUploadFile.name}</span>
                            <span className="block text-[10px] text-slate-500 font-mono">{(selectedUploadFile.size / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setSelectedUploadFile(null)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleUploadLocalFile}
                            disabled={isUploading}
                            className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
                          >
                            {isUploading ? 'Enviando...' : 'Confirmar Upload'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label 
                        htmlFor="drive-local-upload"
                        className="cursor-pointer px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors flex items-center gap-2"
                      >
                        <Upload size={16} />
                        Escolher Arquivo do Computador
                      </label>
                    )}
                  </div>
                </div>
              )}

            </div>
          </>
        )}

        {/* FOOTER */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-xs shrink-0 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px]">MALHA NOC SBGR • Google Workspace Enterprise Integration</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider border transition-colors ${
              isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Fechar
          </button>
        </div>

      </div>

      {/* CONFIRM DELETE MODAL (Mandatory Explicit User Confirmation Dialog) */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 ${isDarkMode ? 'bg-slate-900 border-red-500/30 text-white' : 'bg-white border-red-200 text-slate-900'}`}>
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold uppercase tracking-wider">Confirmar Exclusão no Drive</h3>
            </div>
            
            <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Tem certeza de que deseja excluir o arquivo <b className="text-red-400 font-mono">"{fileToDelete.name}"</b> do Google Drive? Esta ação removerá o arquivo permanentemente.
            </p>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white font-bold shadow-md transition-colors"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir do Drive'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
};
