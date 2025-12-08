'use client';

import { Box } from '@mui/material';
import React, { useState } from 'react';
import {
    circularService,
    inferStoreSlugFromFilename,
    inferTitleFromFilename,
    type Circular,
} from '@services/circular.service';

import { ScheduleCircularsHeader } from './Header';
import { CircularsUploaderCard } from './UploaderCard';
import { CircularsTable } from './Table';
import { InstructionsModal } from './InstructionsModal';
import { CircularsSnackbar } from './Snackbar';
import { Row, SnackState } from '../types/ScheduleCirculars';
import { getStoreBySlug } from '@/services/store.service';

const MAX_MB = 10;

export function ScheduleCirculars() {
    const [showInstructions, setShowInstructions] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);
    const [snack, setSnack] = useState<SnackState>({
        open: false,
        msg: '',
        sev: 'success',
    });

    const instructionsContent = [
        'Sube PDFs con el drag & drop (máximo 10MB por archivo).',
        'El nombre del archivo DEBE incluir el slug de la tienda (ej: new-rochelle.pdf).',
        'Configura fecha de inicio y fin por cada fila.',
        'Puedes Guardar por fila o usar Guardar Todo.',
        'Si no adjuntas archivo, puedes agendar solo con fechas y slug (adjunta luego).',
    ];

    const prettySize = (bytes: number) =>
        bytes < 1024 * 1024
            ? `${Math.round(bytes / 1024)} KB`
            : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    const setRow = (id: string, patch: Partial<Row>) =>
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    const removeRow = (id: string) =>
        setRows((prev) => prev.filter((r) => r.id !== id));

    // 🔎 buscar tienda por slug
    const loadStoreForRow = async (rowId: string, slug: string) => {
        const normalized = slug.trim().toLowerCase();
        if (!normalized) {
            setRow(rowId, {
                storeInfo: null,
                storeError: null,
                storeLoading: false,
                storeSlug: '',
            });
            return;
        }

        setRow(rowId, { storeLoading: true, storeError: null, storeInfo: null });

        try {
            const store = await getStoreBySlug(normalized);
            setRow(rowId, {
                storeInfo: store,
                storeLoading: false,
                storeError: null,
                storeSlug: normalized,
            });
        } catch (err: any) {
            const status = err?.response?.status;
            const msg =
                status === 404
                    ? 'Tienda no encontrada. Ingresa el slug correcto manualmente.'
                    : err?.response?.data?.error ??
                    err?.message ??
                    'No se pudo obtener la tienda por slug';

            setRow(rowId, {
                storeInfo: null,
                storeLoading: false,
                storeError: msg,
                storeSlug: normalized,
            });
        }
    };

    // 📂 subida de archivos con:
    // - inferencia de slug
    // - NO duplicar slug en las filas
    const handleFileUpload = (files: File[]) => {
        const newRows: Row[] = [];
        const lookups: { id: string; slug: string }[] = [];

        // slugs que ya existen en las filas actuales
        const existingSlugs = new Set(
            rows
                .map((r) => r.storeSlug?.trim().toLowerCase())
                .filter((s) => !!s),
        );

        const duplicatedSlugs = new Set<string>();

        for (const f of files) {
            const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
            const tooBig = f.size > MAX_MB * 1024 * 1024;

            if (!isPdf) {
                newRows.push({
                    id: crypto.randomUUID(),
                    storeSlug: '',
                    title: f.name,
                    startDate: null,
                    endDate: null,
                    error: 'El archivo no es PDF',
                });
                continue;
            }

            if (tooBig) {
                newRows.push({
                    id: crypto.randomUUID(),
                    storeSlug: '',
                    title: f.name,
                    startDate: null,
                    endDate: null,
                    error: `El archivo supera ${MAX_MB}MB`,
                });
                continue;
            }

            const slug = inferStoreSlugFromFilename(f.name);
            const title = inferTitleFromFilename(f.name);
            const id = crypto.randomUUID();

            const normalizedSlug = slug ? slug.trim().toLowerCase() : '';

            if (normalizedSlug) {
                if (existingSlugs.has(normalizedSlug)) {
                    duplicatedSlugs.add(normalizedSlug);
                    // NO creamos fila extra: ya existe una para ese slug
                    continue;
                }
                existingSlugs.add(normalizedSlug);
            }

            newRows.push({
                id,
                storeSlug: normalizedSlug,
                title,
                startDate: null,
                endDate: null,
                file: f,
                error: slug ? null : 'No se pudo inferir el storeSlug desde el nombre',
                storeLoading: !!normalizedSlug,
            });

            if (normalizedSlug) {
                lookups.push({ id, slug: normalizedSlug });
            }
        }

        if (newRows.length) {
            setRows((prev) => [...newRows, ...prev]);
        }

        if (duplicatedSlugs.size > 0) {
            setSnack({
                open: true,
                sev: 'info',
                msg: `Algunos PDFs no se añadieron porque ya existía una fila para estos slugs: ${[
                    ...duplicatedSlugs,
                ].join(', ')}`,
            });
        }

        // lanzamos lookups de tienda async
        for (const item of lookups) {
            loadStoreForRow(item.id, item.slug);
        }
    };

    async function saveRow(r: Row) {
        if (!r.storeSlug) return setRow(r.id, { error: 'Falta storeSlug' });
        if (!r.startDate || !r.endDate) {
            return setRow(r.id, { error: 'Selecciona rango de fechas' });
        }
        if (r.file && r.error) return;

        try {
            setRow(r.id, { uploading: true, error: null });

            const payloadRange = {
                startDate: r.startDate.toISOString(),
                endDate: r.endDate.toISOString(),
            };

            let result: { ok: boolean; circular: Circular };

            if (r.file) {
                result = await circularService.upload({
                    file: r.file,
                    storeSlug: r.storeSlug,
                    startDate: payloadRange.startDate,
                    endDate: payloadRange.endDate,
                    title: r.title || undefined,
                });
            } else {
                result = await circularService.schedule({
                    storeSlug: r.storeSlug,
                    startDate: payloadRange.startDate,
                    endDate: payloadRange.endDate,
                    title: r.title || undefined,
                });
            }

            setRow(r.id, { uploading: false, saved: true, status: result.circular.status });
            setSnack({ open: true, msg: `Circular guardado para ${r.storeSlug}`, sev: 'success' });
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? err?.message ?? 'Error guardando circular';
            setRow(r.id, { uploading: false, error: msg });
            setSnack({ open: true, msg, sev: 'error' });
        }
    }

    async function saveAll() {
        for (const r of rows) {
            if (r.saved) continue;
            // eslint-disable-next-line no-await-in-loop
            await saveRow(r);
        }
    }

    function addEmptyRow() {
        setRows((prev) => [
            {
                id: crypto.randomUUID(),
                storeSlug: '',
                title: '',
                startDate: null,
                endDate: null,
            },
            ...prev,
        ]);
    }

    const handleCloseSnack = () =>
        setSnack((s) => ({
            ...s,
            open: false,
        }));

    // cuando el usuario termina de editar el slug manualmente
    const handleSlugBlur = (rowId: string, slug: string) => {
        const normalized = slug.trim().toLowerCase();
        if (!normalized) {
            setRow(rowId, {
                storeSlug: '',
                storeInfo: null,
                storeError: 'Slug requerido',
            });
            return;
        }

        // validar duplicado contra otras filas
        const duplicated = rows.some(
            (r) =>
                r.id !== rowId &&
                r.storeSlug?.trim().toLowerCase() === normalized,
        );

        if (duplicated) {
            setRow(rowId, {
                storeSlug: normalized,
                storeInfo: null,
                storeError: 'Este slug ya está siendo usado en otra fila.',
            });
            return;
        }

        loadStoreForRow(rowId, normalized);
    };

    const handleRangeChange = (rowId: string, start: Date | null, end: Date | null) => {
        setRow(rowId, { startDate: start, endDate: end });
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <ScheduleCircularsHeader
                onAddRow={addEmptyRow}
                onSaveAll={saveAll}
                onOpenInstructions={() => setShowInstructions(true)}
            />

            <CircularsUploaderCard maxMb={MAX_MB} 
            onFileUpload={handleFileUpload} />

            <CircularsTable
                rows={rows}
                prettySize={prettySize}
                setRow={setRow}
                removeRow={removeRow}
                saveRow={saveRow}
                onSlugBlur={handleSlugBlur}
                onRangeChange={handleRangeChange}
            />

            <InstructionsModal
                open={showInstructions}
                instructions={instructionsContent}
                onClose={() => setShowInstructions(false)}
            />

            <CircularsSnackbar snack={snack} 
            onClose={handleCloseSnack} />
        </Box>
    );
}
