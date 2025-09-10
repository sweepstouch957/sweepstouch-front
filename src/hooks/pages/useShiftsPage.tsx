// ================================================
// hooks/useShiftsTable.ts
// ================================================
"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, startOfDay, format } from "date-fns";
import * as XLSX from "xlsx";
import { shiftService } from "@/services/shift.service";

// ===== Types shared with the table =====
export interface Sweepstake {
  id: string;
  name: string;
}
export type ShiftRow = {
  _id: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: string;
  totalParticipations?: number;
  newParticipations?: number;
  existingParticipations?: number;
  totalEarnings?: number;
  storeInfo?: {
    name?: string;
    address?: string;
    zipCode?: string;
    image?: string;
    customerCount?: number;
  };
  requestedBy?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
  };
  promoterInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  promoterId?: string;
  supermarketName?: string;
};

export type DateRangeValue = { startDate: Date | null; endDate: Date | null };
export const STATUS_OPTIONS = ["available", "assigned", "active", "completed"] as const;
export type StatusFilter = "all" | (typeof STATUS_OPTIONS)[number];

export type UseShiftsTableOptions = {
  defaultRowsPerPage?: number;
  pageSizeOptions?: number[];
};

export type UseShiftsTableResult = {
  // data
  shifts: ShiftRow[];
  pagination: { page: number; pages: number; total: number };
  totalToPay: number;
  isLoading: boolean;
  isFetching: boolean;

  // filters
  status: StatusFilter;
  setStatus: (s: StatusFilter) => void;
  dateRange: DateRangeValue;
  setDateRange: (r: DateRangeValue) => void;

  // paging
  page: number;
  setPage: (n: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (n: number) => void;
  pageSizeOptions: number[];

  // UI state (modals)
  selectedShiftId: string | null;
  openPreview: (id: string) => void;
  openEdit: (id: string) => void;
  openDelete: (id: string) => void;
  closeAllModals: () => void;
  previewModalOpen: boolean;
  editModalOpen: boolean;
  deleteModalOpen: boolean;

  // helpers
  usd: Intl.NumberFormat;
  buildExcelAndDownload: (rows?: ShiftRow[]) => void;
  formatRange: (value: DateRangeValue) => string;
};

const fmt2 = (n: number) => (Number.isFinite(n) ? Number(n.toFixed(2)) : 0);
const safeNum = (n: any) => (typeof n === "number" && isFinite(n) ? n : 0);
const getHours = (s?: string, e?: string) => {
  if (!s || !e) return 4;
  const diff = new Date(e).getTime() - new Date(s).getTime();
  if (!isFinite(diff) || diff <= 0) return 4;
  return fmt2(diff / 36e5);
};
const getPromoterName = (row: ShiftRow) => {
  const r = row.requestedBy || {};
  const p = row.promoterInfo || {};
  const name = [r.firstName ?? p.firstName ?? "", r.lastName ?? p.lastName ?? ""]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return name || "Sin asignar";
};
const getPromoterEmail = (row: ShiftRow) => row.requestedBy?.email || row.promoterInfo?.email || "";
const autoFit = (data: any[]) => {
  const cols = Object.keys(data[0] ?? {}).map(() => ({ wch: 10 }));
  data.forEach((row) => {
    Object.values(row).forEach((val: any, i) => {
      const len = val == null ? 0 : String(val).length;
      cols[i].wch = Math.max(cols[i].wch, Math.min(60, len + 2));
    });
  });
  return cols;
};

export function useShiftsTable(options: UseShiftsTableOptions = {}): UseShiftsTableResult {
  const pageSizeOptions = options.pageSizeOptions ?? [10, 12, 20, 30, 50];
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(options.defaultRowsPerPage ?? 12);
  const [dateRange, setDateRange] = useState<DateRangeValue>({ startDate: null, endDate: null });

  // derived dates
  const startISO = useMemo(
    () => (dateRange.startDate ? startOfDay(dateRange.startDate).toISOString() : undefined),
    [dateRange.startDate]
  );
  const endISO = useMemo(
    () => (dateRange.endDate ? endOfDay(dateRange.endDate).toISOString() : undefined),
    [dateRange.endDate]
  );

  // fetch
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["shifts", page, rowsPerPage, startISO, endISO, status],
    queryFn: () =>
      shiftService.getAllShifts({
        page,
        limit: rowsPerPage,
        startTime: startISO,
        endTime: endISO,
        status: status === "all" ? undefined : status,
      }),
  });

  const shifts: ShiftRow[] = data?.shifts || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };
  const totalToPay = Number(data?.totals?.totalToPayUsd ?? 0);

  // currency
  const usd = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    []
  );

  // modals
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const openPreview = (id: string) => {
    setSelectedShiftId(id);
    setPreviewModalOpen(true);
  };
  const openEdit = (id: string) => {
    setSelectedShiftId(id);
    setEditModalOpen(true);
  };
  const openDelete = (id: string) => {
    setSelectedShiftId(id);
    setDeleteModalOpen(true);
  };
  const closeAllModals = () => {
    setSelectedShiftId(null);
    setPreviewModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
  };

  // helpers
  const formatRange = (value: DateRangeValue) => {
    const { startDate, endDate } = value;
    if (!startDate && !endDate) return "";
    if (startDate && !endDate) return `${format(startDate, "MM/dd/yyyy")} –`;
    if (!startDate && endDate) return `– ${format(endDate, "MM/dd/yyyy")}`;
    return `${format(startDate!, "MM/dd/yyyy")} – ${format(endDate!, "MM/dd/yyyy")}`;
  };

  const buildExcelAndDownload = (rows: ShiftRow[] = shifts) => {
    const groups = new Map<
      string,
      {
        name: string;
        email: string;
        rows: ShiftRow[];
        totals: {
          shifts: number;
          hours: number;
          earnings: number;
          totalNums: number;
          newNums: number;
          existingNums: number;
        };
      }
    >();

    rows.forEach((row) => {
      const name = getPromoterName(row);
      const email = getPromoterEmail(row);
      const hours = getHours(row.startTime, row.endTime);
      const earn = safeNum(row.totalEarnings);
      const tot = safeNum(row.totalParticipations);
      const neu = safeNum(row.newParticipations);
      const exi = safeNum(row.existingParticipations);
      if (!groups.has(name)) {
        groups.set(name, {
          name,
          email,
          rows: [],
          totals: { shifts: 0, hours: 0, earnings: 0, totalNums: 0, newNums: 0, existingNums: 0 },
        });
      }
      const g = groups.get(name)!;
      g.rows.push(row);
      g.totals.shifts += 1;
      g.totals.hours += hours;
      g.totals.earnings += earn;
      g.totals.totalNums += tot;
      g.totals.newNums += neu;
      g.totals.existingNums += exi;
    });

    const resumenRows = Array.from(groups.values()).map((g) => ({
      Promotora: g.name,
      Email: g.email,
      Turnos: g.totals.shifts,
      "Horas totales": fmt2(g.totals.hours),
      "Ganancias totales ($)": fmt2(g.totals.earnings),
      "Números totales": g.totals.totalNums,
      "Números nuevos": g.totals.newNums,
      "Números existentes": g.totals.existingNums,
    }));

    const detalleRows = Array.from(groups.values())
      .flatMap((g) =>
        g.rows.map((r) => {
          const hours = getHours(r.startTime, r.endTime);
          return {
            Promotora: g.name,
            Email: g.email,
            Fecha: r.date ? new Date(r.date).toLocaleDateString() : "",
            Inicio: r.startTime ? new Date(r.startTime).toLocaleTimeString() : "",
            Fin: r.endTime ? new Date(r.endTime).toLocaleTimeString() : "",
            "Horas (turno)": hours,
            Tienda: r.storeInfo?.name ?? "",
            Dirección: r.storeInfo?.address ?? "",
            ZIP: r.storeInfo?.zipCode ?? "",
            Estado: r.status ?? "",
            "Números totales": safeNum(r.totalParticipations),
            "Números nuevos": safeNum(r.newParticipations),
            "Números existentes": safeNum(r.existingParticipations),
            "Ganancia turno ($)": fmt2(safeNum(r.totalEarnings)),
          };
        })
      )
      .sort((a, b) =>
        a.Promotora === b.Promotora
          ? new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime()
          : a.Promotora.localeCompare(b.Promotora)
      );

    const wb = XLSX.utils.book_new();
    const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
    const wsDetalle = XLSX.utils.json_to_sheet(detalleRows);
    if (resumenRows.length) wsResumen["!cols"] = autoFit(resumenRows);
    if (detalleRows.length) wsDetalle["!cols"] = autoFit(detalleRows);
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen por promotora");
    XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle por turno");
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `turnos_${today}.xlsx`);
  };

  return {
    // data
    shifts,
    pagination,
    totalToPay,
    isLoading,
    isFetching,

    // filters
    status,
    setStatus: (s) => {
      setStatus(s);
      setPage(1);
    },
    dateRange,
    setDateRange: (r) => {
      setDateRange(r);
      setPage(1);
    },

    // paging
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage: (n) => {
      setRowsPerPage(n);
      setPage(1);
    },
    pageSizeOptions,

    // modals
    selectedShiftId,
    openPreview,
    openEdit,
    openDelete,
    closeAllModals,
    previewModalOpen,
    editModalOpen,
    deleteModalOpen,

    // helpers
    usd,
    buildExcelAndDownload,
    formatRange,
  };
}
