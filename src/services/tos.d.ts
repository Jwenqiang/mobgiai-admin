// Type declarations for tos.js
export interface TosUploadOptions {
  onProgress?: (progress: number) => void;
}

export interface TosTokenResponse {
  accessKeyId: string;
  accessKeySecret?: string;
  secretAccessKey?: string;
  sessionToken: string;
  region: string;
  bucket: string;
  mainPath?: string;
  publicDomain?: string;
}

export interface ImageUploadResult {
  imageUrl: string;
  uploadFileName: string;
}

export interface VideoUploadResult {
  videoUrl: string;
  uploadFileName: string;
}

export function uploadBigVideoToTOS(
  file: File,
  tosConfig: TosTokenResponse
): Promise<VideoUploadResult>;

export function uploadImageToTOS(
  file: File,
  tosConfig: TosTokenResponse
): Promise<ImageUploadResult>;

export function testImageUploadMethods(file: File): Promise<any>;

export function uploadImageWithFixedContentType(file: File): Promise<string>;
