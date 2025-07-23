'use client';

import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStores } from '@/hooks/fetching/stores/useStores';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import supercluster from 'supercluster';
import * as XLSX from 'xlsx';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

const getColorByAudience = (audience: number) => {
  if (audience < 1000) return '#f44336';
  if (audience < 5000) return '#fdd835';
  if (audience < 10000) return '#EE1E7C';
  return '#4caf50';
};

const MapboxMap = () => {
  const { data: stores, isLoading, error } = useStores();
  const [selected, setSelected] = useState<any>(null);
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [zipFilter, setZipFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [bounds, setBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);
  const [zoom, setZoom] = useState(9);

  const filteredStores = useMemo(() => {
    return (
      stores?.filter((store) => {
        const count = store.customerCount || 0;
        const zipMatch = zipFilter === 'all' || store.zipCode === zipFilter;
        const nameMatch = store.name.toLowerCase().includes(searchTerm.toLowerCase());

        if (!zipMatch || !nameMatch) return false;

        if (audienceFilter === 'lt1k') return count < 1000;
        if (audienceFilter === '1kto10k') return count >= 1000 && count <= 10000;
        if (audienceFilter === 'gt10k') return count > 10000;
        return true;
      }) || []
    );
  }, [stores, audienceFilter, zipFilter, searchTerm]);

  const zipCodes = useMemo(() => {
    const unique = new Set(stores?.map((s) => s.zipCode));
    return Array.from(unique);
  }, [stores]);

  const exportToExcel = () => {
    const data = filteredStores.map((s) => ({
      Tienda: s.name,
      Audiencia: s.customerCount,
      Direccion: s.address,
      CodigoPostal: s.zipCode,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tiendas');
    XLSX.writeFile(wb, 'tiendas.xlsx');
  };

  const points: any = useMemo(() => {
    return filteredStores.map((store) => {
      const [lng, lat] = store.location?.coordinates || [];
      return {
        type: 'Feature',
        properties: {
          cluster: false,
          storeId: store._id,
          store,
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      };
    });
  }, [filteredStores]);

  const clusterIndex = useMemo(() => {
    const cl = new supercluster({ radius: 60, maxZoom: 20 });
    cl.load(points);
    return cl;
  }, [points]);

  const clusters = useMemo(() => {
    return clusterIndex.getClusters(bounds, zoom);
  }, [clusterIndex, bounds, zoom]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        textAlign="center"
        py={4}
      >
        <Typography
          color="error"
          variant="h6"
        >
          Error cargando las tiendas.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        mb={2}
        display="flex"
        flexWrap="wrap"
        gap={2}
      >
        <FormControl size="small">
          <InputLabel>Audiencia</InputLabel>
          <Select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            label="Audiencia"
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="lt1k">Menos de 1,000</MenuItem>
            <MenuItem value="1kto10k">1,000 - 10,000</MenuItem>
            <MenuItem value="gt10k">Más de 10,000</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Buscar por nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Button
          variant="outlined"
          onClick={exportToExcel}
        >
          Exportar a Excel
        </Button>
      </Box>

      <Box
        width="100%"
        height="600px"
        borderRadius={2}
        overflow="hidden"
      >
        <Map
          initialViewState={{ latitude: 40.72, longitude: -74, zoom: 9 }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          optimizeForTerrain
          onMoveEnd={(e) => {
            const b = e.target.getBounds();
            setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
            setZoom(Math.round(e.viewState.zoom));
          }}
        >
          <NavigationControl position="top-right" />

          {clusters.map((cluster: any) => {
            const [lng, lat] = cluster.geometry.coordinates;
            const { cluster: isCluster, point_count: pointCount } = cluster.properties;

            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  longitude={lng}
                  latitude={lat}
                  anchor="bottom"
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: '#1976d2',
                      borderRadius: '50%',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 'bold',
                      boxShadow: 2,
                    }}
                  >
                    {pointCount}
                  </Box>
                </Marker>
              );
            }

            const store = cluster.properties.store;
            const color = getColorByAudience(store.customerCount || 0);
            const imageSrc =
              store.image ||
              'https://res.cloudinary.com/proyectos-personales/image/upload/v1679455472/woocommerce-placeholder-600x600_xo2kmv.png';

            return (
              <Marker
                key={store._id}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={() => setSelected(store)}
              >
                <Box
                  textAlign="center"
                  sx={{ cursor: 'pointer' }}
                >
                  <Avatar
                    src={imageSrc}
                    alt={store.name}
                    sx={{
                      width: 36,
                      height: 36,
                      border: `2px solid ${color}`,
                      boxShadow: 2,
                      mb: '2px',
                    }}
                  />
                  <Box
                    sx={{
                      fontSize: 10,
                      px: 1,
                      py: '2px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      backgroundColor: color,
                      color: 'white',
                      display: 'inline-block',
                      minWidth: '50px',
                    }}
                  >
                    {store.customerCount || 0} usuarios
                  </Box>
                </Box>
              </Marker>
            );
          })}
        </Map>

        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: '#fff',
              borderRadius: 3,
              p: 4,
              boxShadow: 24,
              width: 320,
              textAlign: 'center',
            }}
          >
            <Avatar
              src={selected?.image}
              alt={selected?.name}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
            />
            <Typography
              variant="h6"
              fontWeight="bold"
              mb={1}
            >
              {selected?.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Audiencia: <b>{selected?.customerCount}</b> usuarios
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Código Postal: <b>{selected?.zipCode}</b>
            </Typography>
            <Box
              mt={3}
              display="flex"
              flexDirection="column"
              gap={1}
            >
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => {
                  window.open(`/admin/management/stores/edit/${selected._id}`, '_blank');
                }}
              >
                Ver tienda
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => {
                  const address = encodeURIComponent(selected?.address || '');
                  const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
                  window.open(url, '_blank');
                }}
                disabled={!selected?.address}
              >
                Abrir en Google Maps
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
};

export default MapboxMap;
