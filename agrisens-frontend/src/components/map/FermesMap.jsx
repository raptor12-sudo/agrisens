import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icônes Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const onlineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const offlineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const fermeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function AutoCenter({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points.length]);
  return null;
}

export default function FermesMap({ fermes = [], gateways = [], devices = [] }) {
  // Collecter tous les points avec coordonnées
  const fermePoints = fermes
    .filter(f => f.latitude && f.longitude)
    .map(f => ({ lat: parseFloat(f.latitude), lng: parseFloat(f.longitude), type: 'ferme', data: f }));

  const allPoints = [...fermePoints];

  // Centre par défaut : Dakar
  const center = allPoints.length > 0
    ? [allPoints[0].lat, allPoints[0].lng]
    : [14.6928, -17.4467];

  return (
    <div className="card p-0 overflow-hidden" style={{ height: '400px' }}>
      <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}
        className="rounded-xl">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AutoCenter points={allPoints} />

        {fermes.filter(f => f.latitude && f.longitude).map(ferme => (
          <Marker key={ferme.id}
            position={[parseFloat(ferme.latitude), parseFloat(ferme.longitude)]}
            icon={fermeIcon}>
            <Popup>
              <div className="text-gray-900">
                <p className="font-bold text-base">{ferme.nom}</p>
                <p className="text-sm text-gray-600">{ferme.localisation}</p>
                {ferme.type_culture && <p className="text-xs mt-1 text-green-700">🌱 {ferme.type_culture}</p>}
                {ferme.superficie   && <p className="text-xs text-gray-500">{ferme.superficie} ha</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {devices.filter(d => d.latitude && d.longitude).map(device => (
          <Marker key={device.id}
            position={[parseFloat(device.latitude), parseFloat(device.longitude)]}
            icon={device.statut === 'online' ? onlineIcon : offlineIcon}>
            <Popup>
              <div className="text-gray-900">
                <p className="font-bold">{device.nom || device.device_uid}</p>
                <p className="text-xs text-gray-500">{device.type_device}</p>
                <span className={`text-xs font-medium ${device.statut === 'online' ? 'text-green-600' : 'text-gray-400'}`}>
                  ● {device.statut}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
