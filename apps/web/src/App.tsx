
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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
import Profile from './pages/Profile'
import Login from './pages/Login'
import AdminUsers from './pages/AdminUsers'
import SystemMonitoring from './pages/SystemMonitoring'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (requiredRole && !hasRole(requiredRole) && !hasRole('admin')) {
    return <Navigate to="/" />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Public or Semi-Public Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Player & Admin Routes */}
        <Route path="/roster" element={<ProtectedRoute requiredRole="player"><Roster /></ProtectedRoute>} />
        <Route path="/eventos" element={<ProtectedRoute requiredRole="player"><Events /></ProtectedRoute>} />
        <Route path="/comunicacion" element={<ProtectedRoute requiredRole="player"><Communications /></ProtectedRoute>} />
        <Route path="/estadisticas" element={<ProtectedRoute requiredRole="player"><Statistics /></ProtectedRoute>} />
        <Route path="/lesiones" element={<ProtectedRoute requiredRole="player"><Injuries /></ProtectedRoute>} />
        <Route path="/rivales" element={<ProtectedRoute requiredRole="player"><Rivals /></ProtectedRoute>} />
        <Route path="/jugadas" element={<ProtectedRoute requiredRole="player"><Plays /></ProtectedRoute>} />
        <Route path="/roster-torneo" element={<ProtectedRoute requiredRole="player"><RosterTorneo /></ProtectedRoute>} />
        <Route path="/recursos" element={<ProtectedRoute requiredRole="player"><Resources /></ProtectedRoute>} />

        {/* Admin Only Routes */}
        <Route path="/finanzas" element={<ProtectedRoute requiredRole="admin"><Finances /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/monitoring" element={<ProtectedRoute requiredRole="admin"><SystemMonitoring /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  )
}

export default App

