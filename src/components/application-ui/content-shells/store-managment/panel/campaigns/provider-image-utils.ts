export function isValidImageSizeForProvider(fileSize: number, provider: string): boolean {
  // Configuración de límites por proveedor
  if (provider.toLowerCase() === 'infobip') {
    return fileSize <= 2 * 1024 * 1024; // 2MB
  }
  // Twilio / Bandwidth u otros (conservador)
  return fileSize <= 500 * 1024; // 500 KB
}

export function getProviderImageErrorMessage(provider: string): string {
  if (provider.toLowerCase() === 'infobip') {
    return 'La imagen no puede superar los 2 MB para envíos con Infobip. Por favor usa una más ligera.';
  }
  return 'La imagen no puede superar los 500 KB. Por favor usa una más ligera.';
}
