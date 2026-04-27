import { api } from '@/libs/axios';

export interface UploadResponse {
  url: string;
  public_id: string;
}

export interface S3UploadResponse {
  ok: boolean;
  key: string;
  url: string;
}

// Cloudinary — field name must be "image" (matches multer.single("image") on the service)
// Content-Type must be undefined so axios auto-adds multipart/form-data + boundary from FormData
// (the api instance defaults to application/json which would break FormData uploads)
export const uploadCampaignImage = async (
  image: File,
  folder: string = 'campaigns'
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('folder', folder);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};

// S3 — field name must be "file" (matches multer.single("file") on s3-service)
// Only accepts PDF files
export const uploadPdfToS3 = async (file: File): Promise<S3UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/s3-upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};
