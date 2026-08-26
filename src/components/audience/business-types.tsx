'use client';

/**
 * Rubro del negocio: etiqueta e icono.
 *
 * El panel arrancó asumiendo que todos los clientes eran súperes. No lo son:
 * hay restaurantes, gimnasios, farmacias y licorerías, y el cruce por zona
 * funciona igual para todos. El dato viene del backend
 * (`@sweepstouch/mongoose-kit/business-types`), que lo lee del campo
 * `businessType` o lo infiere del nombre cuando nunca se cargó.
 *
 * Este archivo es sólo la capa de presentación: si allá se agrega un rubro,
 * acá se agrega su etiqueta y su icono. `BusinessType` es un union type, así
 * que el `Record` no compila hasta que estén los dos.
 */
import type { BusinessType } from '@/services/campaing.service';
import type { SvgIconComponent } from '@mui/icons-material';
import BakeryDiningRoundedIcon from '@mui/icons-material/BakeryDiningRounded';
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import LiquorRoundedIcon from '@mui/icons-material/LiquorRounded';
import LocalConvenienceStoreRoundedIcon from '@mui/icons-material/LocalConvenienceStoreRounded';
import LocalGroceryStoreRoundedIcon from '@mui/icons-material/LocalGroceryStoreRounded';
import LocalPharmacyRoundedIcon from '@mui/icons-material/LocalPharmacyRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import React from 'react';

type BusinessTypeMeta = { label: string; Icon: SvgIconComponent };

export const BUSINESS_TYPE_META: Record<BusinessType, BusinessTypeMeta> = {
  supermarket: { label: 'Supermercado', Icon: LocalGroceryStoreRoundedIcon },
  restaurant: { label: 'Restaurante', Icon: RestaurantRoundedIcon },
  gym: { label: 'Gimnasio', Icon: FitnessCenterRoundedIcon },
  pharmacy: { label: 'Farmacia', Icon: LocalPharmacyRoundedIcon },
  bakery: { label: 'Panadería', Icon: BakeryDiningRoundedIcon },
  liquor: { label: 'Licorería', Icon: LiquorRoundedIcon },
  convenience: { label: 'Conveniencia', Icon: LocalConvenienceStoreRoundedIcon },
  beauty: { label: 'Belleza', Icon: ContentCutRoundedIcon },
  retail: { label: 'Comercio', Icon: StorefrontRoundedIcon },
  other: { label: 'Otro', Icon: StoreRoundedIcon },
  unknown: { label: 'Sin clasificar', Icon: HelpOutlineRoundedIcon },
};

/** Tolera un rubro que el backend agregue antes que el front. */
export function businessTypeMeta(type?: string | null): BusinessTypeMeta {
  return BUSINESS_TYPE_META[(type ?? 'unknown') as BusinessType] ?? BUSINESS_TYPE_META.unknown;
}

export function BusinessTypeIcon({
  type,
  fontSize = 15,
  ...rest
}: {
  type?: string | null;
  fontSize?: number;
  titleAccess?: string;
}) {
  const { Icon, label } = businessTypeMeta(type);
  return (
    <Icon
      sx={{ fontSize, color: 'text.disabled', flexShrink: 0 }}
      titleAccess={rest.titleAccess ?? label}
    />
  );
}
