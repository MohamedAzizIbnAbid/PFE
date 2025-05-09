import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Chat.css';
import Navbar from './Navbar';
import notificationSound from '../assets/notification.mp3';

const getSessionId = () => sessionStorage.getItem('sessionId');

const getItem = key => {
  const sid = getSessionId();
  return sid ? localStorage.getItem(`${key}_${sid}`) : null;
};

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Chat = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    email: '',
    name: '',
    isAdmin: false
  });
  const [messageInputValue, setMessageInputValue] = useState('');
  const [messagesList, setMessagesList] = useState([]);
  const [currentReceiver, setCurrentReceiver] = useState('');
  const [userContacts, setUserContacts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchResultsList, setSearchResultsList] = useState([]);
  const [shouldShowSearchResults, setShouldShowSearchResults] = useState(false);
  const [showDeleteMessageConfirmation, setShowDeleteMessageConfirmation] = useState(false);
  const [showDeleteConversationConfirmation, setShowDeleteConversationConfirmation] = useState(false);
  const [pendingMessageId, setPendingMessageId] = useState(null);
  const [notificationList, setNotificationList] = useState([]);
  const [typingStatus, setTypingStatus] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastSeen, setLastSeen] = useState({});

  const socketInstance = useRef(null);
  const messagesEndRef = useRef(null);
  const searchResultsContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sessionId = getSessionId();

  // Vérification de l'authentification et récupération des données utilisateur
  useEffect(() => {
    if (!sessionId) {
      navigate('/login');
      return;
    }

    const token = getItem('token');
    const role = getItem('role');
    const statut = getItem('statut');
    const name = getItem('name');
    const email = getItem('email');

    if (!token) {
      navigate('/login');
      return;
    }

    if (statut === "0") {
      navigate('/en-attente');
      return;
    }

    setUserData({
      email: email || '',
      name: name || '',
      isAdmin: role === 'administrateur'
    });
  }, [navigate, sessionId]);

  const playNotificationAudio = () => {
    const audio = new Audio(notificationSound);
    audio.play().catch(e => console.error('Erreur de lecture audio', e));
  };

  const displayNewNotification = useCallback((text, sender) => {
    const newNotificationItem = {
      id: Date.now(),
      text: `${sender}: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
      timestamp: new Date()
    };
    setNotificationList(prev => [...prev, newNotificationItem]);
    playNotificationAudio();
    setTimeout(() => {
      setNotificationList(prev => prev.filter(n => n.id !== newNotificationItem.id));
    }, 5000);
  }, []);

  const handleUserSearch = useCallback(async () => {
    if (searchInputValue.length < 2) {
      setSearchResultsList([]);
      setShouldShowSearchResults(false);
      return;
    }
    try {
      const response = await api.get(`messages/search-users?query=${searchInputValue}`);
      setSearchResultsList(response.data);
      setShouldShowSearchResults(true);
    } catch (error) {
      setErrorMessage('Échec de la recherche d\'utilisateurs');
      setSearchResultsList([]);
      setShouldShowSearchResults(true);
    }
  }, [searchInputValue]);

  const handleDocumentClick = useCallback((event) => {
    if (searchResultsContainerRef.current && !searchResultsContainerRef.current.contains(event.target)) {
      setShouldShowSearchResults(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [handleDocumentClick]);

  const deleteSelectedMessage = useCallback(async (messageId) => {
    setPendingMessageId(messageId);
    setShowDeleteMessageConfirmation(true);
  }, []);

  const confirmDeleteMessage = useCallback(async () => {
    try {
      setIsLoadingData(true);
      await api.delete(`messages/${pendingMessageId}`);
      
      setMessagesList(prev => prev.filter(msg => msg.id !== pendingMessageId));
      
      socketInstance.current.emit('delete_message', { messageId: pendingMessageId }, (response) => {
        if (response.status === 'error') {
          setErrorMessage(response.message);
        }
      });
      
      setConfirmationMessage('Message supprimé avec succès !');
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 1500);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setErrorMessage(error.response?.data?.error || 'Échec de la suppression du message');
    } finally {
      setShowDeleteMessageConfirmation(false);
      setPendingMessageId(null);
      setIsLoadingData(false);
    }
  }, [pendingMessageId]);

  const confirmDeleteConversation = useCallback(() => {
    socketInstance.current.emit('delete_conversation', { receiver: currentReceiver }, (response) => {
      if (response.status === 'success') {
        setMessagesList([]);
        setCurrentReceiver('');
        setConfirmationMessage('Conversation supprimée avec succès !');
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 1500);
      } else {
        setErrorMessage(response.message || 'Échec de la suppression de la conversation');
      }
    });
    setShowDeleteConversationConfirmation(false);
  }, [currentReceiver]);

  const handleTyping = useCallback(() => {
    if (!currentReceiver) return;
    
    socketInstance.current.emit('typing', { to: currentReceiver });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socketInstance.current.emit('stop_typing', { to: currentReceiver });
    }, 2000);
  }, [currentReceiver]);

  // Initialisation du socket et gestion des événements
  useEffect(() => {
    const authToken = getItem('token');
    if (!authToken || !userData.email || !sessionId) return;

    socketInstance.current = io('http://localhost:5000', {
      auth: { token: authToken, sessionId },
      reconnectionAttempts: 3
    });

    socketInstance.current.on('connect', () => {
      console.log('Connecté au serveur de chat');
    });

    socketInstance.current.on('receive_message', (newMessage) => {
      const isCurrentConversation = 
        (newMessage.sender === currentReceiver && newMessage.receiver === userData.email) ||
        (newMessage.sender === userData.email && newMessage.receiver === currentReceiver);
      
      if (isCurrentConversation) {
        setMessagesList(prev => [...prev, newMessage]);
        
        if (newMessage.sender === currentReceiver && newMessage.receiver === userData.email) {
          socketInstance.current.emit('mark_as_seen', {
            messageIds: [newMessage.id],
            receiver: currentReceiver
          });
        }
      
      } else if (newMessage.sender !== userData.email) {
        displayNewNotification(newMessage.message, newMessage.sender);
      }
    });

    socketInstance.current.on('message_deleted', ({ messageId }) => {
      setMessagesList(prev => prev.filter(msg => msg.id !== messageId));
    });

    socketInstance.current.on('user_typing', ({ from }) => {
      if (from === currentReceiver) {
        setTypingStatus(`${from} est en train d'écrire...`);
      }
    });

    socketInstance.current.on('user_stop_typing', ({ from }) => {
      if (from === currentReceiver) {
        setTypingStatus('');
      }
    });

    socketInstance.current.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    socketInstance.current.on('user_online', (email) => {
      setOnlineUsers(prev => [...prev, email]);
    });

    socketInstance.current.on('user_offline', (email) => {
      setOnlineUsers(prev => prev.filter(user => user !== email));
      setLastSeen(prev => ({
        ...prev,
        [email]: new Date().toISOString()
      }));
    });

    socketInstance.current.on('last_seen', ({ email, lastSeen: seen }) => {
      setLastSeen(prev => ({
        ...prev,
        [email]: seen
      }));
    });

    socketInstance.current.on('connect_error', (err) => {
      setErrorMessage('Échec de la connexion au chat');
      console.error('Erreur de connexion:', err);
    });

    return () => {
      if (socketInstance.current) socketInstance.current.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [navigate, currentReceiver, userData.email, displayNewNotification, sessionId]);

  // Chargement des contacts
  useEffect(() => {
    if (!userData.email) return;

    const fetchUserContacts = async () => {
      try {
        setIsLoadingData(true);
        const response = await api.get('messages/contacts');
        
        const lastSeenResponses = await Promise.all(
          response.data.map(contact => 
            api.get(`users/last-seen/${contact.email}`).catch(() => null)
          )
        );
        
        const lastSeenData = {};
        lastSeenResponses.forEach((res, index) => {
          if (res && res.data) {
            lastSeenData[response.data[index].email] = res.data.lastSeen;
          }
        });
        
        setLastSeen(lastSeenData);
        setUserContacts(response.data);
      } catch (err) {
        setErrorMessage('Échec du chargement des contacts');
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchUserContacts();
  }, [userData.email]);

  const initiateChatSession = useCallback(async (contactEmail) => {
    if (!contactEmail || !userData.email) {
      setErrorMessage('Veuillez sélectionner un contact valide');
      return;
    }
    setCurrentReceiver(contactEmail);
    setIsLoadingData(true);
    setShouldShowSearchResults(false);
    try {
      const response = await api.get(`messages/conversation/${contactEmail}`);
      
      const formattedMessages = response.data.map(msg => ({
        ...msg,
        date: new Date(msg.date),
        is_seen: msg.sender === userData.email ? msg.is_seen : true
      }));
      
      setMessagesList(formattedMessages);
      
      const unreadMessages = formattedMessages.filter(
        msg => msg.sender === contactEmail && !msg.is_seen
      );
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id);
        socketInstance.current.emit('mark_as_seen', {
          messageIds,
          receiver: contactEmail
        });
      }
    } catch (err) {
      setErrorMessage('Échec du chargement de la conversation');
    } finally {
      setIsLoadingData(false);
    }
  }, [userData.email]);

  const sendChatMessage = useCallback(() => {
    if (!messageInputValue.trim()) {
      setErrorMessage('Le message ne peut pas être vide');
      return;
    }
    if (!currentReceiver) {
      setErrorMessage('Aucun destinataire sélectionné');
      return;
    }
    setIsSendingMessage(true);
    socketInstance.current.emit(
      'send_message',
      { receiver: currentReceiver, message: messageInputValue },
      (response) => {
        setIsSendingMessage(false);
        if (response.status === 'success') {
          setMessageInputValue('');
          setErrorMessage('');
        } else {
          setErrorMessage(response.message);
        }
      }
    );
  }, [messageInputValue, currentReceiver]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList]);

  const formatLastSeen = (email) => {
    if (onlineUsers.includes(email)) {
      return 'En ligne';
    }
    if (lastSeen[email]) {
      const lastSeenDate = new Date(lastSeen[email]);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
      
      if (diffMinutes < 1) return 'À l\'instant';
      if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
      if (diffMinutes < 1440) return `Aujourd'hui à ${lastSeenDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      return lastSeenDate.toLocaleDateString([], {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'});
    }
    return 'Déconnecté';
  };

  if (!userData.email) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="chat-module__container">
      <Navbar />
      
      {/* Message de confirmation */}
      {showConfirmation && (
        <div className="account-confirmation">
          <div className="confirmation-content">
            <p>{confirmationMessage}</p>
          </div>
        </div>
      )}

      <div className="notification-module__container">
        {notificationList.map(notification => (
          <div key={notification.id} className="notification-module__item">
            <div className="notification-module__header">Nouveau message</div>
            <div className="notification-module__content">{notification.text}</div>
          </div>
        ))}
      </div>
      
      <div className="chat-module__layout">
        <div className="contacts-panel__container">
          <div className="contacts-panel__header">
            <span>Contacts</span>
          </div>
          
          <div className="search-module__container">
            <input
              type="text"
              placeholder="Rechercher des contacts..."
              value={searchInputValue}
              onChange={(e) => {
                setSearchInputValue(e.target.value);
                if (e.target.value.length === 0) {
                  setShouldShowSearchResults(false);
                }
              }}
              onKeyUp={(e) => e.key === 'Enter' && handleUserSearch()}
              className="search-module__input"
            />
            <button 
              onClick={handleUserSearch}
              className="search-module__button"
            >
              🔍
            </button>
          </div>

          <div className="contacts-list__container">
            {searchInputValue && shouldShowSearchResults && (
              <div 
                className={`search-results__container ${shouldShowSearchResults ? 'search-results__container--visible' : ''}`}
                ref={searchResultsContainerRef}
              >
                {searchResultsList.length > 0 ? (
                  <>
                    <h4 className="search-results__title">Résultats ({searchResultsList.length})</h4>
                    {searchResultsList.map(user => (
                      <div
                        key={user.email}
                        className="contact-item__container"
                        onClick={() => {
                          initiateChatSession(user.email);
                          setSearchInputValue('');
                          setSearchResultsList([]);
                        }}
                      >
                        <div className="contact-item__avatar">
                          {user.nom_utilisateur.charAt(0)}
                        </div>
                        <div className="contact-item__info">
                          <h4 className="contact-item__name">{user.nom_utilisateur}</h4>
                          <p className="contact-item__email">{user.email}</p>
                          <p className="contact-item__status">
                            {onlineUsers.includes(user.email) ? (
                              <span className="online-status">En ligne</span>
                            ) : (
                              <span className="offline-status">
                                {formatLastSeen(user.email)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="search-results__empty">
                    Aucun contact trouvé pour "{searchInputValue}"
                  </div>
                )}
              </div>
            )}

            {isLoadingData ? (
              <div className="loading-indicator__container">
                <div className="loading-indicator__spinner"></div>
                Chargement des contacts...
              </div>
            ) : (
              userContacts.map(contact => (
                <div
                  key={contact.email}
                  className={`contact-item__container ${currentReceiver === contact.email ? 'contact-item__container--active' : ''}`}
                  onClick={() => initiateChatSession(contact.email)}
                >
                  <div className="contact-item__avatar">
                    {contact.nom_utilisateur.charAt(0)}
                    {onlineUsers.includes(contact.email) && (
                      <span className="online-badge"></span>
                    )}
                  </div>
                  <div className="contact-item__info">
                    <h4 className="contact-item__name">
                      {contact.nom_utilisateur}
                      {messagesList.some(msg => 
                        msg.sender === contact.email && !msg.is_seen
                      ) && (
                        <span className="unread-badge"></span>
                      )}
                    </h4>
                    <p className="contact-item__email">{contact.email}</p>
                    <p className="contact-item__status">
                      {onlineUsers.includes(contact.email) ? (
                        <span className="online-status">En ligne</span>
                      ) : (
                        <span className="offline-status">
                          {formatLastSeen(contact.email)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="contact-item__timestamp">
                    {contact.lastMessageTime && new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="conversation-panel__container">
          {currentReceiver ? (
            <>
              <div className="conversation-header__container">
                <div className="conversation-header__avatar">
                  {currentReceiver.charAt(0).toUpperCase()}
                  {onlineUsers.includes(currentReceiver) && (
                    <span className="online-badge"></span>
                  )}
                </div>
                <div className="conversation-header__info">
                  <h3 className="conversation-header__title">
                    Discussion avec {currentReceiver}
                  </h3>
                  <p className="conversation-header__status">
                    {onlineUsers.includes(currentReceiver) ? (
                      <span className="online-status">En ligne</span>
                    ) : (
                      <span className="offline-status">
                        {formatLastSeen(currentReceiver)}
                      </span>
                    )}
                    {typingStatus && (
                      <span className="typing-status">{typingStatus}</span>
                    )}
                  </p>
                </div>
                <div className="conversation-header__actions">
                  <button 
                    title="Supprimer la conversation" 
                    className="conversation-header__button"
                    onClick={() => setShowDeleteConversationConfirmation(true)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="messages-list__container">
                {messagesList.length > 0 ? (
                  messagesList.map(msg => (
                    <div
                      key={msg.id}
                      className={`message-item__container ${
                        msg.sender === userData.email 
                          ? 'message-item__container--sent' 
                          : 'message-item__container--received'
                      } ${
                        msg.is_deleted ? 'message-item__container--deleted' : ''
                      }`}
                    >
                      {msg.is_deleted ? (
                        <div className="message-item__deleted">
                          Message supprimé
                        </div>
                      ) : (
                        <>
                          <div className="message-item__content">
                            {msg.message}
                            {msg.sender === userData.email && (
                              <div className="message-item__actions">
                                <button
                                  className="message-item__delete-button"
                                  onClick={() => deleteSelectedMessage(msg.id)}
                                  title="Supprimer"
                                  disabled={isLoadingData}
                                >
                                  ❌
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="message-item__meta">
                            <div className="message-item__timestamp">
                              {new Date(msg.date).toLocaleString()}
                            </div>
                            {msg.sender === userData.email && (
                              <div className="message-item__status">
                                {msg.is_deleted ? (
                                  <span title="Supprimé">🗑️</span>
                                ) : msg.is_seen ? (
                                  <span title={`Vu à ${msg.seen_at ? new Date(msg.seen_at).toLocaleTimeString() : ''}`}>✓✓</span>
                                ) : (
                                  <span title="Envoyé">✓</span>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-conversation__container">
                    Aucun message échangé pour le moment. Envoyez le premier message !
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="message-input__container">
                <input
                  type="text"
                  className="message-input__field"
                  value={messageInputValue}
                  onChange={(e) => {
                    setMessageInputValue(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Tapez votre message..."
                />
                <button 
                  onClick={sendChatMessage}
                  disabled={!messageInputValue.trim() || !currentReceiver || isSendingMessage}
                  className="message-input__send-button"
                >
                  {isSendingMessage ? 'Envoi en cours...' : 'Envoyer'}
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation__container">
              <div className="no-conversation__icon">
                💬
              </div>
              <h3 className="no-conversation__title">Aucune conversation sélectionnée</h3>
              <p className="no-conversation__description">
                Sélectionnez un contact dans la liste pour commencer à discuter ou recherchez un nouvel utilisateur
              </p>
            </div>
          )}
          
          {errorMessage && <div className="error-message__container">{errorMessage}</div>}
        </div>
      </div>

      {/* Popup de confirmation pour la suppression d'un message */}
      {showDeleteMessageConfirmation && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog">
            <h3>Confirmation</h3>
            <p>Êtes-vous sûr de vouloir supprimer ce message ?</p>
            <div className="confirmation-dialog-actions">
              <button className="confirmation-btn confirmation-btn--confirm" onClick={confirmDeleteMessage}>
                Oui, supprimer
              </button>
              <button className="confirmation-btn confirmation-btn--cancel" onClick={() => setShowDeleteMessageConfirmation(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de confirmation pour la suppression de la conversation */}
      {showDeleteConversationConfirmation && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog">
            <h3>Confirmation</h3>
            <p>Êtes-vous sûr de vouloir supprimer toute la conversation ?</p>
            <div className="confirmation-dialog-actions">
              <button className="confirmation-btn confirmation-btn--confirm" onClick={confirmDeleteConversation}>
                Oui, supprimer
              </button>
              <button className="confirmation-btn confirmation-btn--cancel" onClick={() => setShowDeleteConversationConfirmation(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;