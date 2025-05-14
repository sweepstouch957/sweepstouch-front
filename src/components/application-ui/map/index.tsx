'use client';

import 'leaflet/dist/leaflet.css';
import L, { Icon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

const icon: Icon = new L.Icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type StoreMapProps = {
  lat: number;
  lng: number;
  name: string;
};

export const StoreMap = ({ lat, lng, name }: StoreMapProps) => {
  const position: [number, number] = [lat, lng]; // ✅ definir tipo tuple explícito

  return <></>;
};
