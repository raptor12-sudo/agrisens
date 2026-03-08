import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDevice } from '../api/devices';
import { getCapteurs, getDerniere, getLectures } from '../api/capteurs';
import MultiCapteurChart from '../components/charts/MultiCapteurChart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import {
  Thermometer, Droplets, Activity, Loader2,
  ArrowLeft, Battery, Wifi, RefreshCw, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRealtime } from '../hooks/useRealtime';

const ICONS = {
  temperature:    Thermometer,
  humidite_sol:   Droplets,
  humidite_air:   Droplets,
  ph:             Activity,
  conductivite:   Activity,
  luminosite:     Activity,
};

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const RANGES = [
  { label: '1h',  from: '-1h',   granularity: '1m'  },
  { label: '6h',  from: '-6h',   granularity: '5m'  },
  { label: '24h', from: '-24h',  granularity: '15m' },
  { label: '7j',  from: '-168h', granularity: '1h'  },
];

function Trend({ lectures }) {
  if (lectures.length < 2) return <Minus size={14} className="text-gray-500" />;
  const last  = lectures[lectures.length - 1]?.value;
  const prev  = lectures[lectures.length - 2]?.value;
  if (last > prev) return <TrendingUp  size={14} className="text-red-400" />;
  if (last < prev) return <TrendingDown size={14} className="text-green-400" />;
  return <Minus size={14} className="text-gray-500" />;
}

function CapteurCard({ capteur, index, isSelected, onSelect }) {
  const [derniere, setDerniere] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [range,    setRange]    = useState(RANGES[1]);
  const [loading,  setLoading]  = useState(true);

  const color = COLORS[index % COLORS.length];
  const Icon  = ICONS[capteur.type_mesure] || Activity;

  async function load() {
    try {
      const [{ data: d }, { data: l }] = await Promise.all([
        getDerniere(capteur.id),
        getLectures(capteur.id, { from: range.from, granularity: range.granularity }),
      ]);
      setDerniere(d?.derniere_valeur ? d : null);
      setLectures(l.map(r => ({
        time:  format(new Date(r.time), 'HH:mm'),
        value: parseFloat(r.value?.toFixed(2)),
      })));
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [capteur.id, range.from]);

  // Auto-refresh toutes les 30s
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [range.from]);

  const val = derniere ? parseFloat(derniere.derniere_valeur) : null;

  // Calcul min/max sur la période
  const valMin = lectures.length ? Math.min(...lectures.map(l => l.value)).toFixed(1) : null;
  const valMax = lectures.length ? Math.max(...lectures.map(l => l.value)).toFixed(1) : null;

  return (
    <div className={`card space-y-4 transition-all ${isSelected ? 'ring-2' : ''}`}
      style={{ '--tw-ring-color': color, borderColor: isSelected ? color : undefined }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <p className="font-medium text-white capitalize">{capteur.type_mesure.replace(/_/g,' ')}</p>
            <p className="text-xs text-gray-500">{capteur.influx_field}</p>
          </div>
        </div>
        <div className="text-right">
          {val !== null ? (
            <>
              <div className="flex items-center gap-1 justify-end">
                <Trend lectures={lectures} />
                <p className="text-2xl font-bold text-white">
                  {val.toFixed(1)}<span className="text-sm text-gray-400 ml-1">{capteur.unite}</span>
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {derniere?.influx_timestamp ? format(new Date(derniere.influx_timestamp), 'HH:mm:ss') : ''}
              </p>
            </>
          ) : (
            <p className="text-gray-500 text-sm">—</p>
          )}
        </div>
      </div>

      {/* Min / Max */}
      {valMin !== null && (
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1 text-blue-400">
            <TrendingDown size={12} /> Min <span className="font-bold">{valMin}{capteur.unite}</span>
          </div>
          <div className="flex items-center gap-1 text-red-400">
            <TrendingUp size={12} /> Max <span className="font-bold">{valMax}{capteur.unite}</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-gray-400">
            Moy <span className="font-bold">
              {lectures.length
                ? (lectures.reduce((s,l)=>s+l.value,0)/lectures.length).toFixed(1)
                : '—'}{capteur.unite}
            </span>
          </div>
        </div>
      )}

      {/* Range selector */}
      <div className="flex gap-1">
        {RANGES.map(r => (
          <button key={r.label} onClick={() => setRange(r)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              range.label === r.label
                ? 'text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            style={range.label === r.label ? { backgroundColor: color } : {}}>
            {r.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-gray-500 hover:text-white transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Graphique Area */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-gray-600" size={20} />
        </div>
      ) : lectures.length > 0 ? (
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={lectures}>
            <defs>
              <linearGradient id={`grad-${capteur.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} width={35}
              domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: `1px solid ${color}40`, borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color }}
            />
            {capteur.range_max && (
              <ReferenceLine y={parseFloat(capteur.range_max)} stroke="#ef4444"
                strokeDasharray="4 4" label={{ value: 'max', fill: '#ef4444', fontSize: 10 }} />
            )}
            {capteur.range_min && parseFloat(capteur.range_min) > -10 && (
              <ReferenceLine y={parseFloat(capteur.range_min)} stroke="#3b82f6"
                strokeDasharray="4 4" label={{ value: 'min', fill: '#3b82f6', fontSize: 10 }} />
            )}
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
              fill={`url(#grad-${capteur.id})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-sm text-center py-8">Aucune donnée sur cette période</p>
      )}
    </div>
  );
}

export default function DevicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device,   setDevice]   = useState(null);
  const [capteurs, setCapteurs] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: dev } = await getDevice(id);
        setDevice(dev);
        const { data: caps } = await getCapteurs(id);
        setCapteurs(caps);
        setSelected(caps.map(c => c.id)); // tout sélectionné par défaut
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-green-500" size={32} />
    </div>
  );

  const capteursSelectionnes = capteurs.filter(c => selected.includes(c.id));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{device?.nom || device?.device_uid}</h1>
          <p className="text-gray-400 text-sm">{device?.device_uid} · {device?.type_device}</p>
        </div>
        <div className="flex items-center gap-3">
          {device?.battery_level !== null && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Battery size={16} />
              <span>{device?.battery_level}%</span>
            </div>
          )}
          {device?.signal_strength !== null && device?.signal_strength && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Wifi size={16} />
              <span>{device?.signal_strength} dBm</span>
            </div>
          )}
          <span className={device?.statut === 'online' ? 'badge-online' : 'badge-offline'}>
            {device?.statut}
          </span>
        </div>
      </div>

      {capteurs.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">Aucun capteur déclaré</div>
      ) : (
        <>
          {/* Sélecteur de capteurs pour comparaison */}
          {capteurs.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Comparer :</span>
              {capteurs.map((c, i) => (
                <button key={c.id}
                  onClick={() => setSelected(prev =>
                    prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                  )}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    selected.includes(c.id) ? 'text-white border-transparent' : 'bg-transparent text-gray-400 border-gray-700'
                  }`}
                  style={selected.includes(c.id) ? { backgroundColor: COLORS[i], borderColor: COLORS[i] } : {}}>
                  {c.type_mesure.replace(/_/g,' ')}
                </button>
              ))}
            </div>
          )}

          {/* Graphique multi-capteurs comparatif */}
          {capteursSelectionnes.length > 1 && (
            <MultiCapteurChart capteurs={capteursSelectionnes} />
          )}

          {/* Cartes individuelles */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {capteurs.map((c, i) => (
              <CapteurCard key={c.id} capteur={c} index={i}
                isSelected={selected.includes(c.id)}
                onSelect={() => setSelected(prev =>
                  prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
