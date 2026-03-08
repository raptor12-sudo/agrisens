import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFermes } from '../api/fermes';
import { getGateways } from '../api/gateways';
import { getDevicesByGateway } from '../api/devices';
import { getCapteurs } from '../api/capteurs';
import client from '../api/client';
import GatewayModal from '../components/modals/GatewayModal';
import DeviceModal  from '../components/modals/DeviceModal';
import CapteurModal from '../components/modals/CapteurModal';
import {
  Radio, Cpu, Thermometer, Plus, Pencil, Trash2,
  Loader2, RefreshCw, ChevronDown, ChevronRight, Battery, Wifi
} from 'lucide-react';

function ConfirmDelete({ label, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
        <p className="text-white font-semibold mb-2">Supprimer ?</p>
        <p className="text-gray-400 text-sm mb-5">{label}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Annuler</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EquipementsPage() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [tree,    setTree]    = useState([]); // fermes → gateways → devices → capteurs
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const [modal,   setModal]   = useState(null); // { type, data, parentId }
  const [confirm, setConfirm] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data: fermes } = await getFermes();
      const result = [];
      for (const ferme of fermes) {
        const { data: gws } = await getGateways(ferme.id).catch(() => ({ data: [] }));
        const gwsWithDevices = [];
        for (const gw of gws) {
          const { data: devs } = await getDevicesByGateway(gw.id).catch(() => ({ data: [] }));
          const devsWithCapteurs = [];
          for (const dev of devs) {
            const { data: caps } = await getCapteurs(dev.id).catch(() => ({ data: [] }));
            devsWithCapteurs.push({ ...dev, capteurs: caps });
          }
          gwsWithDevices.push({ ...gw, devices: devsWithCapteurs });
        }
        result.push({ ...ferme, gateways: gwsWithDevices });
      }
      setTree(result);
      // Tout ouvrir par défaut
      const exp = {};
      result.forEach(f => { exp[f.id] = true; f.gateways?.forEach(g => { exp[g.id] = true; }); });
      setExpanded(exp);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(type, id) {
    try {
      await client.delete(`/${type}/${id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur suppression');
    }
    setConfirm(null);
  }

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })); }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-green-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {modal?.type === 'gateway' && <GatewayModal gateway={modal.data} fermeId={modal.parentId} onClose={() => setModal(null)} onSaved={load} />}
      {modal?.type === 'device'  && <DeviceModal  device={modal.data}  gatewayId={modal.parentId} onClose={() => setModal(null)} onSaved={load} />}
      {modal?.type === 'capteur' && <CapteurModal capteur={modal.data} deviceId={modal.parentId}  onClose={() => setModal(null)} onSaved={load} />}
      {confirm && <ConfirmDelete label={confirm.label} onConfirm={() => handleDelete(confirm.type, confirm.id)} onCancel={() => setConfirm(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Équipements IoT</h1>
          <p className="text-gray-400 text-sm mt-1">Gateways, Devices et Capteurs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} /></button>
          {isAdmin && (
            <button onClick={() => setModal({ type: 'gateway' })} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Gateway
            </button>
          )}
        </div>
      </div>

      {tree.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">Aucune ferme configurée</div>
      ) : (
        <div className="space-y-3">
          {tree.map(ferme => (
            <div key={ferme.id} className="card p-0 overflow-hidden">
              {/* Ferme header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-gray-800/50 cursor-pointer"
                onClick={() => toggle(ferme.id)}>
                {expanded[ferme.id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                <span className="text-lg">🌾</span>
                <span className="font-semibold text-white">{ferme.nom}</span>
                <span className="text-gray-500 text-sm">{ferme.localisation}</span>
                <span className="ml-auto text-xs text-gray-500">{ferme.gateways?.length || 0} gateway(s)</span>
                {isAdmin && (
                  <button onClick={e => { e.stopPropagation(); setModal({ type: 'gateway', parentId: ferme.id }); }}
                    className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/30">
                    + Gateway
                  </button>
                )}
              </div>

              {expanded[ferme.id] && (
                <div className="px-5 py-3 space-y-3">
                  {ferme.gateways?.length === 0 && (
                    <p className="text-gray-500 text-sm py-2">Aucune gateway</p>
                  )}
                  {ferme.gateways?.map(gw => (
                    <div key={gw.id} className="border border-gray-800 rounded-xl overflow-hidden">
                      {/* Gateway header */}
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-800/30 cursor-pointer"
                        onClick={() => toggle(gw.id)}>
                        {expanded[gw.id] ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                        <Radio size={16} className={gw.statut === 'online' ? 'text-purple-400' : 'text-gray-500'} />
                        <span className="font-medium text-white text-sm">{gw.nom}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${gw.statut === 'online' ? 'badge-online' : 'badge-offline'}`}>
                          {gw.statut}
                        </span>
                        {gw.ip_address && <span className="text-xs text-gray-500 font-mono">{gw.ip_address}</span>}
                        <span className="ml-auto text-xs text-gray-500">{gw.devices?.length || 0} device(s)</span>
                        {isAdmin && (
                          <div className="flex gap-1 ml-2">
                            <button onClick={e => { e.stopPropagation(); setModal({ type: 'device', parentId: gw.id }); }}
                              className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30">
                              + Device
                            </button>
                            <button onClick={e => { e.stopPropagation(); setModal({ type: 'gateway', data: gw }); }}
                              className="p-1 text-gray-500 hover:text-white"><Pencil size={13} /></button>
                            <button onClick={e => { e.stopPropagation(); setConfirm({ type: 'gateways', id: gw.id, label: `Supprimer ${gw.nom} ?` }); }}
                              className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>

                      {expanded[gw.id] && (
                        <div className="px-4 py-3 space-y-2">
                          {gw.devices?.length === 0 && <p className="text-gray-500 text-sm">Aucun device</p>}
                          {gw.devices?.map(dev => (
                            <div key={dev.id} className="border border-gray-700/50 rounded-lg overflow-hidden">
                              {/* Device header */}
                              <div className="flex items-center gap-3 px-3 py-2 bg-gray-800/20 cursor-pointer"
                                onClick={() => toggle(dev.id)}>
                                {expanded[dev.id] ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
                                <Cpu size={14} className={dev.statut === 'online' ? 'text-green-400' : 'text-gray-500'} />
                                <span className="text-sm font-medium text-white">{dev.nom || dev.device_uid}</span>
                                <span className="text-xs text-gray-500 font-mono">{dev.device_uid}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${dev.statut === 'online' ? 'badge-online' : 'badge-offline'}`}>
                                  {dev.statut}
                                </span>
                                {dev.battery_level !== null && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Battery size={12} />{dev.battery_level}%
                                  </div>
                                )}
                                <span className="ml-auto text-xs text-gray-500">{dev.capteurs?.length || 0} capteur(s)</span>
                                {isAdmin && (
                                  <div className="flex gap-1 ml-2">
                                    <button onClick={e => { e.stopPropagation(); setModal({ type: 'capteur', parentId: dev.id }); }}
                                      className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30">
                                      + Capteur
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); setModal({ type: 'device', data: dev }); }}
                                      className="p-1 text-gray-500 hover:text-white"><Pencil size={13} /></button>
                                    <button onClick={e => { e.stopPropagation(); setConfirm({ type: 'devices', id: dev.id, label: `Supprimer ${dev.nom || dev.device_uid} ?` }); }}
                                      className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={13} /></button>
                                  </div>
                                )}
                              </div>

                              {expanded[dev.id] && (
                                <div className="px-3 py-2 space-y-1.5">
                                  {dev.capteurs?.length === 0 && <p className="text-gray-500 text-xs">Aucun capteur</p>}
                                  {dev.capteurs?.map(cap => (
                                    <div key={cap.id} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-800/30">
                                      <Thermometer size={13} className="text-blue-400 shrink-0" />
                                      <span className="text-xs text-white capitalize">{cap.type_mesure.replace(/_/g,' ')}</span>
                                      <span className="text-xs text-gray-500">{cap.unite}</span>
                                      <span className="text-xs text-gray-600 font-mono">{cap.influx_field}</span>
                                      <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${cap.is_active ? 'badge-online' : 'badge-offline'}`}>
                                        {cap.is_active ? 'actif' : 'inactif'}
                                      </span>
                                      {isAdmin && (
                                        <div className="flex gap-1">
                                          <button onClick={() => setModal({ type: 'capteur', data: cap })}
                                            className="p-1 text-gray-500 hover:text-white"><Pencil size={12} /></button>
                                          <button onClick={() => setConfirm({ type: 'capteurs', id: cap.id, label: `Supprimer capteur ${cap.type_mesure} ?` })}
                                            className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
