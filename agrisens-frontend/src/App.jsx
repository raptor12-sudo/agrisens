import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import DevicePage      from './pages/DevicePage';
import AlertesPage     from './pages/AlertesPage';
import ParcellesPage   from './pages/ParcellesPage';
import AdminPage from './pages/AdminPage';
import UsersPage       from './pages/UsersPage';
import MapPage         from './pages/MapPage';
import ProfilPage      from './pages/ProfilPage';
import EquipementsPage from './pages/EquipementsPage';
import SeuilsPage      from './pages/SeuilsPage';
import Layout          from './components/Layout';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">Chargement...</div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index                element={<DashboardPage />} />
              <Route path="map"           element={<MapPage />} />
              <Route path="devices/:id"   element={<DevicePage />} />
              <Route path="parcelles"     element={<ParcellesPage />} />
              <Route path="parcelles/:id" element={<ParcellesPage />} />
              <Route path="alertes"       element={<AlertesPage />} />
              <Route path="equipements"   element={<EquipementsPage />} />
              <Route path="seuils"        element={<PrivateRoute adminOnly><SeuilsPage /></PrivateRoute>} />
              <Route path="profil"        element={<ProfilPage />} />
              <Route path="users"         element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
