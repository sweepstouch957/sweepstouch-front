/* ────────────── Customer type (minimal) ────────────── */
export interface CustomerHit {
  _id: string;
  firstName: string;
  lastName?: string;
  phoneNumber: string;
  active?: boolean;
}
