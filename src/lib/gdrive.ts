import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

function getGoogleAuth() {
  const email = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    return null;
  }

  try {
    return new google.auth.JWT({
      email,
      key: privateKey,
      scopes: SCOPES
    });
  } catch (error) {
    console.error("Failed to initialize Google Auth JWT client:", error);
    return null;
  }
}

/**
 * Creates a folder inside the parent folder in Google Drive (if it doesn't already exist)
 * @param folderName The name of the folder (e.g. Patient Name + Phone)
 * @param parentFolderId The ID of the parent folder in Google Drive (falls back to env)
 */
export async function getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
  const auth = getGoogleAuth();
  if (!auth) {
    console.warn("Google Drive auth is not configured. Simulating folder creation.");
    return `mock-folder-id-${Date.now()}`;
  }

  const driveClient = google.drive({ version: 'v3', auth });
  const parentId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  // Construct search query
  let q = `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }

  try {
    const list = await driveClient.files.list({
      q,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (list.data.files && list.data.files.length > 0) {
      return list.data.files[0].id!;
    }

    // Folder doesn't exist, create it
    const fileMetadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const folder = await driveClient.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    const folderId = folder.data.id!;

    // Make folder accessible to anyone with the link
    try {
      await driveClient.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError) {
      console.error("Failed to set public view permissions on folder:", permError);
    }

    return folderId;
  } catch (error) {
    console.error("Error in getOrCreateFolder:", error);
    throw error;
  }
}

/**
 * Uploads a file (buffer) to a specific Google Drive folder
 * @param fileName Name of the file
 * @param mimeType Mime type of the file
 * @param fileBuffer Buffer containing the file data
 * @param folderId The destination folder ID on Google Drive (falls back to env)
 */
export async function uploadToDrive(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  folderId?: string
): Promise<{ fileId: string; webViewLink: string }> {
  const auth = getGoogleAuth();
  if (!auth) {
    console.warn("Google Drive auth is not configured. Simulating file upload.");
    return {
      fileId: `mock-drive-id-${Date.now()}`,
      webViewLink: `https://drive.google.com/mock-file-view-${Date.now()}`,
    };
  }

  const driveClient = google.drive({ version: 'v3', auth });
  const parentId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  const fileMetadata: any = {
    name: fileName,
  };

  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  // Create readable stream from buffer
  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  try {
    const media = {
      mimeType: mimeType,
      body: bufferStream,
    };

    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    const fileId = response.data.id!;
    let webViewLink = response.data.webViewLink || '';

    // Make individual file viewable by anyone with link
    try {
      await driveClient.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError) {
      console.error("Failed to set public permissions on file:", permError);
    }

    return {
      fileId,
      webViewLink,
    };
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    throw error;
  }
}
