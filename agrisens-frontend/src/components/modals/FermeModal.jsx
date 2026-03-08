import { useState } from 'react';
import ModalBase from './ModalBase';
import { Loader2, Check } from 'lucide-react';
import client from '../../api/client';

export default function FermeModal({ ferme, onClose, onSaved }) {
  const isEdit = !!ferme?.id;
  const [form, setForm] = useState({
    nom:         ferme?.nom         || '',
    localisation:ferme?.localisation|| '',
    superficie:  ferme?.superficie  || '',
    typeCulture: ferme?.type_culture|| '',
    latitude:    ferme?.latitude    || '',
    longitude:   ferme?.longitude   || '',
    description: ferme?.description || '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) {
        await client.put(`/fermes/${ferme.id}`, form);
      } else {
        await client.post('/fermes', form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  }

  return (
    <ModalBase title={isEdit ? '✏️ Modifier la ferme' : '🌾 Nouvelle ferme'} onClose={onClose}>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Nom de la ferme *</label>
          <input className="input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Localisation</label>
          <input className="input" placeholder="Dakar, Sénégal" value={form.localisation}
            onChange={e => setForm({...form, localisation: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Superficie (ha)</label>
            <input type="number" step="0.1" className="input" value={form.superficie}
              onChange={e => setForm({...form, superficie: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type de culture</label>
            <input className="input" placeholder="Maraîchage, Riz..." value={form.typeCulture}
              onChange={e => setForm({...form, typeCulture: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Latitude GPS</label>
            <input type="number" step="any" className="input" placeholder="14.6928" value={form.latitude}
              onChange={e => setForm({...form, latitude: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Longitude GPS</label>
            <input type="number" step="any" className="input" placeholder="-17.4467" value={form.longitude}
              onChange={e => setForm({...form, longitude: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Description</label>
          <textarea className="input h-20 resize-none" value={form.description}
            onChange={e => setForm({...form, description: e.target.value})} />
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
