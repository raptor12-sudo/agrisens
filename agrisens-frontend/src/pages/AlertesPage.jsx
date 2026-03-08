import { useEffect, useState } from 'react';
import { getAlertes, acquitter, resoudre } from '../api/alertes';
import { AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SEV = { info:'badge-info', warning:'badge-warning', critical:'badge-critical', urgence:'badge-critical' };
const STA = { ouverte:'badge-critical', acquittee:'badge-warning', resolue:'badge-resolue', ignoree:'badge-offline' };

export default function AlertesPage() {
  const [alertes,  setAlertes]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ouverte');
  const [acting,   setActing]   = useState(null);

  async function load() {
    setLoading(true);
    try {
      const params = filter !== 'toutes' ? { statut: filter } : {};
      const { data } = await getAlertes(params);
      setAlertes(data);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter]);

  async function handleAcquitter(id) {
    setActing(id);
    try { await acquitter(id); await load(); } catch {} finally { setActing(null); }
  }

  async function handleResoudre(id) {
    setActing(id);
    try { await resoudre(id); await load(); } catch {} finally { setActing(null); }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alertes</h1>
          <p className="text-gray-400 text-sm mt-1">{alertes.length} alerte{alertes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['ouverte','acquittee','resolue','toutes'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === s ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-green-500" size={32} />
        </div>
      ) : alertes.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
          <p className="text-white font-medium">Aucune alerte {filter !== 'toutes' ? filter : ''}</p>
          <p className="text-gray-400 text-sm mt-1">Tout est nominal 🌱</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertes.map(alerte => (
            <div key={alerte.id} className="card flex items-start gap-4">
              <AlertTriangle size={20} className={
                ['critical','urgence'].includes(alerte.severite) ? 'text-red-400 mt-0.5 shrink-0' : 'text-yellow-400 mt-0.5 shrink-0'
              } />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={SEV[alerte.severite]}>{alerte.severite}</span>
                  <span className={STA[alerte.statut]}>{alerte.statut}</span>
                  <span className="text-xs text-gray-500">{alerte.device_uid} · {alerte.type_mesure}</span>
                </div>
                <p className="text-white text-sm">{alerte.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(alerte.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              {alerte.statut === 'ouverte' && (
                <button onClick={() => handleAcquitter(alerte.id)} disabled={acting === alerte.id}
                  className="btn-secondary text-xs shrink-0 flex items-center gap-1">
                  {acting === alerte.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Acquitter
                </button>
              )}
              {alerte.statut === 'acquittee' && (
                <button onClick={() => handleResoudre(alerte.id)} disabled={acting === alerte.id}
                  className="btn-primary text-xs shrink-0 flex items-center gap-1">
                  {acting === alerte.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Résoudre
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
