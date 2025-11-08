// utils/format.js
export const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const initialsFromSlug = (slug = "") =>
  slug
    .replace(/[-_]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "ST";
