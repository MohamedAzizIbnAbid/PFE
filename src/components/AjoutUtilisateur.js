import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../styles/AjoutUtilisateur.css';
import Navbar from './Navbar';
import { 
  FaUserEdit, 
  FaLock, 
  FaEnvelope, 
  FaUserPlus,
  FaTimes,
  FaIdCard,
  FaUserCog,
  FaBuilding
} from 'react-icons/fa';
const getSessionId = () => sessionStorage.getItem('sessionId');

const getItem = key => {
  const sid = getSessionId();
  return sid ? localStorage.getItem(`${key}_${sid}`) : null;
};

const AjouterUtilisateurs = () => {
  const [formData, setFormData] = useState({
    matricule: "",
    nom_utilisateur: "",
    email: "",
    mot_de_passe: "",
    confirm_mdps: "",
    role: "",
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
    const role = getItem('role');
    const statut = getItem('statut');

    if (role !== 'administrateur') {
      navigate('/home');
    }

    if (statut === "0") {
      navigate('/en-attente');
    }
  }, [navigate]);

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
      newErrors.mot_de_passe = "Mot de passe est faible";
      isValid = false;
    }

    if (formData.mot_de_passe !== formData.confirm_mdps) {
      newErrors.confirm_mdps = "Les mots de passe ne correspondent pas";
      isValid = false;
    }

    if (!formData.role || !formData.site) {
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
      const response = await axios.post('http://localhost:5000/api/utilisateurs', formData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/gestion-utilisateurs");
        }, 1500);
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
            general: data?.message || "Erreur lors de l'enregistrement"
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

  return (
    <div className="register-wrapper">
      <Navbar/>
      <div className="register-form">
        <h2 className="register-title">Ajouter Un Nouvel Utilisateur</h2>

        {success ? (
          <div className="register-success-message">
            <p>✅ Utilisateur ajouté avec succès !</p>
            <p>Redirection vers la gestion des utilisateurs...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="fieldGroup12">
              <div className="field12">
                <label htmlFor="matricule" className="register-label">
                  <FaIdCard /> Matricule*
                  {errors.matricule && <span className="error-text"> - {errors.matricule}</span>}
                </label>
                <input
                  type="text"
                  id="matricule"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleChange}
                  className={`register-input ${errors.matricule ? 'input-error' : ''}`}
                  placeholder="1234 (4 chiffres minimum)"
                  required
                />
              </div>

              <div className="field12">
                <label htmlFor="nom_utilisateur" className="register-label">
                  <FaUserEdit /> Nom complet*
                </label>
                <input
                  type="text"
                  id="nom_utilisateur"
                  name="nom_utilisateur"
                  value={formData.nom_utilisateur}
                  onChange={handleChange}
                  className="register-input"
                  placeholder="Votre nom complet"
                  required
                />
              </div>
            </div>

            <div className="field12">
              <label htmlFor="email" className="register-label">
                <FaEnvelope /> Email*
                {errors.email && <span className="error-text"> - {errors.email}</span>}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`register-input ${errors.email ? 'input-error' : ''}`}
                placeholder="exemple@domaine.com"
                required
              />
            </div>

            <div className="fieldGroup12">
              <div className="field12">
                <label htmlFor="mot_de_passe" className="register-labe-motdepasse">
                  <FaLock /> Mot de passe*
                  {errors.mot_de_passe && <span className="error-text"> - {errors.mot_de_passe}</span>}
                </label>
                <div className="register-password-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="mot_de_passe"
                    name="mot_de_passe"
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    className={`register-input ${errors.mot_de_passe ? 'input-error' : ''}`}
                    placeholder="8+ caractères complexes"
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="register-password-eye"
                    title={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </span>
                </div>
              </div>

              <div className="field12">
                <label htmlFor="confirm_mdps" className="register-labe-motdepasse">
                  <FaLock /> Confirmation*
                  {errors.confirm_mdps && <span className="error-text"> - {errors.confirm_mdps}</span>}
                </label>
                <div className="register-password-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirm_mdps"
                    name="confirm_mdps"
                    value={formData.confirm_mdps}
                    onChange={handleChange}
                    className={`register-input ${errors.confirm_mdps ? 'input-error' : ''}`}
                    placeholder="Retapez votre mot de passe"
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="register-password-eye"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </span>
                </div>
              </div>
            </div>

            <div className="fieldGroup12">
              <div className="field12">
                <label htmlFor="role" className="register-label"><FaUserCog /> Rôle*</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="register-select"
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option value="utilisateur">Utilisateur</option>
                  <option value="administrateur">Administrateur</option>
                </select>
              </div>

              <div className="field12">
                <label htmlFor="site" className="register-label"><FaBuilding /> Site*</label>
                <select
                  id="site"
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
                  className="register-select"
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

            {errors.general && (
              <div className="register-error-message">
                <strong>Erreur :</strong> {errors.general}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="register-submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    En cours...
                  </>
                  
                ) : ""}
                <>
                                       <FaUserPlus className="button-icon" />Ajouter
                                    </>
              </button>
              <button 
                type="button" 
                className="register-cancel-button"
                onClick={() => navigate("/gestion-utilisateurs")}
              >
                <FaTimes className="button-icon"/> Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AjouterUtilisateurs;