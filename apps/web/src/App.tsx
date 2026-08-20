
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
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
import Annotations from './pages/Annotations'
import Resources from './pages/Resources'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminUsers from './pages/AdminUsers'
import AdminFeedback from './pages/AdminFeedback'
import SystemMonitoring from './pages/SystemMonitoring'
import About from './pages/About'

// Protected Route Component
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
        <Route path="/admin/usuarios" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/feedback" element={<ProtectedRoute requiredRole="admin"><AdminFeedback /></ProtectedRoute>} />
        <Route path="/admin/monitoring" element={<ProtectedRoute requiredRole="admin"><SystemMonitoring /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

