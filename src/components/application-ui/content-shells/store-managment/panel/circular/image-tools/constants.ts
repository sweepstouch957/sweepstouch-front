import type { Theme } from '@mui/material/styles';

/** Caja de recorte en % (0–100) de la imagen del circular/flyer. */
export type PctBox = { x: number; y: number; w: number; h: number };

/** De qué imagen se recorta en el editor: el circular vigente o el flyer de la campaña. */
export type CropSource = false | 'circular' | 'campaign';

export const CLEANING = 'Limpiando con IA: solo el producto, sin precio ni fondo (30 a 60 s)…';

/** Valores del formulario del editor de producto (todo string salvo el switch). */
export type ProductFormValues = {
  name: string;
  // Marca y tamaño tal como los imprime el flyer. La IA a veces lee "US #1 GREEN GIANT"
  // como marca (es el grado): acá se corrige.
  brand: string;
  size: string;
  category: string;
  department: string;
  saleUnit: string;
  barcode: string;
  price: string;
  regular: string;
  // Letra chica del flyer. La IA la lee, pero acá se corrige: es lo que evita el reclamo
  // en la caja ("15 LB BOX ONLY", "AT THE COUNTER", "LIMIT 1 PER FAMILY").
  condition: string;
  packQty: string;
  packUnit: string;
  counterOnly: boolean;
  maxPerCustomer: string;
  // Otros nombres con que la IA lee este producto (coma-separados en el campo).
  aliases: string;
  // Producto que todavía no sale: día en que entra el precio pendiente.
  pendingDay: string;
  // Indicaciones para la IA: valen para quitar fondo, generar, recortar del circular y pegar.
  aiPrompt: string;
};

/**
 * Cuadriculado de transparencia: si la imagen de verdad no tiene fondo se ven los cuadros
 * detrás del producto. Va claro también en modo oscuro (es la convención de los editores
 * de imagen), pero los tonos salen del tema.
 */
export const checkerSx = (t: Theme) => {
  const sq = t.palette.grey[200];
  return {
    backgroundColor: t.palette.common.white,
    backgroundImage: `linear-gradient(45deg,${sq} 25%,transparent 25%),linear-gradient(-45deg,${sq} 25%,transparent 25%),linear-gradient(45deg,transparent 75%,${sq} 75%),linear-gradient(-45deg,transparent 75%,${sq} 75%)`,
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
  };
};
