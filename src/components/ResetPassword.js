import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [tokenStatus, setTokenStatus] = useState('checking');
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/auth/verify-reset-token/${token}`
        );
        
        if (response.data.valid) {
          setTokenStatus('valid');
          setUserEmail(response.data.email);
        } else {
          setTokenStatus('invalid');
          setMessage({
            text: response.data.message || 'Lien de réinitialisation invalide',
            type: 'error'
          });
        }
      } catch (error) {
        setTokenStatus('invalid');
        setMessage({
          text: 'Erreur de vérification du token',
          type: 'error'
        });
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (tokenStatus !== 'valid') return;

    if (!formData.password || !formData.confirmPassword) {
      setMessage({ text: 'Tous les champs sont requis', type: 'error' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setMessage({
        text: 'Le mot de passe doit contenir 8 caractères minimum avec majuscule, minuscule, chiffre et caractère spécial',
        type: 'error'
      });
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        { mot_de_passe: formData.password }
      );

      setMessage({
        text: response.data.message || 'Mot de passe réinitialisé avec succès',
        type: 'success'
      });

      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Erreur lors de la réinitialisation',
        type: 'error'
      });
    }
  };

  if (tokenStatus === 'checking') {
    return (
      <div className="password-reset__background-container">
        <div className="password-reset__main-container">
          <div className="password-reset__loading-state">
            <div className="password-reset__loading-spinner"></div>
            Vérification du lien en cours...
          </div>
        </div>
      </div>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="password-reset__background-container">
        <div className="password-reset__main-container">
          <div className="password-reset__invalid-token-container">
            <h2 className="password-reset__invalid-token-title">Lien invalide</h2>
            <p className="password-reset__invalid-token-message">{message.text}</p>
            <button 
              onClick={() => navigate('/forgot-password')}
              className="password-reset__request-new-link"
            >
              Demander un nouveau lien
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="password-reset__background-container">
      <div className="password-reset__main-container">
        <h2 className="password-reset__title">Réinitialisation du mot de passe</h2>
        <p className="password-reset__user-email">
          <div className='couleurEmail'>Pour l'email:</div> <strong>{userEmail}</strong>
        </p>
        
        {message.text && (
          <div className={`password-reset__message-container password-reset__message--${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="password-reset__form-container">
          <div className="password-reset__input-group">
            <label htmlFor="password" className="password-reset__input-label" >
              Nouveau mot de passe
            </label>
            <div className="password-reset__password-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength="8"
                className="password-reset__input-field"
                placeholder="Saisir votre nouveau mot de passe"
              />
              <span 
                className="password-reset__toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
          </div>
          
          <div className="password-reset__input-group">
            <label htmlFor="confirmPassword" className="password-reset__input-label" aria-placeholder=''>
              Confirmer le mot de passe
            </label>
            <div className="password-reset__password-container">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                minLength="8"
                className="password-reset__input-field"
                placeholder="Retaper votre mot de passe"
              />
              <span 
                className="password-reset__toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
          </div>
          
          <button type="submit" className="password-reset__submit-button">
            Réinitialiser le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;