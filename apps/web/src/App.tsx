import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
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

export default function App() {
  return (
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
      </Routes>
    </Layout>
  )
}
