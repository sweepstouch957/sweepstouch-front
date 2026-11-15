/** Sólo importa en qué rango cae el ancho: 420 = teléfono, 900 = angosto, 1000 = tabla normal. */
export const widthBucket = (w: number) => (w <= 420 ? 420 : w <= 700 ? 700 : w <= 900 ? 900 : 1000);

/** "1 regular" / "3 regulares". */
export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
