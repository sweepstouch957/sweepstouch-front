/**
 * Helper to dynamically inject Cloudinary transformation options into image URLs.
 * This significantly reduces initial page load payload by requesting properly sized thumbnails.
 *
 * @param url Cloudinary delivery URL
 * @param width requested width in pixels
 * @param height requested height in pixels
 * @param mode scaling mode ('fill' or 'fit')
 */
export function cloudinaryThumb(
  url: string | null | undefined,
  width = 96,
  height = 96,
  mode: 'fill' | 'fit' = 'fill'
): string {
  if (!url) return '';
  if (!url.includes('/upload/')) return url;

  // Cloudinary optimization parameters:
  // f_auto: Automatically deliver the best format based on browser support (avif/webp).
  // q_auto:eco: Compress using the eco quality profile to save bandwidth without visible loss.
  // w_/h_: Resize to requested thumbnail dimensions.
  // c_: Cropping/resize mode (fill or fit).
  // dpr_auto: Adjust to high-density/Retina displays if requested.
  const transform = [
    'f_auto',
    'q_auto:eco',
    `w_${width}`,
    `h_${height}`,
    `c_${mode}`,
    'dpr_auto',
  ].join(',');

  return url.replace('/upload/', `/upload/${transform}/`);
}
