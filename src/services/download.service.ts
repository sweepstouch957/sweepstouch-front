/**
 * download.service.ts
 *
 * Helpers de cliente para descargar archivos/imágenes remotas en el navegador.
 * Centraliza el flujo raw fetch + blob → descarga por anchor para que las
 * páginas no hagan llamadas fetch() directas.
 */

/** Descarga un archivo remoto y dispara la descarga en el navegador.
 *  Si falla el fetch/blob, abre la URL en una pestaña nueva. */
export async function downloadRemoteFile(url: string, filename?: string): Promise<void> {
  try {
    const resp = await fetch(url, { credentials: 'omit' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || url.split('/').pop() || 'qr';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/** Descarga una imagen remota derivando la extensión del mime type del blob.
 *  Si falla, abre la URL en una pestaña nueva. */
export async function downloadImageWithDerivedExtension(
  url: string,
  baseName: string
): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const extension = blob.type.split('/')[1] || 'png';

    link.href = objectUrl;
    link.download = `${baseName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
