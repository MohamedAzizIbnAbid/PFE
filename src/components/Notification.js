import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import io from 'socket.io-client';
import '../styles/Notification.css';

const getSessionId = () => sessionStorage.getItem('sessionId');

const getItem = key => {
  const sid = getSessionId();
  return sid ? localStorage.getItem(`${key}_${sid}`) : null;
};

const Notification = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const userEmail = getItem('email');
  const sessionId = getSessionId();

  useEffect(() => {
    const token = getItem('token');
    if (!token || !userEmail || !sessionId) {
      console.log('Connexion socket impossible : token, email ou sessionId manquant');
      return;
    }

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token, sessionId },
      reconnectionAttempts: 3,
    });

    socket.on('connect', () => {
      console.log(`Socket connecté pour ${userEmail} (session: ${sessionId})`);
    });

    socket.on('connect_error', (error) => {
      console.error(`Erreur de connexion socket pour ${userEmail}:`, error.message);
    });

    // Handle new account request notifications (for admin)
    socket.on('new_account_request', () => {
      if (getItem('role') === 'administrateur') {
        console.log('Reçu new_account_request');
        showNotification('Nouvelle demande d\'inscription reçue !');
      }
    });

    // Handle new chat message notifications
    socket.on('receive_message', (newMessage) => {
      if (newMessage.receiver === userEmail && newMessage.sender !== userEmail) {
        const messagePreview = newMessage.message.length > 30
          ? `${newMessage.message.substring(0, 30)}...`
          : newMessage.message;
        console.log(`Reçu receive_message de ${newMessage.sender}: ${messagePreview}`);
        showNotification(`Nouveau message de ${newMessage.sender}: ${messagePreview}`);
      }
    });

    // Handle new notification events
    socket.on('new_notification', ({ sender, message }) => {
      const messagePreview = message.length > 30
        ? `${message.substring(0, 30)}...`
        : message;
      console.log(`Reçu new_notification de ${sender}: ${messagePreview}`);
      showNotification(`Nouveau message de ${sender}: ${messagePreview}`);
    });

    // Handle new incident notifications
    socket.on('new_incident', ({ titre, gravite }) => {
      console.log(`Reçu new_incident: ${titre} (Gravité: ${gravite})`);
      showNotification(`Nouvel incident ajouté : ${titre} (Gravité: ${gravite})`);
    });

    return () => {
      console.log(`Déconnexion socket pour ${userEmail} (session: ${sessionId})`);
      socket.disconnect();
    };
  }, [userEmail, sessionId]);

  const showNotification = (message) => {
    if (Notification.permission === 'granted') {
      new Notification('Notification', {
        body: message,
        icon: '/logo192.png'
      });
    }

    const newNotification = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
    };
    
    console.log(`Affichage notification: ${message}`);
    setNotifications(prev => [...prev, newNotification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <div className="notification-container">
        {notifications.map(notification => (
          <div key={notification.id} className="notification-alert">
            <div className="notification-content">
              <span>{notification.message}</span>
              <span className="notification-timestamp">{notification.timestamp}</span>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="notification-dismiss"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        ))}
      </div>
      {children}
    </>
  );
};

export default Notification;