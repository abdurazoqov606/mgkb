
export interface ImageFile {
  id: string;
  original: File;
  compressed?: Blob;
  originalUrl: string;
  compressedUrl?: string;
  status: 'pending' | 'compressing' | 'done' | 'error';
  originalSize: number;
  compressedSize?: number;
  error?: string;
  aiAnalysis?: string;
}

export interface CompressionSettings {
  targetSizeKb: number;
  maxWidth: number;
}
