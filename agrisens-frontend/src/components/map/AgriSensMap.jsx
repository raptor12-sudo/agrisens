import { useEffect, useRef } from 'react';
import { IotMapManager, IotMapConfig } from 'iotmapmanager';
import 'iotmapmanager/iot-map-manager.css';

// Rayons LoRaWAN par environnement (mètres)
const LORAWAN_RADIUS = {
  urban:    2000,
  suburban: 5000,
  rural:    10000,
  open:     15000,
};

// Statut → couleur Orange Design System
const STATUS_MAP = {
  online:      'positive',
  offline:     'inactive',
  maintenance: 'warning',
};

export default function AgriSensMap({
  fermes    = [],
  parcelles = [],
  gateways  = [],
  devices   = [],
  onMarkerClick,
}) {
  const mapRef     = useRef(null);
  const managerRef = useRef(null);

  // Init carte
  useEffect(() => {
    if (!mapRef.current || managerRef.current) return;

    const manager = new IotMapManager();
    manager.init('agrisens-map');
    managerRef.current = manager;

    return () => { managerRef.current = null; };
  }, []);

  // Mettre à jour les markers quand les données changent
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    // Vider la carte
    manager.removeAllMarkers();
    manager.removeAllAreas();

    const allMarkers   = [];
    const gwAreas      = [];

    // ── Fermes (layer "fermes") ──
    fermes.filter(f => f.latitude && f.longitude).forEach(ferme => {
      allMarkers.push({
        id:       `ferme-${ferme.id}`,
        location: { lat: parseFloat(ferme.latitude), lng: parseFloat(ferme.longitude) },
        layer:    'fermes',
        shape: {
          type:    'square',
          color:   '#16a34a',
          anchored: true,
        },
        inner: { icon: 'gg-trees' },
        popup: {
          title: `🌾 ${ferme.nom}`,
          body:  `
            <p>${ferme.localisation || ''}</p>
            ${ferme.type_culture ? `<p>🌱 ${ferme.type_culture}</p>` : ''}
            ${ferme.superficie    ? `<p>${ferme.superficie} ha</p>`   : ''}
          `,
        },
      });
    });

    // ── Parcelles (layer "parcelles") ──
    parcelles.filter(p => p.latitude && p.longitude).forEach(parcelle => {
      allMarkers.push({
        id:       `parcelle-${parcelle.id}`,
        location: { lat: parseFloat(parcelle.latitude), lng: parseFloat(parcelle.longitude) },
        layer:    'parcelles',
        shape: {
          type:    'circle',
          color:   '#0284c7',
          anchored: true,
        },
        inner: { icon: 'gg-data' },
        popup: {
          title: `🌱 ${parcelle.nom}`,
          body:  `
            ${parcelle.type_culture ? `<p>${parcelle.type_culture}</p>` : ''}
            ${parcelle.surface      ? `<p>${parcelle.surface} ha</p>`   : ''}
            <p style="color:#888">${parcelle.fermeNom || ''}</p>
          `,
        },
      });
    });

    // ── Gateways LoRaWAN (layer "gateways") + Areas couverture ──
    gateways.filter(g => g.latitude && g.longitude).forEach(gw => {
      const status = STATUS_MAP[gw.statut] || 'inactive';
      const env    = gw.lorawan_env || 'suburban';
      const radius = LORAWAN_RADIUS[env];

      // Marker gateway
      allMarkers.push({
        id:       `gw-${gw.id}`,
        location: { lat: parseFloat(gw.latitude), lng: parseFloat(gw.longitude) },
        layer:    'gateways',
        status,
        shape: {
          type:    'circle',
          anchored: true,
          color:   gw.statut === 'online' ? '#7c3aed' : '#6b7280',
        },
        inner: { icon: 'gg-wifi' },
        tab: {
          type:    'normal',
          content: `<b>LoRa</b> ~${(radius/1000).toFixed(0)}km`,
        },
        popup: {
          title: `📡 ${gw.nom}`,
          body:  `
            <p>Statut : <b style="color:${gw.statut==='online'?'#16a34a':'#9ca3af'}">${gw.statut}</b></p>
            <p>IP : ${gw.ip_address || '—'}</p>
            <hr style="margin:6px 0;border-color:#e5e7eb"/>
            <p><b>LoRaWAN Coverage</b></p>
            <p>Environnement : ${env}</p>
            <p>Rayon : ~${(radius/1000).toFixed(0)} km</p>
            <p>Surface : ~${Math.round(Math.PI * Math.pow(radius/1000, 2))} km²</p>
          `,
        },
      });

      // Area couverture LoRaWAN — cercle approximé en polygone
      const steps  = 64;
      const points = [];
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const dlat  = (radius / 111320) * Math.cos(angle);
        const dlng  = (radius / (111320 * Math.cos(parseFloat(gw.latitude) * Math.PI / 180))) * Math.sin(angle);
        points.push({
          lat: parseFloat(gw.latitude) + dlat,
          lng: parseFloat(gw.longitude) + dlng,
        });
      }

      gwAreas.push({
        id:          `area-${gw.id}`,
        points,
        color:       gw.statut === 'online' ? '#7c3aed' : '#6b7280',
        fillColor:   gw.statut === 'online' ? '#7c3aed' : '#6b7280',
        fillOpacity: 0.08,
      });
    });

    // ── Devices capteurs (layer "devices") ──
    devices.filter(d => d.latitude && d.longitude).forEach(device => {
      const status = STATUS_MAP[device.statut] || 'inactive';
      allMarkers.push({
        id:       `dev-${device.id}`,
        location: { lat: parseFloat(device.latitude), lng: parseFloat(device.longitude) },
        layer:    'devices',
        status,
        shape: {
          type:    'circle',
          anchored: true,
          percent: device.battery_level || 0, // jauge batterie dans le marker !
        },
        inner: { icon: 'gg-controller' },
        popup: {
          title: `📟 ${device.nom || device.device_uid}`,
          body:  `
            <p>UID : <code>${device.device_uid}</code></p>
            <p>Type : ${device.type_device || '—'}</p>
            <p>Statut : <b style="color:${device.statut==='online'?'#16a34a':'#9ca3af'}">${device.statut}</b></p>
            ${device.battery_level !== null ? `<p>🔋 Batterie : ${device.battery_level}%</p>` : ''}
          `,
        },
      });
    });

    // Ajouter markers et areas
    if (allMarkers.length) manager.addMarkers(allMarkers);
    if (gwAreas.length)    manager.addAreas(gwAreas);

    // Centrer sur les données
    const allCoords = allMarkers.map(m => m.location);
    if (allCoords.length === 1) {
      manager.map.setView([allCoords[0].lat, allCoords[0].lng], 13);
    } else if (allCoords.length > 1) {
      const lats = allCoords.map(c => c.lat);
      const lngs = allCoords.map(c => c.lng);
      manager.map.fitBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ], { padding: [40, 40] });
    }

    // Click sur marker
    if (onMarkerClick) {
      manager.map.on('click', () => {});
    }

  }, [fermes, parcelles, gateways, devices]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div id="agrisens-map" style={{ height: '100%', width: '100%', borderRadius: '12px' }} />
    </div>
  );
}
