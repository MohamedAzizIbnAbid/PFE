import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUsers, FaComments, FaBug, FaChevronDown, FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import io from 'socket.io-client';
import axios from 'axios';
import '../styles/Navbar.css';
import LOGO from '../assets/téléchargement.png';
import notificationSound from '../assets/notification.mp3';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

const getSessionId = () => sessionStorage.getItem('sessionId');
const getItem = key => {
  const sid = getSessionId();
  return sid ? localStorage.getItem(`${key}_${sid}`) : null;
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState({
    role: getItem('role') || '',
    email: getItem('email') || '',
    username: getItem('name') || '',
    lastLogin: getItem('lastLogin') || ''
  });
  const [activeButton, setActiveButton] = useState(location.pathname);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingAccounts, setPendingAccounts] = useState(0); // New state for pending accounts
  const [scrolled, setScrolled] = useState(false);
  const [currentReceiver, setCurrentReceiver] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const socketRef = useRef(null);
  const audioRef = useRef(new Audio(notificationSound));

  // Format the lastLogin date
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Jamais connecté';
    try {
      const date = new Date(lastLogin);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de lastLogin:', error);
      return 'Date invalide';
    }
  };

  // Initialize user data and scroll handler
  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;

    const token = getItem('token');
    const role = getItem('role');
    const email = getItem('email');
    const username = getItem('name');
    const lastLogin = getItem('lastLogin');

    setUserData({
      role: role || '',
      email: email || '',
      username: username || '',
      lastLogin: formatLastLogin(lastLogin)
    });

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Preload audio
  useEffect(() => {
    audioRef.current.load();
  }, []);

  // Handle user interaction for audio
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    return () => document.removeEventListener('click', handleInteraction);
  }, []);

  const playNotificationAudio = () => {
    if (hasInteracted) {
      audioRef.current.play().catch(e => console.error('Erreur de lecture audio:', e));
    }
  };

  // Fetch initial unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = getItem('token');
        if (!token) return;
        const response = await api.get('/messages/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadMessages(response.data.unreadCount || 0);
        localStorage.setItem(`unreadMessages_${getSessionId()}`, response.data.unreadCount.toString());
      } catch (error) {
        console.error('Erreur lors de la récupération du nombre de messages non lus:', error);
      }
    };
    fetchUnreadCount();
  }, []);

  // Fetch initial pending account count (for admins only)
  useEffect(() => {
    const fetchPendingAccounts = async () => {
      try {
        const token = getItem('token');
        const role = getItem('role');
        if (!token || role !== 'administrateur') return;
        const response = await api.get('/utilisateurs/pending-count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPendingAccounts(response.data.pendingCount || 0);
        localStorage.setItem(`pendingAccounts_${getSessionId()}`, response.data.pendingCount.toString());
      } catch (error) {
        console.error('Erreur lors de la récupération du nombre de comptes en attente:', error);
      }
    };
    fetchPendingAccounts();
  }, []);

  // Socket.IO notifications
  useEffect(() => {
    const token = getItem('token');
    const role = getItem('role');
    if (!token) return;

    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnectionAttempts: 3
    });

    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    socketRef.current.on('new_notification', ({ sender, senderName, message }) => {
      const isInChatWithSender = location.pathname === '/chat' && currentReceiver === sender;
      if (!isInChatWithSender) {
        setUnreadMessages(prev => {
          const newCount = prev + 1;
          localStorage.setItem(`unreadMessages_${getSessionId()}`, newCount.toString());
          return newCount;
        });
        playNotificationAudio();

        if (Notification.permission === 'granted') {
          new Notification(`Nouveau message de ${senderName || sender}`, {
            body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
            icon: '/favicon.ico'
          });
        }
      }
    });

    // Listen for new account creation (for admins only)
    if (role === 'administrateur') {
      socketRef.current.on('new_account_request', () => {
        setPendingAccounts(prev => {
          const newCount = prev + 1;
          localStorage.setItem(`pendingAccounts_${getSessionId()}`, newCount.toString());
          return newCount;
        });
        playNotificationAudio();

        if (Notification.permission === 'granted') {
          new Notification('Nouvelle demande d\'inscription', {
            body: 'Une nouvelle demande de création de compte a été ajoutée.',
            icon: '/favicon.ico'
          });
        }
      });
    }

    socketRef.current.on('mark_as_seen', ({ messageIds, receiver }) => {
      if (receiver === userData.email) {
        setUnreadMessages(prev => {
          const newCount = Math.max(0, prev - messageIds.length);
          localStorage.setItem(`unreadMessages_${getSessionId()}`, newCount.toString());
          return newCount;
        });
      }
    });

    socketRef.current.on('current_receiver', ({ receiver }) => {
      setCurrentReceiver(receiver);
    });

    return () => {
      socketRef.current.off('new_notification');
      socketRef.current.off('new_account_request');
      socketRef.current.off('mark_as_seen');
      socketRef.current.off('current_receiver');
      socketRef.current.disconnect();
    };
  }, [location.pathname, userData.email]);

  // Reset unread count when navigating to /chat
  useEffect(() => {
    if (location.pathname === '/chat') {
      setUnreadMessages(0);
      localStorage.setItem(`unreadMessages_${getSessionId()}`, '0');
    }
    // Reset pending account count when navigating to /gestion-utilisateurs
    if (location.pathname === '/gestion-utilisateurs') {
      setPendingAccounts(0);
      localStorage.setItem(`pendingAccounts_${getSessionId()}`, '0');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    const sid = getSessionId();
    if (sid) {
      ['token', 'role', 'email', 'userId', 'name', 'lastLogin', 'unreadMessages', 'pendingAccounts'].forEach(k =>
        localStorage.removeItem(`${k}_${sid}`)
      );
      sessionStorage.removeItem('sessionId');
    }
    navigate('/login');
    window.location.reload();
  };

  const navigateTo = path => {
    setActiveButton(path);
    setIsMenuOpen(false);
    navigate(path);
  };

  const navItems = [
    { path: '/home', name: 'Accueil', icon: <FaHome />, visible: true },
    { path: '/dashboard', name: 'Tableau de bord', icon: <FaCog />, visible: true },
    { path: '/gestion-incidents', name: 'Incidents', icon: <FaBug />, visible: true },
    {
      path: '/gestion-utilisateurs',
      name: 'Utilisateurs',
      icon: (
        <div className="icon-with-badge">
          <FaUsers />
          {pendingAccounts > 0 && userData.role === 'administrateur' && (
            <span className="notification-badge">
              {pendingAccounts > 9 ? '9+' : pendingAccounts}
            </span>
          )}
        </div>
      ),
      visible: userData.role === 'administrateur'
    },
    {
      path: '/chat',
      name: 'Discussion',
      icon: (
        <div className="icon-with-badge">
          <FaComments />
          {unreadMessages > 0 && (
            <span className="notification-badge">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </div>
      ),
      visible: !!getItem('token')
    }
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigateTo('/home')}>
          <div className="logo">
            <span className="logo-icon">
              <img src={LOGO} alt="Dashboard Illustration" />
            </span>
          </div>
          <span className="app-name">WebReport</span>
        </div>

        <div className="navbar-links">
          {navItems.filter(i => i.visible).map(i => (
            <button
              key={i.path}
              onClick={() => navigateTo(i.path)}
              className={`nav-button ${activeButton === i.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{i.icon}</span>
              {i.name}
            </button>
          ))}
        </div>

        <div className="navbar-user-section">
          {userData.email && (
            <div className="user-dropdown" ref={dropdownRef}>
              <button
                className="user-button"
                onClick={e => {
                  e.stopPropagation();
                  setShowUserDropdown(s => !s);
                }}
              >
                <FaUserCircle className="user-avatar" />
                <span className="username">
                  {userData.username || userData.email.split('@')[0]}
                </span>
                <FaChevronDown className={`dropdown-arrow ${showUserDropdown ? 'rotate' : ''}`} />
              </button>

              {showUserDropdown && (
                <div className="dropdown-menu">
                  <div className="user-info">
                    <FaUserCircle className="dropdown-avatar" />
                    <div>
                      <button onClick={() => navigate("/compte")} className="button button-ajouter">
                        Consulter le profil
                      </button>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="last-login">
                    <span>Dernière connexion :</span>
                    <span className="login-time">{userData.lastLogin}</span>
                  </div>
                  <button onClick={handleLogout} className="logout-button">
                    <FaSignOutAlt /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className={`mobile-menu-button ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen(s => !s)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="mobile-menu" ref={mobileMenuRef}>
          {navItems.filter(i => i.visible).map(i => (
            <button
              key={i.path}
              onClick={() => navigateTo(i.path)}
              className={`mobile-nav-button ${activeButton === i.path ? 'active' : ''}`}
            >
              <span className="mobile-nav-icon">{i.icon}</span>
              {i.name}
            </button>
          ))}
          {!!getItem('token') && (
            <button onClick={handleLogout} className="mobile-logout-button">
              <FaSignOutAlt /> Déconnexion
            </button>
          )}
        </div>
      )}
    </nav>
  );
}