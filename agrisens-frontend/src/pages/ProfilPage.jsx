import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { User, Bell, Mail, Phone, MessageSquare, Smartphone, Check, Loader2, Shield, Save } from 'lucide-react';

function Toggle({ enabled, onChange, label, icon: Icon, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      <button onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function ProfilPage() {
  const { user } = useAuth();
  const [prefs,   setPrefs]   = useState({ email: true, sms: false, whatsapp: false, push: false });
  const [profil,  setProfil]  = useState({ prenom: '', nom: '', telephone: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await client.get('/notifications/prefs');
        setPrefs(data);
      } catch {}
      setProfil({
        prenom:    user?.prenom    || '',
        nom:       user?.nom       || '',
        telephone: user?.telephone || '',
      });
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSave() {
    setSaving(true);
    try {
      await client.put('/notifications/prefs', { ...prefs, telephone: profil.telephone });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {} finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-green-500" size={32} />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mon profil</h1>
        <p className="text-gray-400 text-sm mt-1">Informations et préférences de notification</p>
      </div>

      {/* Infos */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <User size={18} className="text-green-400" />
          <h2 className="font-semibold text-white">Informations personnelles</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{user?.prenom} {user?.nom}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
              user?.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {user?.role === 'admin' ? '⚙️ Administrateur' : '🌾 Utilisateur'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Prénom</label>
            <input className="input" value={profil.prenom}
              onChange={e => setProfil(p => ({ ...p, prenom: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nom</label>
            <input className="input" value={profil.nom}
              onChange={e => setProfil(p => ({ ...p, nom: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Téléphone (SMS / WhatsApp)</label>
          <input className="input" placeholder="+221 77 000 00 00" value={profil.telephone}
            onChange={e => setProfil(p => ({ ...p, telephone: e.target.value }))} />
        </div>
      </div>

      {/* Notifications */}
      <div className="card space-y-1">
        <div className="flex items-center gap-3 mb-4">
          <Bell size={18} className="text-green-400" />
          <h2 className="font-semibold text-white">Notifications d'alerte</h2>
        </div>
        <Toggle enabled={prefs.email}    onChange={v => setPrefs(p=>({...p,email:v}))}    icon={Mail}          label="Email"    description={user?.email} />
        <Toggle enabled={prefs.sms}      onChange={v => setPrefs(p=>({...p,sms:v}))}      icon={Phone}         label="SMS"      description={profil.telephone || 'Renseignez votre téléphone'} />
        <Toggle enabled={prefs.whatsapp} onChange={v => setPrefs(p=>({...p,whatsapp:v}))} icon={MessageSquare} label="WhatsApp" description="Via WhatsApp Business API" />
        <Toggle enabled={prefs.push}     onChange={v => setPrefs(p=>({...p,push:v}))}     icon={Smartphone}    label="Push navigateur" description="Notifications même onglet fermé" />
      </div>

      {/* Sécurité */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <Shield size={18} className="text-green-400" />
          <h2 className="font-semibold text-white">Sécurité</h2>
        </div>
        <p className="text-sm text-gray-400">Rôle : <span className="text-white font-medium">{user?.role}</span></p>
        <p className="text-xs text-gray-600 mt-1">Contactez un administrateur pour modifier votre rôle.</p>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
        {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
      </button>
    </div>
  );
}
