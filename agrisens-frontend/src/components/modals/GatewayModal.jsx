import { useState, useEffect } from 'react';
import ModalBase from './ModalBase';
import { Loader2, Check } from 'lucide-react';
import client from '../../api/client';
import { getFermes } from '../../api/fermes';

export default function GatewayModal({ gateway, fermeId, onClose, onSaved }) {
  const isEdit = !!gateway?.id;
  const [fermes,  setFermes]  = useState([]);
  const [form, setForm] = useState({
    nom:       gateway?.nom        || '',
    fermeId:   gateway?.ferme_id   || fermeId || '',
    ipAddress: gateway?.ip_address || '',
    latitude:  gateway?.latitude   || '',
    longitude: gateway?.longitude  || '',
    lorawanEnv: gateway?.lorawan_env || 'suburban',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFermes().then(({ data }) => setFermes(data)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) {
        await client.put(`/gateways/${gateway.id}`, form);
      } else {
        await client.post('/gateways', form);
      }
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  }

  return (
    <ModalBase title={isEdit ? '✏️ Modifier la gateway' : '📡 Nouvelle gateway LoRa'} onClose={onClose}>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Nom *</label>
          <input className="input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
        </div>
        {!fermeId && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Ferme *</label>
            <select className="input" value={form.fermeId} onChange={e => setForm({...form, fermeId: e.target.value})} required>
              <option value="">Sélectionner une ferme...</option>
              {fermes.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Adresse IP</label>
          <input className="input" placeholder="192.168.1.1" value={form.ipAddress}
            onChange={e => setForm({...form, ipAddress: e.target.value})} />
        </div>
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
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Environnement LoRaWAN</label>
          <select className="input" value={form.lorawanEnv} onChange={e => setForm({...form, lorawanEnv: e.target.value})}>
            <option value="urban">Urbain (~2 km)</option>
            <option value="suburban">Périurbain (~5 km)</option>
            <option value="rural">Rural (~10 km)</option>
            <option value="open">Terrain ouvert (~15 km)</option>
          </select>
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
