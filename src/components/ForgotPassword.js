import React, { useState } from 'react';
import axios from 'axios';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage({ text: response.data.message, type: 'success' });
    } catch (error) {
      console.error('Error during forgot password request:', error.response?.data || error.message);
      setMessage({ 
        text: error.response?.data?.message || 'Erreur lors de la demande de réinitialisation', 
        type: 'error' 
      });
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2 className="forgot-password-title">Mot de passe oublié</h2>
        
        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="input-with-floating-label">
            <input
              type="email"
              id="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="email">Adresse email</label>
          </div>
          
          <button type="submit">Envoyer le lien de réinitialisation</button>
        </form>
        
        {message.text && (
          <p className={`message ${message.type}`}>{message.text}</p>
        )}
        
       
      </div>
    </div>
  );
};

export default ForgotPassword;