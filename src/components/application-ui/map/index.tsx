'use client';

import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const icon = new L.Icon({
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

export const StoreMap = ({ lat, lng, name }: StoreMapProps) => (
  <MapContainer
    center={[lat, lng]}
    zoom={16}
    scrollWheelZoom
    style={{ height: 350, width: '100%' }}
  >
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Marker
      position={[lat, lng]}
      icon={icon}
    >
      <Popup>{name}</Popup>
    </Marker>
  </MapContainer>
);
