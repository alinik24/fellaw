/**
 * Document Upload API Client
 * Handles file uploads and document analysis requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface DocumentAnalysisResponse {
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  analysis_complete: boolean;
  extracted_text: string;
  key_value_pairs: Array<{ key: string; value: string }>;
  tables: Array<any>;
  entities: Array<any>;
  metadata: Record<string, any>;
}

export interface ImageUploadResponse {
  file_id: string;
  filename: string;
  file_size: number;
  extracted_text: string;
  metadata?: Record<string, any>;
  warning?: string;
  error?: string;
}

export interface AudioUploadResponse {
  file_id: string;
  filename: string;
  file_size: number;
  note: string;
}

/**
 * Get authorization header if user is logged in
 */
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('access_token');
  if (token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
  return {};
}

/**
 * Upload and analyze a document
 *
 * @param file - The document file to upload
 * @param analyze - Whether to run AI analysis on the document (default: true)
 * @returns Document analysis results
 *
 * @example
 * ```tsx
 * const result = await uploadDocument(file, true);
 * console.log('Extracted text:', result.extracted_text);
 * ```
 */
export async function uploadDocument(
  file: File,
  analyze: boolean = true
): Promise<DocumentAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const url = new URL(`${API_BASE_URL}/api/v1/upload/document`);
  if (!analyze) {
    url.searchParams.append('analyze', 'false');
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload document');
  }

  return response.json();
}

/**
 * Upload an image and extract text via OCR
 *
 * @param file - The image file to upload
 * @param extractText - Whether to extract text from the image (default: true)
 * @returns Image upload and OCR results
 *
 * @example
 * ```tsx
 * const result = await uploadImage(imageFile);
 * console.log('OCR text:', result.extracted_text);
 * ```
 */
export async function uploadImage(
  file: File,
  extractText: boolean = true
): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const url = new URL(`${API_BASE_URL}/api/v1/upload/image`);
  if (!extractText) {
    url.searchParams.append('extract_text', 'false');
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload image');
  }

  return response.json();
}

/**
 * Upload an audio file
 *
 * @param file - The audio file to upload
 * @returns Audio upload result
 *
 * @example
 * ```tsx
 * const result = await uploadAudio(audioFile);
 * console.log('Audio uploaded:', result.file_id);
 * ```
 */
export async function uploadAudio(
  file: File
): Promise<AudioUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/upload/audio`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload audio');
  }

  return response.json();
}

/**
 * Delete an uploaded file
 *
 * @param fileId - The ID of the file to delete
 * @returns Deletion confirmation
 *
 * @example
 * ```tsx
 * await deleteUploadedFile('123e4567-e89b-12d3-a456-426614174000');
 * ```
 */
export async function deleteUploadedFile(
  fileId: string
): Promise<{ message: string; file_id: string }> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Authentication required to delete files');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/upload/file/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete file');
  }

  return response.json();
}

/**
 * Helper function to validate file type
 *
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types or extensions
 * @returns True if file type is allowed
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  return allowedTypes.some(
    (type) =>
      type.toLowerCase() === fileExtension ||
      type.toLowerCase() === mimeType ||
      (type.includes('*') && mimeType.startsWith(type.split('*')[0]))
  );
}

/**
 * Helper function to validate file size
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in megabytes
 * @returns True if file size is within limit
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number = 50
): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Allowed file types for documents
 */
export const ALLOWED_DOCUMENT_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.rtf',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

/**
 * Allowed file types for images
 */
export const ALLOWED_IMAGE_TYPES = [
  '.jpg',
  '.jpeg',
  '.png',
  '.bmp',
  '.tiff',
  '.tif',
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/tiff'
];

/**
 * Allowed file types for audio
 */
export const ALLOWED_AUDIO_TYPES = [
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.webm',
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/ogg',
  'audio/webm'
];
