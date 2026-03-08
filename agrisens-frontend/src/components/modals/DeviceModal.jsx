import { useState, useEffect } from 'react';
import ModalBase from './ModalBase';
import { Loader2, Check } from 'lucide-react';
import client from '../../api/client';
import { getFermes } from '../../api/fermes';
import { getGateways } from '../../api/gateways';

const TYPES_DEVICE = ['capteur_sol','capteur_air','station_meteo','capteur_eau','capteur_lumiere','multi_capteur'];

export default function DeviceModal({ device, gatewayId, onClose, onSaved }) {
  const isEdit = !!device?.id;
  const [fermes,   setFermes]   = useState([]);
  const [gateways, setGateways] = useState([]);
  const [fermeId,  setFermeId]  = useState('');
  const [form, setForm] = useState({
    deviceUid:  device?.device_uid  || '',
    nom:        device?.nom         || '',
    typeDevice: device?.type_device || 'capteur_sol',
    gatewayId:  device?.gateway_id  || gatewayId || '',
    latitude:   device?.latitude    || '',
    longitude:  device?.longitude   || '',
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

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) {
        await client.put(`/devices/${device.id}`, form);
      } else {
        await client.post('/devices', form);
      }
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  }

  return (
    <ModalBase title={isEdit ? '✏️ Modifier le device' : '📟 Nouveau device'} onClose={onClose}>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">UID Device *</label>
            <input className="input font-mono" placeholder="SENSOR-001" value={form.deviceUid}
              onChange={e => setForm({...form, deviceUid: e.target.value})} required disabled={isEdit} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nom</label>
            <input className="input" placeholder="Capteur Sol Nord" value={form.nom}
              onChange={e => setForm({...form, nom: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Type de device</label>
          <select className="input" value={form.typeDevice} onChange={e => setForm({...form, typeDevice: e.target.value})}>
            {TYPES_DEVICE.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        {!gatewayId && (
          <>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ferme</label>
              <select className="input" value={fermeId} onChange={e => { setFermeId(e.target.value); setGateways([]); }}>
                <option value="">Sélectionner une ferme...</option>
                {fermes.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Gateway *</label>
              <select className="input" value={form.gatewayId} onChange={e => setForm({...form, gatewayId: e.target.value})} required>
                <option value="">Sélectionner une gateway...</option>
                {gateways.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
              </select>
            </div>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Latitude GPS</label>
            <input type="number" step="any" className="input" value={form.latitude}
              onChange={e => setForm({...form, latitude: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Longitude GPS</label>
            <input type="number" step="any" className="input" value={form.longitude}
              onChange={e => setForm({...form, longitude: e.target.value})} />
          </div>
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
