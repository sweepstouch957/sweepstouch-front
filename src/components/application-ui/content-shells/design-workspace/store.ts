'use client';

/**
 * Estado del módulo Workspace › Diseño.
 *
 * Fase 1: zustand + localStorage. Todas las transiciones de estado y sus
 * efectos (timestamps, cronómetro, causas, contadores) viven acá y no en los
 * componentes, así en fase 2 se reemplaza el store por llamadas a la API sin
 * reescribir la UI.
 *
 * El store NO conoce el origen de las tiendas ni de los empleados: quien llama
 * le pasa nombre y dirección ya resueltos. Eso permite que el selector use el
 * listado real de la plataforma sin que este archivo dependa de la red.
 */
import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEY } from './constants';
import { ADMINS, DEFAULT_CIRCULAR_CONFIG, DEFAULT_DESIGNERS, buildMockCards } from './mock-data';
import type {
  AuditIssue,
  CardStatus,
  CardTag,
  CardType,
  CircularConfig,
  CircularGroup,
  DesignCard,
  DesignStore,
  DesignUser,
  ErrorCause,
  WeekDay,
} from './types';

export const uid = (): string => Math.random().toString(36).slice(2, 10);

const nowIso = (): string => new Date().toISOString();

/* ── Campos derivados ──────────────────────────────────────────────────── */

/**
 * La cantidad de shelfsigns no se escribe a mano: es la cantidad de productos
 * cuando la tarjeta lleva la etiqueta, y cero cuando no.
 */
function syncDerived(card: DesignCard): DesignCard {
  const shelfsignsCount = card.tags.includes('shelfsigns') ? card.productCount : 0;
  return shelfsignsCount === card.shelfsignsCount ? card : { ...card, shelfsignsCount };
}

/* ── Entradas ──────────────────────────────────────────────────────────── */

export interface CreateCardInput {
  type: CardType;
  /** Tienda ya resuelta contra el listado real de la plataforma. */
  storeId: string;
  storeName: string;
  address: string;
  promoStart: string;
  promoEnd: string;
  designerId: string | null;
  productCount: number;
  tags: CardTag[];
  productList: string;
  brief: string;
  requesterId?: string | null;
  requesterName?: string | null;
}

export interface DuplicateOptions {
  /** `true` = "Duplicar como Duplicado": deja marca y vínculo al original. */
  marked: boolean;
  storeId?: string;
  storeName?: string;
  address?: string;
  promoStart?: string;
  promoEnd?: string;
}

interface DesignState {
  cards: DesignCard[];
  circular: CircularConfig;
  /** Equipo de diseño, editable desde Configuración › Diseñadores. */
  designers: DesignUser[];
  /** Persona simulada: cambia qué botones y vistas se muestran. */
  currentUserId: string;

  /* Sesión */
  setCurrentUser: (userId: string) => void;

  /* Equipo */
  addDesigner: (name: string) => void;
  removeDesigner: (id: string) => void;

  /* CRUD */
  createCard: (input: CreateCardInput) => string;
  updateCard: (id: string, patch: Partial<DesignCard>) => void;
  deleteCard: (id: string) => void;
  duplicateCard: (id: string, options: DuplicateOptions) => string | null;

  /* Transiciones */
  assignDesigner: (id: string, designerId: string | null) => void;
  createFolder: (id: string) => void;
  startDesign: (id: string) => void;
  sendToAudit: (id: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  approveAudit: (id: string) => void;
  sendToErrors: (id: string, cause: ErrorCause) => void;
  approve: (id: string) => void;
  simulateScheduled: (id: string) => void;
  /** Movimiento manual de un admin (drag & drop): aplica los efectos del estado destino. */
  moveTo: (id: string, status: CardStatus) => void;

  /* Auditoría */
  addAuditIssue: (cardId: string, description: string, author: DesignUser) => void;
  removeAuditIssue: (cardId: string, issueId: string) => void;

  /* Automatización */
  setCircular: (patch: Partial<CircularConfig>) => void;
  upsertGroup: (group: CircularGroup) => void;
  removeGroup: (groupId: string) => void;
  /** Recibe las tiendas reales ya cargadas para resolver nombre y dirección. */
  runCircularWeek: (stores: DesignStore[]) => number;

  /* Demo */
  resetMock: () => void;
}

const patchCard = (
  cards: DesignCard[],
  id: string,
  fn: (card: DesignCard) => DesignCard
): DesignCard[] => cards.map((c) => (c.id === id ? syncDerived(fn(c)) : c));

/** Cierra el tramo abierto de On Hold, si lo hay. */
const closeHold = (card: DesignCard): DesignCard['holdPeriods'] =>
  card.holdPeriods.map((p) => (p.end === null ? { ...p, end: nowIso() } : p));

/** Cierra el tramo abierto de Errores/Updates, si lo hay. */
const closeError = (card: DesignCard): DesignCard['errorPeriods'] =>
  card.errorPeriods.map((p) => (p.end === null ? { ...p, end: nowIso() } : p));

const emptyCard = (): Omit<DesignCard, 'id' | 'type' | 'storeId' | 'storeName' | 'address'> => ({
  status: 'nuevo_requerimiento',
  promoStart: '',
  promoEnd: '',
  designerId: null,
  designerName: null,
  productCount: 0,
  tags: [],
  productList: '',
  attachments: [],
  brief: '',
  briefImages: [],
  requesterId: null,
  requesterName: null,
  shelfsignsCount: 0,
  tabletVersions: 0,
  folderUrl: null,
  isDuplicate: false,
  duplicatedFromId: null,
  auditIssues: [],
  auditRound: 1,
  errorPeriods: [],
  holdPeriods: [],
  timestamps: {
    createdAt: nowIso(),
    assignedAt: null,
    designStartedAt: null,
    sentToAuditAt: null,
    approvedAt: null,
    scheduledAt: null,
  },
  autoGenerated: false,
});

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      cards: buildMockCards(),
      circular: DEFAULT_CIRCULAR_CONFIG,
      designers: DEFAULT_DESIGNERS,
      currentUserId: ADMINS[0].id,

      setCurrentUser: (currentUserId) => set({ currentUserId }),

      /* ── Equipo de diseño ──────────────────────────────────────────── */

      addDesigner: (name) => {
        const clean = name.trim();
        if (!clean) return;
        set({
          designers: [...get().designers, { id: `d-${uid()}`, name: clean, role: 'designer' }],
        });
      },

      /** Quitar del equipo no toca las tarjetas ya asignadas: su historial y sus
       *  métricas siguen siendo válidos. */
      removeDesigner: (id) => set({ designers: get().designers.filter((d) => d.id !== id) }),

      /* ── CRUD ──────────────────────────────────────────────────────── */

      createCard: (input) => {
        const designer = get().designers.find((d) => d.id === input.designerId);
        const id = uid();
        const card: DesignCard = syncDerived({
          ...emptyCard(),
          id,
          type: input.type,
          storeId: input.storeId,
          storeName: input.storeName,
          address: input.address,
          promoStart: input.promoStart,
          promoEnd: input.promoEnd,
          designerId: designer?.id ?? null,
          designerName: designer?.name ?? null,
          productCount: input.productCount,
          tags: input.tags,
          productList: input.productList,
          brief: input.brief,
          requesterId: input.requesterId ?? null,
          requesterName: input.requesterName ?? null,
          timestamps: {
            ...emptyCard().timestamps,
            assignedAt: designer ? nowIso() : null,
          },
        });
        set({ cards: [card, ...get().cards] });
        return id;
      },

      updateCard: (id, patch) =>
        set({ cards: patchCard(get().cards, id, (c) => ({ ...c, ...patch })) }),

      deleteCard: (id) => set({ cards: get().cards.filter((c) => c.id !== id) }),

      /**
       * Dos acciones distintas:
       *  - marked: copia marcada, con vínculo al original y dirección/fechas nuevas
       *  - simple: copia literal, sin marca ni vínculo
       * En ambos casos la copia arranca de cero: sin tiempos, auditoría ni carpeta.
       */
      duplicateCard: (id, options) => {
        const source = get().cards.find((c) => c.id === id);
        if (!source) return null;

        const newId = uid();
        const copy: DesignCard = syncDerived({
          ...source,
          id: newId,
          status: 'nuevo_requerimiento',
          storeId: options.storeId ?? source.storeId,
          storeName: options.storeName ?? source.storeName,
          address: options.address ?? source.address,
          promoStart: options.promoStart ?? source.promoStart,
          promoEnd: options.promoEnd ?? source.promoEnd,
          isDuplicate: options.marked,
          duplicatedFromId: options.marked ? source.id : null,
          folderUrl: null,
          tabletVersions: 0,
          auditIssues: [],
          auditRound: 1,
          errorPeriods: [],
          holdPeriods: [],
          timestamps: {
            createdAt: nowIso(),
            assignedAt: source.designerId ? nowIso() : null,
            designStartedAt: null,
            sentToAuditAt: null,
            approvedAt: null,
            scheduledAt: null,
          },
          autoGenerated: false,
        });

        set({ cards: [copy, ...get().cards] });
        return newId;
      },

      /* ── Transiciones ──────────────────────────────────────────────── */

      assignDesigner: (id, designerId) => {
        const designer = get().designers.find((d) => d.id === designerId);
        set({
          cards: patchCard(get().cards, id, (c) => ({
            ...c,
            designerId: designer?.id ?? null,
            designerName: designer?.name ?? null,
            timestamps: {
              ...c.timestamps,
              // El tiempo de toma no se mide, pero el evento sí se registra.
              assignedAt: designer ? (c.timestamps.assignedAt ?? nowIso()) : null,
            },
          })),
        });
      },

      /** Fase 2: crea la estructura real en Drive. Fase 1: simulado. */
      createFolder: (id) =>
        set({
          cards: patchCard(get().cards, id, (c) => ({
            ...c,
            folderUrl:
              c.folderUrl ?? `https://drive.google.com/drive/folders/mock-${c.id}`,
          })),
        }),

      /** Productos definidos → Diseñándose. Arranca el cronómetro. */
      startDesign: (id) =>
        set({
          cards: patchCard(get().cards, id, (c) => ({
            ...c,
            status: 'disenandose',
            holdPeriods: closeHold(c),
            timestamps: {
              ...c.timestamps,
              designStartedAt: c.timestamps.designStartedAt ?? nowIso(),
            },
          })),
        }),

      /** Única salida de Diseñándose. Detiene el cronómetro. */
      sendToAudit: (id) =>
        set({
          cards: patchCard(get().cards, id, (c) => ({
            ...c,
            status: 'auditoria',
            holdPeriods: closeHold(c),
            errorPeriods: closeError(c),
            // Volver de Errores/Updates abre ronda nueva pero NO reabre el
            // cronómetro: el tiempo medido es uno solo.
            auditRound: c.status === 'errores_updates' ? c.auditRound + 1 : c.auditRound,
            timestamps: {
              ...c.timestamps,
              sentToAuditAt: c.timestamps.sentToAuditAt ?? nowIso(),
            },
          })),
        }),

      /** Sólo admins. Congela el cronómetro. */
      pause: (id) =>
        set({
          cards: patchCard(get().cards, id, (c) =>
            c.holdPeriods.some((p) => p.end === null)
              ? { ...c, status: 'on_hold' }
              : {
                  ...c,
                  status: 'on_hold',
                  holdPeriods: [...c.holdPeriods, { start: nowIso(), end: null }],
                }
          ),
        }),

      /** Vuelve a Diseñándose y reanuda el cronómetro. */
      resume: (id) =>
        set({
          cards: patchCard(get().cards, id, (c) => ({
            ...c,
            status: 'disenandose',
            holdPeriods: closeHold(c),
          })),
        }),

      /** Auditoría sin errores → Esperando aprobación. */
      approveAudit: (id) =>
        set({
          cards: patchCard(get().cards, id, (c) => ({
            ...c,
            status: 'esperando_aprobacion',
            holdPeriods: closeHold(c),
            errorPeriods: closeError(c),
          })),
        }),

      /**
       * Entrada a Errores/Updates. La causa es obligatoria y queda registrada:
       * "Error del diseñador" viene de Auditoría y suma a la métrica de calidad;
       * "Update del cliente" viene de Esperando aprobación y no la afecta.
       */
      sendToErrors: (id, cause) =>
        set({
          cards: patchCard(get().cards, id, (c) => ({
            ...c,
            status: 'errores_updates',
            holdPeriods: closeHold(c),
            errorPeriods: [...closeError(c), { cause, start: nowIso(), end: null }],
          })),
        }),

      approve: (id) =>
        set({
          cards: patchCard(get().cards, id, (c) => ({
            ...c,
            status: 'finalizado',
            holdPeriods: closeHold(c),
            errorPeriods: closeError(c),
            timestamps: { ...c.timestamps, approvedAt: c.timestamps.approvedAt ?? nowIso() },
          })),
        }),

      /** Fase 2: lo dispara la detección de agendado del módulo de campañas. */
      simulateScheduled: (id) =>
        set({
          cards: patchCard(get().cards, id, (c) => ({
            ...c,
            status: 'agendado',
            timestamps: { ...c.timestamps, scheduledAt: c.timestamps.scheduledAt ?? nowIso() },
          })),
        }),

      /**
       * Movimiento manual de un admin. Reusa las mismas acciones que los
       * botones para que arrastrar y apretar el botón dejen exactamente los
       * mismos timestamps. Errores/Updates no entra acá: exige causa y la pide
       * la UI antes de llamar a `sendToErrors`.
       */
      moveTo: (id, status) => {
        const actions = get();
        switch (status) {
          case 'disenandose':
            return actions.startDesign(id);
          case 'on_hold':
            return actions.pause(id);
          case 'auditoria':
            return actions.sendToAudit(id);
          case 'esperando_aprobacion':
            return actions.approveAudit(id);
          case 'finalizado':
            return actions.approve(id);
          case 'agendado':
            return actions.simulateScheduled(id);
          default:
            // Nuevo requerimiento y Productos definidos no tienen efectos.
            return set({
              cards: patchCard(actions.cards, id, (c) => ({
                ...c,
                status,
                holdPeriods: closeHold(c),
              })),
            });
        }
      },

      /* ── Auditoría ─────────────────────────────────────────────────── */

      addAuditIssue: (cardId, description, author) =>
        set({
          cards: patchCard(get().cards, cardId, (c) => {
            const issue: AuditIssue = {
              id: uid(),
              description,
              authorId: author.id,
              authorName: author.name,
              area: author.area ?? 'diseño',
              createdAt: nowIso(),
              round: c.auditRound,
            };
            return { ...c, auditIssues: [...c.auditIssues, issue] };
          }),
        }),

      removeAuditIssue: (cardId, issueId) =>
        set({
          cards: patchCard(get().cards, cardId, (c) => ({
            ...c,
            auditIssues: c.auditIssues.filter((i) => i.id !== issueId),
          })),
        }),

      /* ── Automatización de Modalidad circular ──────────────────────── */

      setCircular: (patch) => set({ circular: { ...get().circular, ...patch } }),

      upsertGroup: (group) => {
        const groups = get().circular.groups;
        const exists = groups.some((g) => g.id === group.id);
        set({
          circular: {
            ...get().circular,
            groups: exists
              ? groups.map((g) => (g.id === group.id ? group : g))
              : [...groups, group],
          },
        });
      },

      removeGroup: (groupId) =>
        set({
          circular: {
            ...get().circular,
            groups: get().circular.groups.filter((g) => g.id !== groupId),
          },
        }),

      /**
       * Simula la corrida semanal: una tarjeta MMS · Modalidad circular por
       * tienda configurada, en "Nuevo requerimiento" como cualquier alta nueva.
       */
      runCircularWeek: (stores) => {
        const { circular, cards } = get();
        const storeIds = Array.from(new Set(circular.groups.flatMap((g) => g.storeIds)));
        if (!storeIds.length) return 0;

        const start = new Date().toISOString().slice(0, 10);
        const end = new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10);

        const created = storeIds
          .map((storeId) => stores.find((s) => s.id === storeId))
          .filter((s): s is DesignStore => !!s)
          .map((store) =>
            syncDerived({
              ...emptyCard(),
              id: uid(),
              type: 'mms_circular',
              storeId: store.id,
              storeName: store.name,
              address: store.address,
              promoStart: start,
              promoEnd: end,
              autoGenerated: true,
            } as DesignCard)
          );

        if (!created.length) return 0;
        set({ cards: [...created, ...cards], circular: { ...circular, lastRunAt: nowIso() } });
        return created.length;
      },

      resetMock: () =>
        set({
          cards: buildMockCards(),
          circular: DEFAULT_CIRCULAR_CONFIG,
          designers: DEFAULT_DESIGNERS,
          currentUserId: ADMINS[0].id,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }
          : window.localStorage
      ),
    }
  )
);

/* ── Selectores ────────────────────────────────────────────────────────── */

/** Todas las personas del switcher: 2 admins + el equipo de diseño configurado. */
export const useDesignPeople = (): DesignUser[] => {
  const designers = useDesignStore((s) => s.designers);
  return React.useMemo(() => [...ADMINS, ...designers], [designers]);
};

export const useCurrentUser = (): DesignUser => {
  const id = useDesignStore((s) => s.currentUserId);
  const designers = useDesignStore((s) => s.designers);
  return [...ADMINS, ...designers].find((u) => u.id === id) ?? ADMINS[0];
};

/** Día configurado para una tienda: el de su grupo, o el global. */
export function dayForStore(circular: CircularConfig, storeId: string): WeekDay {
  const group = circular.groups.find((g) => g.storeIds.includes(storeId));
  return group?.day ?? circular.defaultDay;
}
