import { useState, useEffect } from 'react';
import ModalBase from './ModalBase';
import { Loader2, Check } from 'lucide-react';
import client from '../../api/client';
import { getFermes } from '../../api/fermes';
import { getGateways } from '../../api/gateways';
import { getDevicesByGateway } from '../../api/devices';

const TYPES_MESURE = [
  { value: 'temperature',   label: 'Température',      unite: '°C',   measurement: 'sol_metrics',  field: 'temperature'  },
  { value: 'humidite_sol',  label: 'Humidité sol',     unite: '%',    measurement: 'sol_metrics',  field: 'humidite_sol' },
  { value: 'humidite_air',  label: 'Humidité air',     unite: '%',    measurement: 'air_metrics',  field: 'humidite_air' },
  { value: 'ph',            label: 'pH sol',           unite: 'pH',   measurement: 'sol_metrics',  field: 'ph'           },
  { value: 'conductivite',  label: 'Conductivité',     unite: 'dS/m', measurement: 'sol_metrics',  field: 'conductivite' },
  { value: 'luminosite',    label: 'Luminosité',       unite: 'lux',  measurement: 'air_metrics',  field: 'luminosite'   },
  { value: 'co2',           label: 'CO2',              unite: 'ppm',  measurement: 'air_metrics',  field: 'co2'          },
  { value: 'pluviometrie',  label: 'Pluviométrie',     unite: 'mm',   measurement: 'meteo',         field: 'pluie'        },
];

export default function CapteurModal({ capteur, deviceId, onClose, onSaved }) {
  const isEdit = !!capteur?.id;
  const [fermes,   setFermes]   = useState([]);
  const [gateways, setGateways] = useState([]);
  const [devices,  setDevices]  = useState([]);
  const [fermeId,  setFermeId]  = useState('');
  const [gatewayId,setGatewayId]= useState('');

  const defaultType = TYPES_MESURE[0];
  const [form, setForm] = useState({
    deviceId:           capteur?.device_id          || deviceId || '',
    typeMesure:         capteur?.type_mesure         || defaultType.value,
    unite:              capteur?.unite               || defaultType.unite,
    rangeMin:           capteur?.range_min           ?? '',
    rangeMax:           capteur?.range_max           ?? '',
    influxMeasurement:  capteur?.influx_measurement  || defaultType.measurement,
    influxField:        capteur?.influx_field        || defaultType.field,
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFermes().then(({ data }) => setFermes(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!fermeId) return;
    getGateways(fermeId).then(({ data }) => setGateways(data)).catch(() => {});
  }, [fermeId]);

  useEffect(() => {
    if (!gatewayId) return;
    getDevicesByGateway(gatewayId).then(({ data }) => setDevices(data)).catch(() => {});
  }, [gatewayId]);

  function handleTypeChange(value) {
    const t = TYPES_MESURE.find(t => t.value === value) || defaultType;
    setForm(f => ({ ...f, typeMesure: t.value, unite: t.unite, influxMeasurement: t.measurement, influxField: t.field }));
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) {
        await client.put(`/capteurs/${capteur.id}`, form);
      } else {
        await client.post('/capteurs', form);
      }
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  }

  return (
    <ModalBase title={isEdit ? '✏️ Modifier le capteur' : '🔬 Nouveau capteur'} onClose={onClose}>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Type de mesure *</label>
          <select className="input" value={form.typeMesure} onChange={e => handleTypeChange(e.target.value)}>
            {TYPES_MESURE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Unité</label>
            <input className="input" value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Min</label>
              <input type="number" step="any" className="input" value={form.rangeMin}
                onChange={e => setForm({...form, rangeMin: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Max</label>
              <input type="number" step="any" className="input" value={form.rangeMax}
                onChange={e => setForm({...form, rangeMax: e.target.value})} />
            </div>
          </div>
        </div>
        {!deviceId && (
          <>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ferme</label>
              <select className="input" value={fermeId} onChange={e => { setFermeId(e.target.value); setGateways([]); setDevices([]); }}>
                <option value="">Sélectionner...</option>
                {fermes.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Gateway</label>
              <select className="input" value={gatewayId} onChange={e => { setGatewayId(e.target.value); setDevices([]); }}>
                <option value="">Sélectionner...</option>
                {gateways.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Device *</label>
              <select className="input" value={form.deviceId} onChange={e => setForm({...form, deviceId: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.nom || d.device_uid}</option>)}
              </select>
            </div>
          </>
        )}
        <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
          <p>InfluxDB : <code className="text-green-400">{form.influxMeasurement}.{form.influxField}</code></p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isEdit ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
