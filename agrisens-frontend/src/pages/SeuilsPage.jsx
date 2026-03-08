import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFermes } from '../api/fermes';
import { getGateways } from '../api/gateways';
import { getDevicesByGateway } from '../api/devices';
import { getCapteurs } from '../api/capteurs';
import client from '../api/client';
import ModalBase from '../components/modals/ModalBase';
import {
  Plus, Trash2, Loader2, RefreshCw, AlertTriangle,
  Thermometer, Droplets, Activity, Check, Pencil
} from 'lucide-react';

const SEVERITES = [
  { value: 'info',     label: 'Info',     color: 'bg-blue-500/20 text-blue-400'   },
  { value: 'warning',  label: 'Warning',  color: 'bg-yellow-500/20 text-yellow-400'},
  { value: 'critical', label: 'Critical', color: 'bg-red-500/20 text-red-400'     },
  { value: 'urgence',  label: 'Urgence',  color: 'bg-red-700/20 text-red-300'     },
];

const TYPE_ICONS = { temperature: Thermometer, humidite_sol: Droplets, humidite_air: Droplets };

function SeuilModal({ seuil, capteurId, capteur, onClose, onSaved }) {
  const isEdit = !!seuil?.id;
  const [form, setForm] = useState({
    valeurMin:        seuil?.valeur_min        ?? '',
    valeurMax:        seuil?.valeur_max        ?? '',
    severite:         seuil?.severite          || 'warning',
    dureeDepassement: seuil?.duree_depassement || 0,
    message:          seuil?.message           || '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, capteurId };
      if (isEdit) {
        await client.put(`/alertes/seuils/${seuil.id}`, payload);
      } else {
        await client.post('/alertes/seuils', payload);
      }
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  }

  return (
    <ModalBase title={isEdit ? '✏️ Modifier le seuil' : '⚙️ Nouveau seuil d\'alerte'} onClose={onClose}>
      {capteur && (
        <div className="bg-gray-800 rounded-lg px-3 py-2 mb-4 text-sm text-gray-300">
          Capteur : <span className="text-white font-medium capitalize">{capteur.type_mesure.replace(/_/g,' ')}</span>
          <span className="text-gray-500 ml-2">({capteur.unite})</span>
        </div>
      )}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Valeur minimum</label>
            <input type="number" step="any" className="input" placeholder="Ex: 20"
              value={form.valeurMin} onChange={e => setForm({...form, valeurMin: e.target.value})} />
            <p className="text-xs text-gray-600 mt-1">Alerte si valeur &lt; min</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Valeur maximum</label>
            <input type="number" step="any" className="input" placeholder="Ex: 40"
              value={form.valeurMax} onChange={e => setForm({...form, valeurMax: e.target.value})} />
            <p className="text-xs text-gray-600 mt-1">Alerte si valeur &gt; max</p>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Sévérité</label>
          <div className="grid grid-cols-4 gap-2">
            {SEVERITES.map(s => (
              <button key={s.value} type="button"
                onClick={() => setForm({...form, severite: s.value})}
                className={`py-2 rounded-lg text-xs font-medium transition-colors border ${
                  form.severite === s.value
                    ? `${s.color} border-current`
                    : 'bg-gray-800 text-gray-500 border-gray-700'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Durée dépassement (secondes)</label>
          <input type="number" min="0" className="input" value={form.dureeDepassement}
            onChange={e => setForm({...form, dureeDepassement: parseInt(e.target.value) || 0})} />
          <p className="text-xs text-gray-600 mt-1">0 = alerte immédiate</p>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Message personnalisé (optionnel)</label>
          <input className="input" placeholder="Ex: Irrigation nécessaire" value={form.message}
            onChange={e => setForm({...form, message: e.target.value})} />
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

export default function SeuilsPage() {
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'admin';
  const [capteurs, setCapteurs] = useState([]);
  const [seuils,   setSeuils]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data: fermes } = await getFermes();
      const allCapteurs = [];
      for (const ferme of fermes) {
        const { data: gws } = await getGateways(ferme.id).catch(() => ({ data: [] }));
        for (const gw of gws) {
          const { data: devs } = await getDevicesByGateway(gw.id).catch(() => ({ data: [] }));
          for (const dev of devs) {
            const { data: caps } = await getCapteurs(dev.id).catch(() => ({ data: [] }));
            allCapteurs.push(...caps.map(c => ({
              ...c, deviceNom: dev.nom || dev.device_uid, fermeNom: ferme.nom,
            })));
          }
        }
      }
      setCapteurs(allCapteurs);

      // Charger les seuils pour chaque capteur
      const seuilsMap = {};
      await Promise.all(allCapteurs.map(async c => {
        try {
          const { data } = await client.get(`/alertes/seuils?capteurId=${c.id}`);
          seuilsMap[c.id] = data;
        } catch { seuilsMap[c.id] = []; }
      }));
      setSeuils(seuilsMap);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(seuilId) {
    try {
      await client.delete(`/alertes/seuils/${seuilId}`);
      await load();
    } catch {}
  }

  const Icon = (type) => {
    const I = TYPE_ICONS[type] || Activity;
    return <I size={15} className="text-green-400" />;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-green-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {modal?.type === 'seuil' && (
        <SeuilModal
          seuil={modal.data}
          capteurId={modal.capteurId}
          capteur={capteurs.find(c => c.id === modal.capteurId)}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Seuils d'alerte</h1>
          <p className="text-gray-400 text-sm mt-1">Configurer les déclencheurs d'alertes par capteur</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Info box */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-yellow-300 flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>Une alerte se déclenche automatiquement quand la valeur d'un capteur dépasse les seuils définis ici.</span>
      </div>

      {capteurs.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">Aucun capteur configuré</div>
      ) : (
        <div className="space-y-3">
          {capteurs.map(capteur => {
            const capSeuils = seuils[capteur.id] || [];
            return (
              <div key={capteur.id} className="card space-y-3">
                {/* Capteur header */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
                    {Icon(capteur.type_mesure)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white capitalize">{capteur.type_mesure.replace(/_/g,' ')}</p>
                    <p className="text-xs text-gray-500">{capteur.deviceNom} · {capteur.fermeNom} · {capteur.unite}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setModal({ type: 'seuil', capteurId: capteur.id })}
                      className="btn-secondary text-xs flex items-center gap-1">
                      <Plus size={13} /> Seuil
                    </button>
                  )}
                </div>

                {/* Seuils existants */}
                {capSeuils.length === 0 ? (
                  <p className="text-xs text-gray-600 italic">Aucun seuil configuré</p>
                ) : (
                  <div className="space-y-2">
                    {capSeuils.map(seuil => {
                      const sev = SEVERITES.find(s => s.value === seuil.severite);
                      return (
                        <div key={seuil.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev?.color || 'text-gray-400'}`}>
                            {seuil.severite}
                          </span>
                          <div className="flex-1 text-xs text-gray-300 space-x-3">
                            {seuil.valeur_min !== null && <span>Min : <b>{seuil.valeur_min}{capteur.unite}</b></span>}
                            {seuil.valeur_max !== null && <span>Max : <b>{seuil.valeur_max}{capteur.unite}</b></span>}
                            {seuil.duree_depassement > 0 && <span className="text-gray-500">Délai : {seuil.duree_depassement}s</span>}
                            {seuil.message && <span className="text-gray-500 italic">"{seuil.message}"</span>}
                          </div>
                          <span className={`text-xs ${seuil.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                            {seuil.is_active ? '● actif' : '○ inactif'}
                          </span>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <button onClick={() => setModal({ type: 'seuil', capteurId: capteur.id, data: seuil })}
                                className="p-1 text-gray-500 hover:text-white transition-colors">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => handleDelete(seuil.id)}
                                className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
