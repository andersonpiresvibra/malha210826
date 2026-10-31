import { 
  initGoogleDriveAuth as initGoogleAuth,
  googleDriveSignIn as googleSignIn,
  getGoogleDriveAccessToken as getGoogleAccessToken,
  googleDriveLogout as googleLogout,
  downloadDriveFile as downloadDriveFileService,
  listDriveFiles as listDriveFilesService
} from './googleDriveService';

export { initGoogleAuth, googleSignIn, getGoogleAccessToken, googleLogout };

// Spreadsheet Logic
export const importFromSpreadsheet = async (spreadsheetId: string, range: string): Promise<any> => {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
        throw new Error('Usuário não autenticado no Google');
    }

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) {
        throw new Error('Falha ao ler dados da planilha do Google');
    }

    const data = await res.json();
    return data;
};

// Drive Logic
export const listDriveFiles = async (mimeType?: string): Promise<any[]> => {
    return await listDriveFilesService({ mimeType });
};

export const downloadDriveFile = async (fileId: string): Promise<Blob> => {
    const res = await downloadDriveFileService(fileId);
    return res.blob;
};

