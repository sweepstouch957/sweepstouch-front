import { api } from '@/libs/axios';

export interface UploadResponse {
  url: string;
  public_id: string;
}

export const uploadCampaignImage = async (
  image: File,
  folder: string = 'campaigns'
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('folder', folder);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data; // { url, public_id }
};
