import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUserEdit, 
  FaLock, 
  FaEnvelope, 
  FaSave, 
  FaTimes, 
  FaEye, 
  FaEyeSlash,
  FaIdCard,
  FaBuilding
} from 'react-icons/fa';
import '../styles/Compte.css';
import axios from 'axios';
import Navbar from './Navbar';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getSessionId = () => sessionStorage.getItem('sessionId');
const getItem = key => {
  const sid = getSessionId();
  return sid ? localStorage.getItem(`${key}_${sid}`) : null;
};

export default function Compte() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: '',
    username: '',
    email: '',
    role: '',
    matricule: '',
    site: ''
  });
  
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    matricule: '',
    site: ''
  });
  
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({
    general: '',
    email: '',
    matricule: '',
    password: ''
  });
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const role = getItem('role');
    const statut = getItem('statut');

    if (!role || (role !== 'utilisateur' && role !== 'administrateur')) {
      navigate('/home');
      return;
    }
    if (statut === "0") {
      navigate('/en-attente');
      return;
    }

    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = getItem('token');
      const userId = getItem('userId');
      
      if (!token || !userId) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE}/api/account/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Erreur de chargement');
      }

      setUserData({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        matricule: data.user.matricule || '',
        site: data.user.site || ''
      });
      
      setFormData({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        currentPassword: '',
        newPassword: '',
        matricule: data.user.matricule || '',
        site: data.user.site || ''
      });
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        general: err.response?.data?.message || err.message || 'Erreur de connexion au serveur'
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Ne réinitialiser que si on est en mode édition
    if (editMode && errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: editMode ? '' : errors.email,
      matricule: editMode ? '' : errors.matricule,
      password: '',
      general: ''
    };

    if (editMode) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Veuillez entrer un email valide";
        isValid = false;
      }

      if ((userData.role === 'administrateur' || userData.role === 'utilisateur') && !/^\d{4,}$/.test(formData.matricule)) {
        newErrors.matricule = "Le matricule doit contenir au moins 4 chiffres";
        isValid = false;
      }
    }

    if (formData.newPassword) {
      const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/;
      if (!passwordRegex.test(formData.newPassword)) {
        newErrors.password = "Le mot de passe doit contenir au moins 8 caractères, dont majuscules, minuscules, chiffres et caractères spéciaux";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmitConfirmation = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowSaveConfirmation(true);
    }
  };

  const handleSubmit = async () => {
    setShowSaveConfirmation(false);
    setIsLoading(true);
    
    // Réinitialisation conditionnelle des erreurs
    setErrors(prev => ({
      ...prev,
      general: '',
      password: '',
      ...(editMode && { email: '', matricule: '' }) // Seulement réinitialiser si en mode édition
    }));
    
    setSuccess('');

    try {
      const token = getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const updateData = {
        id: formData.id,
        username: formData.username,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword || undefined,
        matricule: formData.matricule,
        site: formData.site
      };

      const response = await axios.put(`${API_BASE}/api/account/update`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data;

      if (!data.success) {
        if (data.error) {
          // Gestion spécifique des erreurs - seulement en mode édition
          if (editMode) {
            if (data.message.includes('matricule') || data.error.includes('matricule')) {
              setErrors(prev => ({
                ...prev,
                matricule: "Ce numéro de matricule est déjà attribué à un autre utilisateur",
                general: ''
              }));
              return;
            } 
            
            if (data.message.includes('email') || data.error.includes('email')) {
              setErrors(prev => ({
                ...prev,
                email: "Cette adresse email est déjà utilisée par un autre compte",
                general: ''
              }));
              return;
            }
          }
        }
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }

      // Succès - Mise à jour des données
      const sid = getSessionId();
      if (sid) {
        localStorage.setItem(`name_${sid}`, formData.username);
        localStorage.setItem(`email_${sid}`, formData.email);
      }

      setUserData(prev => ({
        ...prev,
        username: formData.username,
        email: formData.email,
        matricule: formData.matricule,
        site: formData.site
      }));

      setShowConfirmation(true);
      setTimeout(() => {
        setShowConfirmation(false);
        setEditMode(false);
      }, 1500);

    } catch (err) {
      if (err.response) {
        const { data } = err.response;
        
        if (data.message.includes('password') || data.error?.includes('password')) {
          setErrors(prev => ({
            ...prev,
            password: "Mot de passe actuel incorrect",
            general: ''
          }));
        } else {
          const field = data.field || 'general';
          setErrors(prev => ({
            ...prev,
            [field]: data.message,
            general: field === 'general' ? data.message : ''
          }));
        }
      } else {
        setErrors(prev => ({
          ...prev,
          general: err.message || "Erreur de connexion au serveur"
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="account-dashboard no-scroll">
      <Navbar/>
      
      <div className="account-content">
        {errors.general && <div className="account-alert account-alert--error">{errors.general}</div>}
        {success && <div className="account-alert account-alert--success">{success}</div>}
        {showConfirmation && (
          <div className="account-confirmation">
            <div className="confirmation-content">
              <p>Modifications enregistrées avec succès!</p>
            </div>
          </div>
        )}

        {!editMode ? (
          <div className="account-profile">
            <h3 className='account-title'>Mon Compte</h3>
            <div className="profile-details">
              <div className="detail-row">
                <div className="detail-card">
                  <span className="detail-label">Nom d'utilisateur:</span>
                  <span className="detail-value">{userData.username}</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Matricule:</span>
                  <span className="detail-value">{userData.matricule}</span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-card">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{userData.email}</span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-card">
                  <span className="detail-label">Site:</span>
                  <span className="detail-value">{userData.site}</span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-card">
                  <span className="detail-label">Rôle:</span>
                  <span className={`detail-value detail-value--${userData.role}`}>
                    {userData.role === 'administrateur' ? 'Administrateur' : 'Utilisateur'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              className="account-btn account-btn--edit" 
              onClick={() => setEditMode(true)}
            >
              <FaUserEdit /> Modifier le profil
            </button>
          </div>
        ) : (
          <>
            <form className="account-form" onSubmit={handleSubmitConfirmation}>
              <h3 className='account-title'>Modifier Votre Compte</h3>
              <div className="form-row">
                <div className="form-field">
                  <label><FaUserEdit /> Nom d'utilisateur</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className={`form-input ${errors.username ? 'input-error' : ''}`}
                  />
                </div>
                <div className="form-field">
                  <label><FaIdCard /> Matricule</label> 
                  <input
                    type="text"
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleInputChange}
                    className={`form-input ${errors.matricule ? 'input-error' : ''}`}
                    placeholder="1234"
                    required
                  />
                  {errors.matricule && (
                    <div className="error-message">
                      <span className="error-icon">!</span>
                      {errors.matricule}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <label><FaEnvelope /> Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                  />
                  {errors.email && (
                    <div className="error-message">
                      <span className="error-icon">!</span>
                      {errors.email}
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label><FaBuilding /> Site</label>
                  <select
                    name="site"
                    value={formData.site}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">{formData.site}</option>
                    <option value="Leoni Mateur Nord">Leoni Mateur Nord</option>
                    <option value="Leoni Mateur Sud">Leoni Mateur Sud</option>
                    <option value="Leoni Sidi Bouali">Leoni Sidi Bouali</option>
                    <option value="Leoni Manzel Hayet">Leoni Manzel Hayet</option>
                    <option value="Leoni Sousse">Leoni Sousse</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <label><FaLock /> Mot de passe actuel</label>
                  <div className="password-input-container">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      required
                      autoComplete="current-password" placeholder='Taper votre mot de passe actuel'
                      className={`form-input ${errors.currentPassword ? 'input-error' : ''}`}
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="form-field">
                  <label><FaLock /> Nouveau mot de passe</label>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Laisser vide pour ne pas changer"
                      autoComplete="new-password"
                      className={`form-input ${errors.password ? 'input-error' : ''}`}
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="error-message">
                      <span className="error-icon">!</span>
                      {errors.password}
                    </div>
                  )}
                  {formData.newPassword && (
                    <div className="password-requirements">
                      <ul>
                        <li className={formData.newPassword.length >= 8 ? "valid" : "invalid"}>
                          8 caractères
                        </li>
                        <li className={/[A-Z]/.test(formData.newPassword) ? "valid" : "invalid"}>
                          1 majuscule
                        </li>
                        <li className={/[a-z]/.test(formData.newPassword) ? "valid" : "invalid"}>
                          1 minuscule
                        </li>
                        <li className={/\d/.test(formData.newPassword) ? "valid" : "invalid"}>
                          1 chiffre
                        </li>
                        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? "valid" : "invalid"}>
                          1 caractère spécial
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="account-btn account-btn--save"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      En cours...
                    </>
                  ) : (
                    <>
                      <FaSave /> Enregistrer
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="account-btn account-btn--cancel" 
                  onClick={() => setEditMode(false)}
                  disabled={isLoading}
                >
                  <FaTimes /> Annuler
                </button>
              </div>
            </form>

            {showSaveConfirmation && (
              <div className="confirmation-dialog-overlay">
                <div className="confirmation-dialog">
                  <h3>Confirmation</h3>
                  <p>Êtes-vous sûr de vouloir modifier vos informations de profil ?</p>
                  <div className="confirmation-dialog-actions">
                    <button 
                      className="confirmation-btn confirmation-btn--confirm"
                      onClick={handleSubmit}
                    >
                      Oui, confirmer
                    </button>
                    <button 
                      className="confirmation-btn confirmation-btn--cancel"
                      onClick={() => setShowSaveConfirmation(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}