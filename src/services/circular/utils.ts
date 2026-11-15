/** Helpers para filename -> slug/título */
export function inferStoreSlugFromFilename(fileName: string): string | null {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const norm = base
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  const slug = norm
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.length ? slug : null;
}

export function inferTitleFromFilename(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}
