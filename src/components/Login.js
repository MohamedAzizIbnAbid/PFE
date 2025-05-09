import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [messageErreur, setMessageErreur] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessageErreur('');
  
    try {
      // 1) création d'un sessionId unique
      const sessionId = Date.now().toString();
      localStorage.setItem('sessionId', sessionId);
      sessionStorage.setItem('sessionId', sessionId);
  
      // 2) appel API login
      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        { email, mot_de_passe: motDePasse },
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      const token = response.data.token;
      const user = response.data.user;
  
      if (token) {
        // 3) stockage multi-session dans localStorage
        localStorage.setItem(`token_${sessionId}`, token);
        localStorage.setItem(`role_${sessionId}`, user.role);
        localStorage.setItem(`email_${sessionId}`, user.email);
        localStorage.setItem(`userId_${sessionId}`, user.id);
        localStorage.setItem(`name_${sessionId}`, user.nom_utilisateur || '');
        localStorage.setItem(`lastLogin_${sessionId}`, new Date().toLocaleString());
  
        // 4) configurer axios pour inclure ce token sur toutes les requêtes
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
        // 5) redirection
        navigate('/home');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion :', error);
      if (error.response) {
        const { message, code, reason } = error.response.data;
        if (code === 'ACCOUNT_PENDING') {
          setMessageErreur('Votre compte est en attente de validation par un administrateur.');
        } else if (code === 'ACCOUNT_DEACTIVATED') {
          setMessageErreur(`Votre compte est désactivé. Raison : ${reason || 'Non spécifiée'}`);
        } else {
          setMessageErreur(message || 'Erreur lors de la connexion');
        }
      } else if (error.request) {
        setMessageErreur('Le serveur ne répond pas. Veuillez réessayer plus tard.');
      } else {
        setMessageErreur('Une erreur inattendue est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="login-page__body">
      <div className="login-component">
        <div className="login-component__card">
          <form onSubmit={handleLogin} className="login-form">
            <h2 className="login-component__title">Connexion</h2>

            {messageErreur && (
              <p className="login-form__error-message">{messageErreur}</p>
            )}

            <div className="login-form__group">
              <label htmlFor="email" className="login-form__label">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="login-form__input"
                placeholder="Adresse@gmail.com"
              />
            </div>

            <div className="login-form__group">
              <label htmlFor="motDePasse" className="login-form__label">Mot de passe</label>
              <div className="login-form__password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="motDePasse"
                  value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="login-form__input"
                  placeholder="Saisir votre mot de passe"
                />
                <span
                  className="login-form__toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  role="button"
                  tabIndex={0}
                  aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="login-form__submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>

            <div className="login-form__divider">ou</div>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="login-form__secondary-btn"
            >
              Créer un compte
            </button>

            <a
              href="/forgot-password"
              onClick={e => { e.preventDefault(); navigate('/forgot-password'); }}
              className="login-form__link"
            >
              Mot de passe oublié ?
            </a>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;