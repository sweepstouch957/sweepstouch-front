/** Use persisted positions unless an optimistic drag order is being displayed. */
export function applyCatalogOrder<T extends { _id: string; position?: number }>(items: T[], order: string[]): T[] {
  const positions = new Map(order.map((id, index) => [id, index]));
  const rank = (item: T) => order.length
    ? positions.get(item._id) ?? Infinity
    : typeof item.position === 'number' && Number.isFinite(item.position) ? item.position : Infinity;
  return [...items].sort(
    (a, b) => rank(a) - rank(b)
  );
}

/** Reorder only the visible slots, preserving the positions of filtered-out products. */
export function moveCatalogItem(
  allIds: string[],
  visibleIds: string[],
  source: number,
  destination: number
): string[] {
  if (source === destination || source < 0 || destination < 0 ||
      source >= visibleIds.length || destination >= visibleIds.length) return allIds;
  const reordered = [...visibleIds];
  const [moved] = reordered.splice(source, 1);
  reordered.splice(destination, 0, moved);
  const visible = new Set(visibleIds);
  let index = 0;
  return allIds.map((id) => visible.has(id) ? reordered[index++] : id);
}
