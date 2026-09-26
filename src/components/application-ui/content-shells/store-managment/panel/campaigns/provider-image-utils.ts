import { CAMPAIGN_ART_MAX_BYTES } from '@/services/upload.service';

// El peso del MMS ya no lo controla quien sube: cualquier arte hasta 100 MB se comprime
// solo a < 500 KB al guardar (uploadCampaignArt). `provider` queda por compatibilidad.
export function isValidImageSizeForProvider(fileSize: number, _provider?: string): boolean {
  return fileSize <= CAMPAIGN_ART_MAX_BYTES;
}

export function getProviderImageErrorMessage(_provider?: string): string {
  return 'La imagen no puede superar los 100 MB.';
}
