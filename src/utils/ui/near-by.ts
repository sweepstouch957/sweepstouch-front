import { PromoterBrief, StoreInfo } from "@/models/near-by";

export const fmtInt = (n?: number) => (typeof n === "number" ? n.toLocaleString() : "0");
export const fmtMoney = (n?: number) => (typeof n === "number" ? `$${n.toFixed(2)}` : "$0.00");

export const getDistance = (p: PromoterBrief) =>
  typeof p.distanceMiles === "number"
    ? p.distanceMiles
    : typeof p.distance === "number"
    ? p.distance
    : undefined;

export const getLngLatFromStore = (store?: StoreInfo) => {
  if (!store) return undefined;
  if (store.coordinates && store.coordinates.length === 2)
    return { longitude: store.coordinates[0], latitude: store.coordinates[1] };
  if (typeof store.lng === "number" && typeof store.lat === "number")
    return { longitude: store.lng, latitude: store.lat };
  return undefined;
};

export const getLngLatFromPromoter = (p?: PromoterBrief) => {
  if (!p) return undefined;
  if (p.coordinates && p.coordinates.length === 2)
    return { longitude: p.coordinates[0], latitude: p.coordinates[1] };
  if (typeof p.lng === "number" && typeof p.lat === "number")
    return { longitude: p.lng, latitude: p.lat };
  return undefined;
};

export const googleMapsUrlFromStore = (store: StoreInfo) => {
  const c = getLngLatFromStore(store);
  if (c) return `https://maps.google.com/?q=${c.latitude},${c.longitude}`;
  const q = [store.name, store.address, store.city, store.state, store.zipCode]
    .filter(Boolean)
    .join(" ");
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`;
};

export const copy = (text?: string) => text && navigator.clipboard.writeText(text);

// ====== Util horario ======
export const toInputValue = (d: Date) => {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
};

export const fromLocalInputToISO = (val: string) => new Date(val).toISOString();

export const defaultStart = () => {
  const now = new Date();
  const m = now.getMinutes();
  const add = [0, 15, 30, 45].find((x) => x > m) ?? 60;
  now.setMinutes(add, 0, 0);
  return now;
};

export const defaultEndFrom = (start: Date, hours = 4) =>
  new Date(start.getTime() + hours * 3600_000);
