import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { FlightData } from '../types';

// Ensure Firebase is initialized once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// All Google Drive & Workspace scopes requested
export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
  'https://www.googleapis.com/auth/spreadsheets'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => {
  provider.addScope(scope);
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initGoogleDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleDriveSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleDriveLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
  parents?: string[];
}

export interface DriveStorageInfo {
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
    usageInDriveTrash?: string;
  };
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
}

/**
 * List files and folders from Google Drive
 */
export const listDriveFiles = async (options: {
  query?: string;
  folderId?: string;
  mimeType?: string;
  pageSize?: number;
} = {}): Promise<DriveFileItem[]> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive. Conecte sua conta primeiro.');
  }

  let queryParts: string[] = ['trashed = false'];

  if (options.folderId) {
    queryParts.push(`'${options.folderId}' in parents`);
  }

  if (options.mimeType) {
    queryParts.push(`mimeType = '${options.mimeType}'`);
  }

  if (options.query) {
    queryParts.push(`name contains '${options.query.replace(/'/g, "\\'")}'`);
  }

  const q = encodeURIComponent(queryParts.join(' and '));
  const fields = encodeURIComponent('files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink,owners,parents)');
  const pageSize = options.pageSize || 50;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=${pageSize}&orderBy=folder,modifiedTime desc`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Falha ao buscar arquivos do Google Drive');
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Get user information and Drive storage quota
 */
export const getDriveAbout = async (): Promise<DriveStorageInfo> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive');
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Falha ao obter dados de armazenamento');
  }

  return await res.json();
};

/**
 * Creates a folder in Google Drive
 */
export const createDriveFolder = async (folderName: string, parentFolderId?: string): Promise<DriveFileItem> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive');
  }

  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Falha ao criar pasta no Google Drive');
  }

  return await res.json();
};

/**
 * Finds or creates the default MALHA folder in Google Drive
 */
export const getOrCreateMalhaFolder = async (): Promise<string> => {
  const folderName = 'MALHA SBGR - Operações & Relatórios';
  const files = await listDriveFiles({
    query: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  });

  const existing = files.find(f => f.name === folderName);
  if (existing) {
    return existing.id;
  }

  const created = await createDriveFolder(folderName);
  return created.id;
};

/**
 * Uploads a file (multipart) to Google Drive
 */
export const uploadFileToDrive = async (params: {
  name: string;
  mimeType: string;
  content: Blob | string;
  folderId?: string;
  description?: string;
}): Promise<DriveFileItem> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive');
  }

  const metadata: any = {
    name: params.name,
    mimeType: params.mimeType,
    description: params.description || 'Gerado automaticamente pelo Sistema MALHA SBGR'
  };

  if (params.folderId) {
    metadata.parents = [params.folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const blob = typeof params.content === 'string' 
    ? new Blob([params.content], { type: params.mimeType })
    : params.content;

  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' });

  // Use FormData / multipart body
  const multipartBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadataBlob,
    delimiter,
    `Content-Type: ${params.mimeType}\r\n\r\n`,
    blob,
    closeDelimiter
  ], { type: `multipart/related; boundary=${boundary}` });

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,modifiedTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: multipartBody
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Falha ao fazer upload do arquivo para o Google Drive');
  }

  return await res.json();
};

/**
 * Download a file from Google Drive as a Blob
 */
export const downloadDriveFile = async (fileId: string): Promise<{ blob: Blob; name: string; mimeType: string }> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive');
  }

  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!metaRes.ok) {
    throw new Error('Falha ao verificar arquivo no Google Drive');
  }

  const meta = await metaRes.json();
  let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  if (meta.mimeType === 'application/vnd.google-apps.spreadsheet') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
  } else if (meta.mimeType === 'application/vnd.google-apps.document') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
  }

  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error('Falha ao baixar arquivo do Google Drive');
  }

  const blob = await res.blob();
  return { blob, name: meta.name, mimeType: meta.mimeType };
};

/**
 * Delete a file from Google Drive (Mandatory user confirmation handled by caller/UI)
 */
export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getGoogleDriveAccessToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Google Drive');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Falha ao excluir arquivo do Google Drive');
  }
};

/**
 * Export full operational mesh to Google Drive as JSON or spreadsheet
 */
export const exportOperationalMeshToDrive = async (flights: FlightData[], dateStr: string): Promise<DriveFileItem> => {
  const folderId = await getOrCreateMalhaFolder();
  const fileName = `MALHA_OPERACIONAL_SBGR_${dateStr.replace(/\//g, '-')}_${new Date().toISOString().substring(11, 16).replace(':', 'H')}.json`;
  
  const content = JSON.stringify({
    system: 'MALHA JETFUEL-SIM SBGR NOC',
    exportDate: new Date().toISOString(),
    operationalDate: dateStr,
    totalFlights: flights.length,
    flights: flights
  }, null, 2);

  return await uploadFileToDrive({
    name: fileName,
    mimeType: 'application/json',
    content: content,
    folderId: folderId,
    description: `Exportação da Malha Operacional SBGR - ${flights.length} voos registrados.`
  });
};
