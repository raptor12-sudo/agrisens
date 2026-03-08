import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDevice } from '../api/devices';
import { getCapteurs, getDerniere, getLectures } from '../api/capteurs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Activity, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ICONS = {
  temperature:    Thermometer,
  humidite_sol:   Droplets,
  humidite_air:   Droplets,
  default:        Activity,
};

function CapteurCard({ capteur }) {
  const [derniere, setDerniere] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: d }, { data: l }] = await Promise.all([
          getDerniere(capteur.id),
          getLectures(capteur.id, { from: '-6h', granularity: '5m' }),
        ]);
        setDerniere(d);
        setLectures(l.map(r => ({
          time:  format(new Date(r.time), 'HH:mm', { locale: fr }),
          value: parseFloat(r.value?.toFixed(2)),
        })));
      } catch {} finally { setLoading(false); }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [capteur.id]);

  const Icon = ICONS[capteur.type_mesure] || ICONS.default;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-agri-500/20 rounded-lg flex items-center justify-center">
            <Icon size={18} className="text-agri-400" />
          </div>
          <div>
            <p className="font-medium text-white capitalize">{capteur.type_mesure.replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-500">{capteur.influx_measurement}.{capteur.influx_field}</p>
          </div>
        </div>
        {derniere && (
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {parseFloat(derniere.derniere_valeur).toFixed(1)}
              <span className="text-sm text-gray-400 ml-1">{capteur.unite}</span>
            </p>
            <p className="text-xs text-gray-500">
              {derniere.influx_timestamp ? format(new Date(derniere.influx_timestamp), 'HH:mm:ss') : '—'}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-gray-600" size={20} />
        </div>
      ) : lectures.length > 0 ? (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={lectures}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} width={35} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#22c55e' }}
            />
            <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-sm text-center py-8">Aucune donnée disponible</p>
      )}
    </div>
  );
}

export default function DevicePage() {
  const { id } = useParams();
  const [device,   setDevice]   = useState(null);
  const [capteurs, setCapteurs] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: dev } = await getDevice(id);
        setDevice(dev);
        const { data: caps } = await getCapteurs(id);
        setCapteurs(caps);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-agri-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{device?.nom || device?.device_uid}</h1>
          <p className="text-gray-400 text-sm">UID : {device?.device_uid} · {device?.type_device}</p>
        </div>
        <span className={`ml-auto ${device?.statut === 'online' ? 'badge-online' : 'badge-offline'}`}>
          {device?.statut}
        </span>
      </div>

      {capteurs.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">
          Aucun capteur déclaré sur ce device
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {capteurs.map(c => <CapteurCard key={c.id} capteur={c} />)}
        </div>
      )}
    </div>
  );
}
