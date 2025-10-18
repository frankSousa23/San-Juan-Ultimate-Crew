import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DataProvider } from './contexts/DataContext'
import { ToastProvider } from './components/Toast'
import { DataInitializer } from './components/DataInitializer'
import Dashboard from './pages/Dashboard'
import Roster from './pages/Roster'
import Events from './pages/Events'
import Communications from './pages/Communications'
import Finances from './pages/Finances'
import Statistics from './pages/Statistics'
import Injuries from './pages/Injuries'
import Rivals from './pages/Rivals'
import Plays from './pages/Plays'
import RosterTorneo from './pages/RosterTorneo'
import Resources from './pages/Resources'
import Login from './pages/Login'
import Profile from './pages/Profile'
import AdminUsers from './pages/AdminUsers'

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <ToastProvider>
          <DataInitializer>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/roster" element={<Roster />} />
                <Route path="/eventos" element={<Events />} />
                <Route path="/comunicacion" element={<Communications />} />
                <Route path="/finanzas" element={<Finances />} />
                <Route path="/estadisticas" element={<Statistics />} />
                <Route path="/lesiones" element={<Injuries />} />
                <Route path="/rivales" element={<Rivals />} />
                <Route path="/jugadas" element={<Plays />} />
                <Route path="/roster-torneo" element={<RosterTorneo />} />
                <Route path="/recursos" element={<Resources />} />
                <Route path="/login" element={<Login />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/admin/usuarios" element={<AdminUsers />} />
              </Routes>
            </Layout>
          </DataInitializer>
        </ToastProvider>
      </DataProvider>
    </ErrorBoundary>
  )
}
