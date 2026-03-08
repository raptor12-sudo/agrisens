import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Radio, Cpu, RefreshCw, Sprout } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const DEVICE_COLORS = {
  capteur_sol:   '#00d4aa',
  station_meteo: '#4fc3f7',
  capteur_npk:   '#ffe082',
  default:       '#a78bfa',
};

export default function MapPage() {
  const { user } = useAuth();
  const token    = localStorage.getItem('accessToken');
  const headers  = { Authorization: `Bearer ${token}` };

  const [fermes,   setFermes]   = useState([]);
  const [gateways, setGateways] = useState([]);
  const [devices,  setDevices]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const mapRef  = useRef(null);
  const leaflet = useRef(null);
  const markers = useRef([]);
  const circles = useRef([]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [fRes, dRes] = await Promise.all([
        axios.get(`${API}/fermes`,  { headers }),
        axios.get(`${API}/devices`, { headers }),
      ]);
      const fs   = fRes.data  || [];
      const devs = dRes.data  || [];
      setFermes(fs);
      setDevices(devs);
      const allGw = [];
      await Promise.all(fs.map(async f => {
        try {
          const r = await axios.get(`${API}/gateways/ferme/${f.id}`, { headers });
          allGw.push(...(r.data || []).map(g => ({ ...g, fermeNom: f.nom })));
        } catch {}
      }));
      setGateways(allGw);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!mapRef.current || leaflet.current) return;
    const L = window.L;
    if (!L) return;
    const map = L.map(mapRef.current, { center: [14.6928, -17.4467], zoom: 15, zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    leaflet.current = map;
    return () => { map.remove(); leaflet.current = null; };
  }, []);

  useEffect(() => {
    const L = window.L;
    if (!L || !leaflet.current) return;
    markers.current.forEach(m => m.remove());
    circles.current.forEach(c => c.remove());
    markers.current = [];
    circles.current = [];

    fermes.forEach(f => {
      const lat = parseFloat(f.latitude), lng = parseFloat(f.longitude);
      if (!lat || !lng) return;
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:rgba(34,197,94,0.9);border:2px solid white;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;color:white;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4)">🌱 ${f.nom}</div>`,
        iconAnchor: [0, 0],
      });
      markers.current.push(L.marker([lat, lng], { icon }).addTo(leaflet.current));
    });

    gateways.forEach(gw => {
      const lat = parseFloat(gw.latitude), lng = parseFloat(gw.longitude);
      if (!lat || !lng) return;
      const online = gw.statut === 'online';
      const radius = gw.lorawan_env === 'urbain' ? 1500 : gw.lorawan_env === 'rural' ? 8000 : 3000;
      circles.current.push(L.circle([lat, lng], {
        radius, color: online ? '#a78bfa' : '#6b7280',
        fillColor: online ? '#a78bfa' : '#6b7280',
        fillOpacity: 0.07, weight: 1.5, dashArray: '6 4',
      }).addTo(leaflet.current));
      const gwIcon = L.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;border-radius:50%;background:${online ? '#a78bfa' : '#6b7280'};border:3px solid white;box-shadow:0 0 12px ${online ? '#a78bfa88' : 'transparent'};display:flex;align-items:center;justify-content:center;font-size:10px">📡</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      });
      markers.current.push(
        L.marker([lat, lng], { icon: gwIcon }).addTo(leaflet.current)
          .bindPopup(`<b style="color:#a78bfa">📡 ${gw.nom}</b><br><span style="color:${online ? '#22c55e' : '#ef4444'}">${online ? '● En ligne' : '○ Hors ligne'}</span>`)
      );
    });

    devices.forEach(dev => {
      const lat = parseFloat(dev.latitude), lng = parseFloat(dev.longitude);
      if (!lat || !lng) return;
      const online = dev.statut === 'online';
      const color  = DEVICE_COLORS[dev.type_device] || DEVICE_COLORS.default;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${online ? color : '#6b7280'};border:2px solid white;box-shadow:0 0 ${online ? 10 : 0}px ${color}"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      });
      markers.current.push(
        L.marker([lat, lng], { icon }).addTo(leaflet.current)
          .on('click', () => setSelected(dev))
          .bindTooltip(`<b>${dev.nom}</b><br><small>${dev.device_uid}</small>`, { direction: 'top', offset: [0, -10] })
      );
    });
  }, [fermes, gateways, devices]);

  const onlineDevs = devices.filter(d => d.statut === 'online').length;
  const onlineGws  = gateways.filter(g => g.statut === 'online').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', background: '#0d1117', fontFamily: 'Inter, system-ui, sans-serif', padding: '20px 24px', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'white' }}>Carte réseau IoT</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Infrastructure LoRaWAN — Devices et Couverture</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { icon: Sprout, label: 'Fermes',   value: fermes.length,                     color: '#22c55e' },
            { icon: Radio,  label: 'Gateways', value: `${onlineGws}/${gateways.length}`,  color: '#a78bfa' },
            { icon: Cpu,    label: 'Devices',  value: `${onlineDevs}/${devices.length}`,  color: '#00d4aa' },
          ].map(k => (
            <div key={k.label} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <k.icon size={15} color={k.color} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{k.label}</div>
              </div>
            </div>
          ))}
          <button onClick={fetchAll} style={{ background: '#161b22', border: '1px solid #30363d', color: '#8b949e', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <RefreshCw size={13} /> Actualiser
          </button>
        </div>
      </div>

      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '8px 16px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: '#8b949e' }}>
        {[
          { color: '#00d4aa', label: 'Capteur sol', glow: true },
          { color: '#4fc3f7', label: 'Station météo', glow: false },
          { color: '#a78bfa', label: 'Gateway LoRa', glow: false },
        ].map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block', boxShadow: l.glow ? `0 0 6px ${l.color}` : 'none' }} />
            {l.label}
          </span>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
        <div style={{ flex: 1, borderRadius: 14, overflow: 'hidden', border: '1px solid #30363d', position: 'relative', minHeight: 500 }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(13,17,23,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4aa', fontSize: 13 }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Chargement…
            </div>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 500, position: 'absolute', inset: 0 }} />
        </div>

        {selected && (
          <div style={{ width: 260, background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: '20px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{selected.nom}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18 }}>x</button>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: selected.statut === 'online' ? '#00d4aa22' : '#ff444422', color: selected.statut === 'online' ? '#00d4aa' : '#ff4444', border: `1px solid ${selected.statut === 'online' ? '#00d4aa44' : '#ff444444'}`, width: 'fit-content' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: selected.statut === 'online' ? '#00d4aa' : '#ff4444' }} />
              {selected.statut === 'online' ? 'En ligne' : 'Hors ligne'}
            </div>
            {[
              ['UID',       selected.device_uid],
              ['Type',      selected.type_device],
              ['Batterie',  selected.battery_level != null ? `${selected.battery_level}%` : '—'],
              ['RSSI LoRa', selected.lora_rssi != null ? `${selected.lora_rssi} dBm` : '—'],
              ['Latitude',  selected.latitude  || '—'],
              ['Longitude', selected.longitude || '—'],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #21262d' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{lbl}</span>
                <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            <a href={`/devices/${selected.id}`} style={{ display: 'block', textAlign: 'center', background: '#00d4aa22', border: '1px solid #00d4aa44', color: '#00d4aa', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginTop: 'auto' }}>
              Voir details
            </a>
          </div>
        )}
      </div>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } } .leaflet-container { background: #0d1117 !important; }"}</style>
    </div>
  );
}
