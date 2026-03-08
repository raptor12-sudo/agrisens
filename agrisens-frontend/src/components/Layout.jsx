import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Bell, LogOut, Sprout, MapPin,
  Users, Sun, Moon, Map, Cpu, Settings, Radio
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const isAdmin  = user?.role === 'admin';

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navSections = [
    {
      label: 'Principal',
      items: [
        { to: '/',            icon: LayoutDashboard, label: 'Dashboard',    end: true },
        { to: '/map',         icon: Map,             label: 'Carte réseau'            },
        { to: '/parcelles',   icon: MapPin,          label: 'Parcelles'               },
        { to: '/alertes',     icon: Bell,            label: 'Alertes'                 },
        { to: '/equipements', icon: Cpu,             label: 'Équipements'             },
      ],
    },
    ...(isAdmin ? [{
      label: 'Administration',
      items: [
        { to: '/users',  icon: Users,    label: 'Utilisateurs' },
        { to: '/seuils', icon: Settings, label: 'Seuils alertes'},
      ],
    }] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
          <Sprout className="text-green-500" size={24} />
          <span className="font-bold text-lg text-white">AgriSens</span>
          <button onClick={toggle} className="ml-auto text-gray-400 hover:text-white transition-colors">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map(({ to, icon: Icon, label, end }) => (
                  <NavLink key={to} to={to} end={end} className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}>
                    <Icon size={18} /> {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Profil */}
        <div className="px-3 py-4 border-t border-gray-800">
          <NavLink to="/profil" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors cursor-pointer ${
              isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-gray-500">{isAdmin ? '⚙️ Admin' : '🌾 Utilisateur'}</p>
            </div>
          </NavLink>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      <main style={{flex:1,overflow:"hidden",background:"#030712",display:"flex",flexDirection:"column",height:"100vh"}}>
        <div style={{flex:1,overflow:"auto",height:"100%",minHeight:0}}><Outlet /></div>
      </main>
    </div>
  );
}
