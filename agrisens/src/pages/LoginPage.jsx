import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', motDePasse: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.motDePasse);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-agri-600 rounded-2xl flex items-center justify-center mb-3">
            <Sprout size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AgriSens</h1>
          <p className="text-gray-400 text-sm mt-1">Monitoring agricole IoT</p>
        </div>

        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-5">Connexion</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <input type="email" className="input"
                placeholder="tidiane@agrisens.io"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Mot de passe</label>
              <input type="password" className="input"
                placeholder="••••••••"
                value={form.motDePasse}
                onChange={e => setForm({ ...form, motDePasse: e.target.value })}
                required />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
