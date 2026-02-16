// src/hooks/useStoreEditor.js
import { Store, updateStore } from '@/services/store.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

const isValidLngLat = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lng, lat] = coords;
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
};

// Trata "" como “igual” a null/undefined (evita mandar vacíos por default)
const softEqual = (a, b) => {
  const aEmpty = a === undefined || a === null || a === '';
  const bEmpty = b === undefined || b === null || b === '';
  // Caso especial: tratamos "sin_instalar" como vacío para no forzar patches
  // cuando el backend aún no tiene estos campos.
  if ((aEmpty && b === 'sin_instalar') || (bEmpty && a === 'sin_instalar')) return true;
  if (aEmpty && bEmpty) return true;
  return a === b;
};

const locEqual = (o, f) => {
  const oc = o?.location?.coordinates;
  const fc = f?.location?.coordinates;
  if (!isValidLngLat(oc) && !isValidLngLat(fc)) return true;
  if (!isValidLngLat(oc) || !isValidLngLat(fc)) return false;
  return oc[0] === fc[0] && oc[1] === fc[1];
};

export function useStoreEditor(store) {
  const [edit, setEdit] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    type: 'error' | 'success' | 'info';
  }>({ open: false, msg: '', type: 'success' });

  // Prellenar el form con datos reales (evita defaults vacíos)
  const [form, setForm] = useState({
    name: store.name || '',
    address: store.address || '',
    zipCode: store.zipCode || '',
    type: store.type || 'free',
    active: !!store.active,
    phoneNumber: store.phoneNumber || '',
    provider: store.provider || 'twilio',
    bandwidthPhoneNumber: store.bandwidthPhoneNumber || '',
    twilioPhoneNumber: store.twilioPhoneNumber || '',
    twilioPhoneNumberSid: store.twilioPhoneNumberSid || '',
    twilioPhoneNumberFriendlyName: store.twilioPhoneNumberFriendlyName || '',
    verifiedByTwilio: !!store.verifiedByTwilio,

    // 🆕 opcional: circulars url (lo mandamos al backend si cambia)
    circularssUrl: store.circularssUrl ?? null,

    location: isValidLngLat(store?.location?.coordinates)
      ? { type: 'Point', coordinates: [...store.location.coordinates] }
      : undefined,

    membershipType: store.membershipType ?? 'semanal',
    paymentMethod: store.paymentMethod ?? 'card',
    startContractDate: store.startContractDate ?? null,

    // 🆕 Tablet / Kiosko
    // 'instalada' | 'desinstalada' | 'sin_instalar'
    kioskTabletStatus: store.kioskTabletStatus ?? 'sin_instalar',
    // Fecha (YYYY-MM-DD) o null
    kioskTabletDate: store.kioskTabletDate ?? null,
    // Cantidad de tablets (number) o null
    kioskTabletQuantity: store.kioskTabletQuantity ?? null,
  });

  const kioskUrl = useMemo(
    () => `https://kiosko.sweepstouch.com/?slug=${encodeURIComponent(store.slug || '')}`,
    [store.slug]
  );

  const hasCoords = isValidLngLat(form?.location?.coordinates);
  const lng = hasCoords
    ? form.location.coordinates[0]
    : store.location?.coordinates?.[0] ?? -73.9857;
  const lat = hasCoords
    ? form.location.coordinates[1]
    : store.location?.coordinates?.[1] ?? 40.7484;

  // Handlers de mapa
  const onMapClick = (e) => {
    if (!edit) return;
    const { lngLat } = e;
    setForm((s) => ({ ...s, location: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] } }));
  };

  const onMarkerDragEnd = (e) => {
    if (!edit) return;
    const { lngLat } = e;
    setForm((s) => ({ ...s, location: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] } }));
  };

  const handleChange = (key) => (e) => {
    const val =
      e?.target?.type === 'checkbox' ? !!e.target.checked : e?.target?.value ?? e?.value ?? e;
    setForm((s) => ({ ...s, [key]: val }));
  };

  // Construye el patch SOLO con cambios reales
  const buildPatch = (orig, curr) => {
    const patch: any = {};

    const keys = [
      'name',
      'address',
      'zipCode',
      'type',
      'active',
      'phoneNumber',
      'provider',
      'bandwidthPhoneNumber',
      'twilioPhoneNumber',
      'twilioPhoneNumberSid',
      'twilioPhoneNumberFriendlyName',
      'verifiedByTwilio',
      'membershipType',
      'paymentMethod',
      'startContractDate',
      'circularssUrl',
      'kioskTabletStatus',
      'kioskTabletDate',
      'kioskTabletQuantity',
    ];

    keys.forEach((k) => {
      const o = orig?.[k];
      const f = curr?.[k];
      if (!softEqual(o, f)) {
        patch[k] = f; // distinto → lo mandamos
      }
    });

    // location: solo si es válida y cambió
    const currLoc = curr?.location;
    if (!locEqual(orig, curr) && isValidLngLat(currLoc?.coordinates)) {
      patch.location = {
        type: 'Point',
        coordinates: [Number(currLoc.coordinates[0]), Number(currLoc.coordinates[1])],
      };
    }

    // Limpia undefined explícitos
    Object.keys(patch).forEach((k) => {
      if (patch[k] === undefined) delete patch[k];
    });

    return patch;
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: Store) => updateStore(store._id, body),
    onSuccess: (resp) => {
      const updated: any = resp;

      // refresca form con lo que vino del server
      setForm((s) => ({
        ...s,
        ...updated,
        location: isValidLngLat(updated?.location?.coordinates)
          ? { type: 'Point', coordinates: updated.location.coordinates }
          : s.location,
      }));

      setSnack({ open: true, msg: 'Cambios guardados correctamente.', type: 'success' });
      setEdit(false);

      queryClient.invalidateQueries({ queryKey: ['store', store._id] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: () => {
      setSnack({
        open: true,
        msg: 'No se pudieron guardar los cambios.',
        type: 'error',
      });
    },
  });

  const handleSave = () => {
    const patch = buildPatch(store, form);
    if (Object.keys(patch).length === 0) {
      setSnack({ open: true, msg: 'No hay cambios por guardar.', type: 'success' });
      setEdit(false);
      return;
    }
    mutation.mutate(patch);
  };

  const handleCancel = () => {
    // reset al estado original
    setForm({
      name: store.name || '',
      address: store.address || '',
      zipCode: store.zipCode || '',
      type: store.type || 'free',
      active: !!store.active,
      phoneNumber: store.phoneNumber || '',
      provider: store.provider || 'twilio',
      bandwidthPhoneNumber: store.bandwidthPhoneNumber || '',
      twilioPhoneNumber: store.twilioPhoneNumber || '',
      twilioPhoneNumberSid: store.twilioPhoneNumberSid || '',
      twilioPhoneNumberFriendlyName: store.twilioPhoneNumberFriendlyName || '',
      verifiedByTwilio: !!store.verifiedByTwilio,

      // 🆕 opcional
      circularssUrl: store.circularssUrl ?? null,

      location: isValidLngLat(store?.location?.coordinates)
        ? { type: 'Point', coordinates: [...store.location.coordinates] }
        : undefined,

      membershipType: store.membershipType ?? 'semanal',
      paymentMethod: store.paymentMethod ?? 'card',
      startContractDate: store.startContractDate ?? null,

      // 🆕 Tablet / Kiosko
      kioskTabletStatus: store.kioskTabletStatus ?? 'sin_instalar',
      kioskTabletDate: store.kioskTabletDate ?? null,
      kioskTabletQuantity: store.kioskTabletQuantity ?? null,
    });

    setEdit(false);
  };

  return {
    form,
    setForm,
    edit,
    setEdit,
    saving: mutation.isPending,
    snack,
    setSnack,

    // mapa
    hasCoords,
    lng,
    lat,
    onMapClick,
    onMarkerDragEnd,

    // acciones
    handleChange,
    handleSave,
    handleCancel,

    // derivados
    kioskUrl,
  };
}
