import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { getLectures } from '../../api/capteurs';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const RANGES = [
  { label: '1h',  from: '-1h',  granularity: '1m'  },
  { label: '6h',  from: '-6h',  granularity: '5m'  },
  { label: '24h', from: '-24h', granularity: '15m' },
  { label: '7j',  from: '-168h',granularity: '1h'  },
];

export default function MultiCapteurChart({ capteurs = [] }) {
  const [range,   setRange]   = useState(RANGES[1]);
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!capteurs.length) return;
    setLoading(true);

    async function load() {
      try {
        const results = await Promise.all(
          capteurs.map(c => getLectures(c.id, { from: range.from, granularity: range.granularity })
            .then(r => ({ capteur: c, lectures: r.data }))
            .catch(() => ({ capteur: c, lectures: [] }))
          )
        );

        // Fusionner par timestamp
        const merged = {};
        results.forEach(({ capteur, lectures }) => {
          lectures.forEach(({ time, value }) => {
            const key = format(new Date(time), 'HH:mm');
            if (!merged[key]) merged[key] = { time: key };
            merged[key][capteur.type_mesure] = parseFloat(value?.toFixed(2));
          });
        });

        setData(Object.values(merged).sort((a, b) => a.time.localeCompare(b.time)));
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [capteurs.length, range.from]);

  if (!capteurs.length) return null;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-white">Historique multi-capteurs</h3>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r.label} onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                range.label === r.label ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>{r.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-gray-600" size={24} />
        </div>
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">Aucune donnée sur cette période</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} width={35} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
            {capteurs.map((c, i) => (
              <Line key={c.id} type="monotone" dataKey={c.type_mesure}
                stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                dot={false} name={`${c.type_mesure} (${c.unite})`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
