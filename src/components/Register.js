import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    matricule: "",
    nom_utilisateur: "",
    email: "",
    mot_de_passe: "",
    confirm_mdps: "",
    site: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    general: "",
    matricule: "",
    email: "",
    mot_de_passe: "",
    confirm_mdps: ""
  });
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
        general: ""
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      matricule: "",
      email: "",
      mot_de_passe: "",
      confirm_mdps: "",
      general: ""
    };

    if (!/^\d{4,}$/.test(formData.matricule)) {
      newErrors.matricule = "Le matricule doit contenir au moins 4 chiffres";
      isValid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Veuillez entrer un email valide";
      isValid = false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(formData.mot_de_passe)) {
      newErrors.mot_de_passe = "8+ caractères (majuscule,minuscule,chiffre et spécial)";
      isValid = false;
    }

    if (formData.mot_de_passe !== formData.confirm_mdps) {
      newErrors.confirm_mdps = "Les mots de passe ne correspondent pas";
      isValid = false;
    }

    if (!formData.site) {
      newErrors.general = "Tous les champs sont obligatoires";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/utilisateurs', {
        ...formData,
        role: "utilisateur" // Ajout du rôle par défaut
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 201) {
        setSuccess(true);
      }
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 409) {
          setErrors(prev => ({
            ...prev,
            [data.field]: data.message,
            general: data.message
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            general: data.message || "Erreur lors de l'enregistrement"
          }));
        }
      } else {
        setErrors(prev => ({
          ...prev,
          general: "Erreur de connexion au serveur"
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => navigate("/login");

  return (
    <div className="interstellar-registration-container">
      <div className="cosmic-registration-card">
        <div className="registration-event-horizon-header">
          <h1 className="quantum-registration-title">Créer votre Compte</h1>
          {errors.general && (
            <div className="-error-message">
              Erreur : {errors.general}
            </div>
          )}
        </div>

        {success ? (
          <div className="quantum-success-message">
            <p>✅ Inscription réussie !</p>
            <p>Redirection vers la page de connexion dans 3 secondes...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="galactic-form-body">
            <div className="stellar-input-group">
              <div className="nebula-input-field">
                <label htmlFor="matricule" className="astro-label">
                  Matricule*
                  {errors.matricule && <span className="error-text"> - {errors.matricule}</span>}
                </label>
                <input
                  type="text"
                  id="matricule"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleChange}
                  className={`cosmic-input ${errors.matricule ? 'input-event-horizon-error' : ''}`}
                  placeholder="1234 (4 chiffres minimum)"
                  required
                />
              </div>

              <div className="nebula-input-field">
                <label htmlFor="nom_utilisateur" className="astro-label">
                  Nom complet*
                </label>
                <input
                  type="text"
                  id="nom_utilisateur"
                  name="nom_utilisateur"
                  value={formData.nom_utilisateur}
                  onChange={handleChange}
                  className="cosmic-input"
                  placeholder="Votre nom complet"
                  required
                />
              </div>
            </div>

            <div className="nebula-input-field" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" className="astro-label">
                Email*
                {errors.email && <span className="error-text"> - {errors.email}</span>}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`cosmic-input ${errors.email ? 'input-event-horizon-error' : ''}`}
                placeholder="exemple@domaine.com"
                required
              />
            </div>

            <div className="stellar-input-group">
              <div className="nebula-input-field">
                <label htmlFor="mot_de_passe" className="astro-label">
                  Mot de passe*
                  {errors.mot_de_passe && <span className="error-text"> - {errors.mot_de_passe}</span>}
                </label>
                <div className="password-event-horizon">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="mot_de_passe"
                    name="mot_de_passe"
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    className={`cosmic-input ${errors.mot_de_passe ? 'input-event-horizon-error' : ''}`}
                    placeholder="8+ caractères complexes"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-cosmic-visibility-toggle"
                    title={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="nebula-input-field">
                <label htmlFor="confirm_mdps" className="astro-label">
                  Confirmation*
                  {errors.confirm_mdps && <span className="error-text"> - {errors.confirm_mdps}</span>}
                </label>
                <div className="password-event-horizon">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirm_mdps"
                    name="confirm_mdps"
                    value={formData.confirm_mdps}
                    onChange={handleChange}
                    className={`cosmic-input ${errors.confirm_mdps ? 'input-event-horizon-error' : ''}`}
                    placeholder="Retapez votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-cosmic-visibility-toggle"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            <div className="stellar-input-group">
              <div className="nebula-input-field">
                <label htmlFor="site" className="astro-label">Site*</label>
                <select
                  id="site"
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
                  className="cosmic-input"
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option value="Leoni Mateur Nord">Leoni Mateur Nord</option>
                  <option value="Leoni Mateur Sud">Leoni Mateur Sud</option>
                  <option value="Leoni Sidi Bouali">Leoni Sidi Bouali</option>
                  <option value="Leoni Manzel Hayet">Leoni Manzel Hayet</option>
                  <option value="Leoni Sousse">Leoni Sousse</option>
                </select>
              </div>
            </div>

            <div className="galactic-action-buttons">
              <button 
                type="submit" 
                className="cosmic-submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="quantum-spinner"></span>
                    En cours...
                  </>
                ) : "S'inscrire"}
              </button>
              
              <div className="wormhole-redirect-section">
                Déjà inscrit? 
                <button
                  type="button"
                  className="hyperlink-login-button"
                  onClick={handleLoginRedirect}
                >
                  Se connecter
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;