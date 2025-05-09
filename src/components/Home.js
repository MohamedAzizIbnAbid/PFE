import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import Navbar from './Navbar';
import dashboardIllustration from '../assets/dashboard-illustration.jpg';
import heroBackground from '../assets/hero-bg.jpg';
import feature1Icon from '../assets/feature1.svg';
import feature2Icon from '../assets/feature2.svg';
import feature3Icon from '../assets/feature3.svg';
import feature4Icon from '../assets/feature4.svg';
import avatarPlaceholder from '../assets/avatar-placeholder.png';
import FacebookIcon from '../assets/facebook.jpg';
import LinkedInIcon from '../assets/linkedin.jpg';
import featureProfileIcon from '../assets/user settings.png'; // ajuste le chemin selon ta structure

const getSessionId = () => sessionStorage.getItem('sessionId');

const getItem = key => {
  const sid = getSessionId();
  return sid ? localStorage.getItem(`${key}_${sid}`) : null;
};

const Home = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    role: '',
    name: '',
    email: '',
    isAdmin: false,
    lastLogin: ''
  });

  useEffect(() => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      navigate('/login');
      return;
    }
  
    const token = localStorage.getItem(`token_${sessionId}`);
    const role = localStorage.getItem(`role_${sessionId}`);
    const name = localStorage.getItem(`name_${sessionId}`);
    const email = localStorage.getItem(`email_${sessionId}`);
    const lastLogin = localStorage.getItem(`lastLogin_${sessionId}`);
  
    if (!token) {
      navigate('/login');
      return;
    }

    setUserData({
      role: role || '',
      name: name || '',
      email: email || '',
      isAdmin: role === 'administrateur',
      lastLogin: lastLogin || ''
    });
  }, [navigate]);

  // Format the lastLogin date using native JavaScript
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Jamais connecté';
    return lastLogin;
  };

  return (
    <div className="app-container">
      <Navbar />
      
      <div className="content-container">
        {/* Hero Section */}
        <section className="hero-section" style={{ backgroundImage: `linear-gradient(rgba(0, 51, 102, 0.8), rgba(0, 91, 159, 0.8)), url(${heroBackground})` }}>
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">Bienvenue, <span className="user-name">{userData.name || 'Utilisateur'}</span></h1>
              <p className="hero-subtitle">Plateforme WebReport - Optimisez votre gestion des données</p>
              <p className="hero-description">
                Accédez à des outils puissants pour analyser, suivre et améliorer vos processus métiers
              </p>
              <button 
                className="hero-cta" 
                onClick={() => navigate('/dashboard')}
              >
                Accéder au tableau de bord
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            
            <div className="user-card">
              <div className="user-info">
                <div className="user-avatar">
                  <img src={avatarPlaceholder} alt="Avatar" />
                </div>
                <div className="user-details">
                  <h3>{userData.name || 'Utilisateur'}</h3>
                  <p className="user-role">{userData.role || 'Rôle non spécifié'}</p>
                  <p className="user-email">{userData.email}</p>
                  <p className="last-login">Dernière connexion: {formatLastLogin(userData.lastLogin)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-illustration">
            <img src={dashboardIllustration} alt="Dashboard Illustration" />
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-header">
            <h2 className="section-title">Fonctionnalités Principales</h2>
            <p className="section-subtitle">Découvrez les outils puissants de WebReport</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <img src={feature1Icon} alt="Dashboard Icon" />
              </div>
              <h3>Tableau de bord intelligent</h3>
              <p>Visualisations interactives et indicateurs clés pour une prise de décision éclairée</p>
              <button 
                className="feature-button"
                onClick={() => navigate('/dashboard')}
              >
                Explorer <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <img src={feature2Icon} alt="Incidents Icon" />
              </div>
              <h3>Gestion des Incidents</h3>
              <p>Suivi en temps réel, notifications et résolution collaborative des problèmes</p>
              <button 
                className="feature-button"
                onClick={() => navigate('/gestion-incidents')}
              >
                Gérer <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            
            <div className="feature-card">
  <div className="feature-icon">
    <img src={featureProfileIcon} alt="Profil Icon" />
  </div>
  <h3>Gérer le profil</h3>
  <p>Consulter et modifiez vos informations personnelles</p>
  <button 
    className="feature-button"
    onClick={() => navigate('/compte')}
  >
    Modifier le profil <i className="fas fa-chevron-right"></i>
  </button>
</div>


            <div className="feature-card">
              <div className="feature-icon">
                <img src={feature3Icon} alt="Communication Icon" />
              </div>
              <h3>Communication unifiée</h3>
              <p>Messagerie instantanée, partage de fichiers et espaces collaboratifs</p>
              <button 
                className="feature-button"
                onClick={() => navigate('/chat')}
              >
                Communiquer <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            
            {userData.isAdmin && (
              <div className="feature-card">
                <div className="feature-icon">
                  <img src={feature4Icon} alt="Admin Icon" />
                </div>
                <h3>Administration centrale</h3>
                <p>Gestion des utilisateurs, permissions et configurations système</p>
                <button 
                  className="feature-button"
                  onClick={() => navigate('/gestion-utilisateurs')}
                >
                  Administrer <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <div className="section-header">
            <h2 className="section-title">Accès Rapide</h2>
            <p className="section-subtitle">Actions fréquentes en un clic</p>
          </div>
          
          <div className="actions-grid">
            <button 
              className="action-button" 
              onClick={() => navigate('/dashboard')}
            >
              <div className="action-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <span>Tableau de bord</span>
            </button>
            
            <button 
              className="action-button" 
              onClick={() => navigate('/gestion-incidents')}
            >
              <div className="action-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <span>Nouvel incident</span>
            </button>

            <button 
              className="action-button" 
              onClick={() => navigate('/compte')}
            >
              <div className="action-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <span>Consulter votre profil</span>
            </button>
            
            <button 
              className="action-button" 
              onClick={() => navigate('/chat')}
            >
              <div className="action-icon">
                <i className="fas fa-comments"></i>
              </div>
              <span>Messagerie</span>
            </button>
            
            {userData.isAdmin && (
              <button 
                className="action-button" 
                onClick={() => navigate('/gestion-utilisateurs')}
              >
                <div className="action-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <span>Administration</span>
              </button>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>WebReport</h3>
              <p>Votre solution complète de business intelligence et gestion opérationnelle</p>
              <div className="footer-section">
                <h3>Réseaux Sociaux</h3>
                <div className="social-icons">
                  <a href="https://www.linkedin.com/company/leoni/" aria-label="LinkedIn">
                    <img src={LinkedInIcon} alt="LinkedIn" />
                  </a>
                  <a href="https://www.facebook.com/LEONI.tunisia" aria-label="Facebook">
                    <img src={FacebookIcon} alt="Facebook" />
                  </a>
                </div>
              </div>
            </div>
            <div className="copyright">
              © {new Date().getFullYear()} WebReport. Tous droits réservés.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;