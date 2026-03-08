import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFermes } from '../api/fermes';
import { getParcelles } from '../api/parcelles';
import { getCapteurs, getDerniere } from '../api/capteurs';
import { Sprout, ChevronRight, Thermometer, Droplets, Activity, Loader2 } from 'lucide-react';

const TYPE_ICON = { temperature: Thermometer, humidite_sol: Droplets, humidite_air: Droplets };

function CapteurBadge({ capteur }) {
  const [val, setVal] = useState(null);
  const Icon = TYPE_ICON[capteur.type_mesure] || Activity;

  useEffect(() => {
    getDerniere(capteur.id)
      .then(({ data }) => data?.derniere_valeur ? setVal(parseFloat(data.derniere_valeur).toFixed(1)) : null)
      .catch(() => {});
  }, [capteur.id]);

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
      <Icon size={14} className="text-green-400" />
      <span className="text-xs text-gray-300 capitalize">{capteur.type_mesure.replace(/_/g,' ')}</span>
      {val !== null && (
        <span className="text-xs font-bold text-white ml-auto">{val}{capteur.unite}</span>
      )}
    </div>
  );
}

function ParcelleCard({ parcelle, fermeNom }) {
  const [capteurs, setCapteurs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Chercher les capteurs via les devices de cette parcelle
    // Pour l'instant on affiche les infos de la parcelle
  }, [parcelle.id]);

  return (
    <div className="card hover:border-green-700 transition-colors cursor-pointer group"
      onClick={() => navigate(`/parcelles/${parcelle.id}`)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">{fermeNom}</p>
          <h3 className="font-semibold text-white">{parcelle.nom}</h3>
        </div>
        <ChevronRight size={16} className="text-gray-600 group-hover:text-green-500 transition-colors mt-1" />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-gray-400">
        {parcelle.type_culture && (
          <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded">{parcelle.type_culture}</span>
        )}
        {parcelle.surface && <span>{parcelle.surface} ha</span>}
        {parcelle.latitude && parcelle.longitude && (
          <span>📍 {parseFloat(parcelle.latitude).toFixed(4)}, {parseFloat(parcelle.longitude).toFixed(4)}</span>
        )}
      </div>
    </div>
  );
}

export default function ParcellesPage() {
  const [fermes,    setFermes]    = useState([]);
  const [parcelles, setParcelles] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: fs } = await getFermes();
        setFermes(fs);

        const all = [];
        for (const ferme of fs) {
          try {
            const { data: ps } = await getParcelles(ferme.id);
            all.push(...ps.map(p => ({ ...p, fermeNom: ferme.nom })));
          } catch {}
        }
        setParcelles(all);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-green-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Parcelles</h1>
        <p className="text-gray-400 text-sm mt-1">{parcelles.length} parcelle{parcelles.length !== 1 ? 's' : ''}</p>
      </div>

      {parcelles.length === 0 ? (
        <div className="card text-center py-16">
          <Sprout size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-white font-medium">Aucune parcelle</p>
          <p className="text-gray-400 text-sm mt-1">Créez d'abord une ferme avec des parcelles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {parcelles.map(p => <ParcelleCard key={p.id} parcelle={p} fermeNom={p.fermeNom} />)}
        </div>
      )}
    </div>
  );
}
