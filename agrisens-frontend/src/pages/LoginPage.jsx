import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants incorrects');
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
      padding: '20px',
    }}>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 2px 40px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        padding: '48px 44px',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(145deg, #34d058, #28a745)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 16px rgba(40,167,69,0.25)',
            fontSize: '26px',
          }}>🌱</div>

          <h1 style={{
            fontSize: '26px', fontWeight: '700',
            color: '#1d1d1f', margin: '0 0 6px',
            letterSpacing: '-0.5px',
          }}>
            AgriSens
          </h1>
          <p style={{
            fontSize: '15px', color: '#6e6e73',
            margin: 0, fontWeight: '400',
          }}>
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff2f2',
            border: '1px solid #ffd0d0',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#d70015',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div style={{
            background: '#f5f5f7',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid #e5e5ea',
          }}>
            {/* Email */}
            <div style={{ padding: '0 16px', borderBottom: '1px solid #e5e5ea' }}>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email" required
                style={{
                  width: '100%', padding: '14px 0',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '15px', color: '#1d1d1f',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {/* Password */}
            <div style={{ padding: '0 16px', position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe" required
                style={{
                  width: '100%', padding: '14px 36px 14px 0',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '15px', color: '#1d1d1f',
                  boxSizing: 'border-box',
                }}
              />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#aeaeb2', padding: 0, display: 'flex', alignItems: 'center',
                }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '15px',
              borderRadius: '14px', border: 'none',
              background: loading ? '#a8d5b5' : '#28a745',
              color: 'white', fontSize: '16px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              letterSpacing: '-0.2px',
              boxShadow: loading ? 'none' : '0 2px 12px rgba(40,167,69,0.30)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#22863a'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#28a745'; }}
          >
            {loading && <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

        </form>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: '28px',
          fontSize: '12px', color: '#aeaeb2',
          lineHeight: '1.5',
        }}>
          ESP Dakar · Africonnect+ · 2026
        </p>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #aeaeb2; }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
}
