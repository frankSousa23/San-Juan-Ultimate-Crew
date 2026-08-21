
import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/Layout'
import { FaultBoundary } from './components/FaultBoundary'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import About from './pages/About'

// Lazy loaded heavy components
const Roster = lazy(() => import('./pages/Roster'))
const Events = lazy(() => import('./pages/Events'))
const Communications = lazy(() => import('./pages/Communications'))
const Finances = lazy(() => import('./pages/Finances'))
const Statistics = lazy(() => import('./pages/Statistics'))
const Injuries = lazy(() => import('./pages/Injuries'))
const Rivals = lazy(() => import('./pages/Rivals'))
const Plays = lazy(() => import('./pages/Plays'))
const RosterTorneo = lazy(() => import('./pages/RosterTorneo'))
const Annotations = lazy(() => import('./pages/Annotations'))
const Resources = lazy(() => import('./pages/Resources'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminTeams = lazy(() => import('./pages/AdminTeams'))
const AdminFeedback = lazy(() => import('./pages/AdminFeedback'))
const SystemMonitoring = lazy(() => import('./pages/SystemMonitoring'))

// Protected Route Component - Maneja la protección de rutas basada en roles y la inyección de contexto Multi-Equipo
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  requiredRole?: string | string[];
  requiredPermission?: string;
}> = ({ 
  children, 
  requiredRole,
  requiredPermission
}) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Admin always has access
  if (hasRole('admin')) {
    return <>{children}</>
  }

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const hasRequiredRole = roles.some(role => hasRole(role))
    if (!hasRequiredRole) {
      return <Navigate to="/" />
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<div className="flex items-center justify-center h-[50vh]">Cargando módulo...</div>}>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Public or Semi-Public Routes - accessible to all authenticated users */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
        
        {/* Player, Captain, Coach, Directiva, Annotator & Admin Routes */}
        <Route path="/roster" element={<ProtectedRoute requiredRole={['player', 'captain', 'coach', 'admin', 'directiva', 'annotator', 'treasurer', 'guest']}><Roster /></ProtectedRoute>} />
        <Route path="/eventos" element={<ProtectedRoute requiredRole={['player', 'captain', 'coach', 'admin', 'directiva', 'annotator', 'treasurer', 'guest']}><Events /></ProtectedRoute>} />
        <Route path="/anotaciones" element={<ProtectedRoute requiredRole={['player', 'captain', 'coach', 'admin', 'directiva', 'annotator', 'guest']}><Annotations /></ProtectedRoute>} />
        {/* Communications: accessible to all authenticated users, but with different permissions */}
        <Route path="/comunicacion" element={<ProtectedRoute><Communications /></ProtectedRoute>} />
        {/* Statistics: accessible to all authenticated users (including guest for demo/showcase) */}
        <Route path="/estadisticas" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
        <Route path="/lesiones" element={<ProtectedRoute requiredRole={['player', 'captain', 'coach', 'admin', 'directiva', 'guest']}><Injuries /></ProtectedRoute>} />
        <Route path="/rivales" element={<ProtectedRoute requiredRole={['player', 'captain', 'coach', 'admin', 'directiva', 'annotator', 'guest']}><Rivals /></ProtectedRoute>} />
        <Route path="/jugadas" element={<ProtectedRoute requiredRole={['player', 'captain', 'coach', 'admin', 'directiva', 'guest']}><Plays /></ProtectedRoute>} />
        <Route path="/roster-torneo" element={<ProtectedRoute requiredRole={['player', 'captain', 'coach', 'admin', 'directiva', 'annotator', 'guest']}><RosterTorneo /></ProtectedRoute>} />
        <Route path="/recursos" element={<ProtectedRoute requiredRole={['player', 'coach', 'admin', 'directiva', 'captain', 'guest']}><Resources /></ProtectedRoute>} />

        {/* Treasurer & Admin Routes */}
        <Route path="/finanzas" element={<ProtectedRoute requiredRole={['treasurer', 'admin', 'directiva']}><Finances /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute requiredRole={['admin', 'directiva']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/equipos" element={<ProtectedRoute requiredRole={['admin', 'directiva']}><AdminTeams /></ProtectedRoute>} />
        <Route path="/admin/feedback" element={<ProtectedRoute requiredRole="admin"><AdminFeedback /></ProtectedRoute>} />
        <Route path="/admin/monitoring" element={<ProtectedRoute requiredRole="admin"><SystemMonitoring /></ProtectedRoute>} />

        {/* English / Alternative Route Aliases */}
        <Route path="/events" element={<Navigate to="/eventos" replace />} />
        <Route path="/communications" element={<Navigate to="/comunicacion" replace />} />
        <Route path="/news" element={<Navigate to="/comunicacion" replace />} />
        <Route path="/stats" element={<Navigate to="/estadisticas" replace />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

function App() {
  return (
    <FaultBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </FaultBoundary>
  )
}

export default App

