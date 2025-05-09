import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import GestionDesIncidents from './components/GestionDesIncidents';
import GestionUtilisateurs from './components/GestionUtilisateurs';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Chat from './components/Chat';
import './styles/global.css';
import Accueil from './components/Page Entrée';
import AjoutUtilisateur from './components/AjoutUtilisateur';
import AjoutIncident from './components/AjoutIncident';
import PowerBIReport from './components/PowerBIReport';
import Compte from './components/Compte';
import NotificationComponent from './components/Notification';

// Demander la permission pour les notifications
if (typeof window !== 'undefined' && 'Notification' in window) {
  if (window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
    window.Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }
}

// Composant PrivateRoute amélioré pour multi-sessions
function PrivateRoute({ children, allowedRoles }) {
  const sessionId = sessionStorage.getItem('sessionId');
  const token = sessionId ? localStorage.getItem(`token_${sessionId}`) : null;
  const role = sessionId ? localStorage.getItem(`role_${sessionId}`) : null;
  const statut = sessionId ? localStorage.getItem(`statut_${sessionId}`) : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (statut === "0") {
    return <Navigate to="/en-attente" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <NotificationComponent>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route
  path="/dashboard"
  element={
    <PrivateRoute allowedRoles={["utilisateur", "administrateur"]}>
      <PowerBIReport
        reportId="57ab8ae5d5a0ca32402c"
        embedUrl="https://app.powerbi.com/reportEmbed?reportId=57ab8ae5d5a0ca32402c&groupId=e48be6dc-3ed1-499c-8738-6101b497899a"
      />
    </PrivateRoute>
  }
/>

          <Route
            path="/home"
            element={
              <PrivateRoute allowedRoles={["utilisateur", "administrateur"]}>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestion-utilisateurs"
            element={
              <PrivateRoute allowedRoles={["administrateur"]}>
                <GestionUtilisateurs />
              </PrivateRoute>
            }
          />
          <Route
            path="/compte"
            element={
              <PrivateRoute allowedRoles={["utilisateur", "administrateur"]}>
                <Compte />
              </PrivateRoute>
            }
          />
          <Route
            path="/ajout-utilisateur"
            element={
              <PrivateRoute allowedRoles={["administrateur"]}>
                <AjoutUtilisateur />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestion-incidents"
            element={
              <PrivateRoute allowedRoles={["utilisateur", "administrateur"]}>
                <GestionDesIncidents />
              </PrivateRoute>
            }
          />
          <Route
            path="/ajout-incident"
            element={
              <PrivateRoute allowedRoles={["utilisateur", "administrateur"]}>
                <AjoutIncident />
              </PrivateRoute>
            }
          />
         
<Route
  path="/chat"
  element={
    <PrivateRoute allowedRoles={["utilisateur", "administrateur"]}>
      <Chat />
    </PrivateRoute>
  }
/>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </NotificationComponent>
    </Router>
  );
}

export default App;