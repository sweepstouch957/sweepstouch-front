/**
 * Qué puede hacer cada rol sobre una tarjeta.
 *
 * Sólo hay dos roles: `admin` (Pedro y María) es la unión de todos los permisos
 * —coordina, audita y puede usar también los botones del diseñador—, y
 * `designer`, que sólo opera sobre sus propias tarjetas y con sus botones.
 *
 * Centralizado a propósito: son reglas de negocio, no de UI, y si cada
 * componente decide por su cuenta terminan divergiendo. En fase 2 esto se
 * contrasta contra los permisos reales del usuario.
 */
import type { DesignCard, DesignUser } from './types';

export interface CardActions {
  /** Pasa de Nuevo requerimiento a Productos definidos. */
  defineProducts: boolean;
  createFolder: boolean;
  startDesign: boolean;
  sendToAudit: boolean;
  pause: boolean;
  resume: boolean;
  approveAudit: boolean;
  returnWithErrors: boolean;
  registerUpdate: boolean;
  approve: boolean;
  simulateScheduled: boolean;
  duplicate: boolean;
  /** Lista de productos: sólo los admins la editan; el diseñador la ve. */
  editProductList: boolean;
  editFields: boolean;
  /** Registrar errores en el checklist de auditoría. */
  auditIssues: boolean;
  /** Arrastrar tarjetas entre columnas. */
  drag: boolean;
}

/** Sin estos campos no se puede crear la carpeta de Drive. */
export const isReadyForFolder = (card: DesignCard): boolean =>
  !!card.storeId && !!card.designerId && (card.type === 'especial' || (!!card.promoStart && !!card.promoEnd));

/** Un especial sin brief ni solicitante no está listo para trabajarse. */
export const isReadyToDefine = (card: DesignCard): boolean => {
  if (!isReadyForFolder(card)) return false;
  if (card.type === 'especial') return card.brief.trim().length > 0 && !!card.requesterId;
  return card.productCount > 0;
};

export function cardActions(card: DesignCard, user: DesignUser): CardActions {
  const admin = user.role === 'admin';
  // El diseñador sólo opera sobre lo suyo. El admin puede todo, también esto.
  const canDesign = admin || (user.role === 'designer' && card.designerId === user.id);

  const paused = card.holdPeriods.some((p) => p.end === null);

  return {
    defineProducts: admin && card.status === 'nuevo_requerimiento' && isReadyToDefine(card),

    createFolder: canDesign && !card.folderUrl && isReadyForFolder(card),

    startDesign: canDesign && card.status === 'productos_definidos',

    // Única salida de Diseñándose; también es la vuelta desde Errores/Updates
    // una vez corregido, para no reabrir un segundo cronómetro.
    sendToAudit: canDesign && (card.status === 'disenandose' || card.status === 'errores_updates'),

    // On Hold es exclusivo de los admins: el diseñador no puede pausarse solo.
    pause: admin && card.status === 'disenandose' && !paused,
    resume: admin && card.status === 'on_hold',

    approveAudit: admin && card.status === 'auditoria',
    returnWithErrors: admin && card.status === 'auditoria',

    registerUpdate: admin && card.status === 'esperando_aprobacion',
    approve: admin && card.status === 'esperando_aprobacion',
    simulateScheduled: admin && card.status === 'finalizado',

    duplicate: admin,
    editProductList: admin,
    editFields: admin,
    auditIssues: admin && (card.status === 'auditoria' || card.status === 'errores_updates'),
    drag: admin,
  };
}

/** Tarjetas que le corresponden a quien está mirando. */
export function visibleCards(cards: DesignCard[], user: DesignUser): DesignCard[] {
  if (user.role === 'designer') return cards.filter((c) => c.designerId === user.id);
  return cards;
}
