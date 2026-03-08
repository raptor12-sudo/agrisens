import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFermes } from '../api/fermes';
import { getGateways } from '../api/gateways';
import { getStats } from '../api/alertes';
import { Sprout, Wifi, AlertTriangle, Activity, ChevronRight, Loader2 } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function GatewayBadge({ statut }) {
  const map = {
    online:      'badge-online',
    offline:     'badge-offline',
    maintenance: 'badge-warning',
    erreur:      'badge-critical',
  };
  return <span className={map[statut] || 'badge-offline'}>{statut}</span>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [fermes,    setFermes]    = useState([]);
  const [gateways,  setGateways]  = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: fermesData } = await getFermes();
        setFermes(fermesData);

        // Charger les gateways de toutes les fermes
        const gwPromises = fermesData.map(f => getGateways(f.id).then(r => r.data).catch(() => []));
        const gwResults  = await Promise.all(gwPromises);
        setGateways(gwResults.flat());

        const { data: stats } = await getStats();
        setAlertStats(stats);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const gwOnline = gateways.filter(g => g.statut === 'online').length;

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-agri-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Vue d'ensemble de votre réseau IoT agricole</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Sprout}        label="Fermes actives"    value={fermes.length}      color="bg-agri-500/20 text-agri-400" />
        <StatCard icon={Wifi}          label="Gateways online"   value={`${gwOnline}/${gateways.length}`} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={Activity}      label="Capteurs actifs"   value={gateways.length * 2} color="bg-purple-500/20 text-purple-400" />
        <StatCard icon={AlertTriangle} label="Alertes ouvertes"  value={alertStats?.ouvertes || 0} color="bg-red-500/20 text-red-400" />
      </div>

      {/* Fermes */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Mes fermes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {fermes.map(ferme => (
            <div key={ferme.id} className="card hover:border-agri-700 transition-colors cursor-pointer group"
              onClick={() => navigate(`/?ferme=${ferme.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{ferme.nom}</h3>
                  <p className="text-sm text-gray-400">{ferme.localisation}</p>
                </div>
                <ChevronRight size={18} className="text-gray-600 group-hover:text-agri-500 transition-colors mt-0.5" />
              </div>
              <div className="flex gap-3 text-sm text-gray-400">
                {ferme.type_culture && <span className="bg-agri-500/10 text-agri-400 px-2 py-0.5 rounded text-xs">{ferme.type_culture}</span>}
                {ferme.superficie   && <span>{ferme.superficie} ha</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gateways */}
      {gateways.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Gateways</h2>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 px-5 py-3 font-medium">Nom</th>
                  <th className="text-left text-gray-400 px-5 py-3 font-medium">IP</th>
                  <th className="text-left text-gray-400 px-5 py-3 font-medium">Statut</th>
                  <th className="text-left text-gray-400 px-5 py-3 font-medium">Dernier heartbeat</th>
                </tr>
              </thead>
              <tbody>
                {gateways.map(gw => (
                  <tr key={gw.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-3 text-white font-medium">{gw.nom}</td>
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{gw.ip_address || '—'}</td>
                    <td className="px-5 py-3"><GatewayBadge statut={gw.statut} /></td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {gw.last_heartbeat ? new Date(gw.last_heartbeat).toLocaleString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
