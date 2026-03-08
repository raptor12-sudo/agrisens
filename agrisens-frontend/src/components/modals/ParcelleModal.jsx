import { useState } from 'react';
import ModalBase from './ModalBase';
import { Loader2, Check } from 'lucide-react';
import client from '../../api/client';

const TYPES_SOL = ['Argileux','Limoneux','Sableux','Sablo-limoneux','Latéritique','Noir volcanique'];
const CULTURES  = ['Riz','Tomates','Maïs','Oignons','Mil','Arachide','Manioc','Patate douce','Légumes feuilles'];

export default function ParcelleModal({ parcelle, fermeId, onClose, onSaved }) {
  const isEdit = !!parcelle?.id;
  const [form, setForm] = useState({
    nom:          parcelle?.nom          || '',
    surface:      parcelle?.surface      || '',
    typeCulture:  parcelle?.type_culture || '',
    typeSol:      parcelle?.type_sol     || '',
    datePlantation: parcelle?.date_plantation ? parcelle.date_plantation.split('T')[0] : '',
    latitude:     parcelle?.latitude     || '',
    longitude:    parcelle?.longitude    || '',
    description:  parcelle?.description  || '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, fermeId: fermeId || parcelle?.ferme_id };
      if (isEdit) {
        await client.put(`/parcelles/${parcelle.id}`, payload);
      } else {
        await client.post('/parcelles', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  }

  return (
    <ModalBase title={isEdit ? '✏️ Modifier la parcelle' : '🌱 Nouvelle parcelle'} onClose={onClose}>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Nom de la parcelle *</label>
          <input className="input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Surface (ha)</label>
            <input type="number" step="0.01" className="input" value={form.surface}
              onChange={e => setForm({...form, surface: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Date plantation</label>
            <input type="date" className="input" value={form.datePlantation}
              onChange={e => setForm({...form, datePlantation: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type de culture</label>
            <select className="input" value={form.typeCulture}
              onChange={e => setForm({...form, typeCulture: e.target.value})}>
              <option value="">Sélectionner...</option>
              {CULTURES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type de sol</label>
            <select className="input" value={form.typeSol}
              onChange={e => setForm({...form, typeSol: e.target.value})}>
              <option value="">Sélectionner...</option>
              {TYPES_SOL.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
