import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from './Navbar';
import '../styles/AjoutIncident.css';
import { 
  FaHeading,
  FaExclamationTriangle,
  FaAlignLeft,
  FaEnvelope,
  FaSave,
  FaTimes
} from 'react-icons/fa';

// helper multi-session
const getSessionId = () => sessionStorage.getItem('sessionId');
const getItem = key => {
  const sid = getSessionId();
  return sid ? localStorage.getItem(`${key}_${sid}`) : null;
};

const AjoutIncident = () => {
  const [nouvelIncident, setNouvelIncident] = useState({
    titre: "",
    description: "",
    gravite: "Faible",
    email_responsable: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // contrôle d'accès multi-session
  useEffect(() => {
    const role   = getItem('role');
    const statut = getItem('statut');

    if (!role || (role !== 'utilisateur' && role !== 'administrateur')) {
      navigate('/home');
      return;
    }
    if (statut === "0") {
      navigate('/en-attente');
      return;
    }
  }, [navigate]);

  const handleChange = e => {
    setNouvelIncident(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    // on utilise getItem pour le token de la session courante
    const token = getItem('token');
    if (!token) {
      setError("Vous devez être connecté.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/incidents",
        nouvelIncident,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage("Incident ajouté avec succès !");
      setTimeout(() => navigate("/gestion-incidents"), 1500);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement :", err);
      if (err.response?.status === 400) {
        setError("Erreur : Un incident avec ce titre existe déjà");
      } else if (err.response?.status === 401) {
        setError("Erreur : Non autorisé. Veuillez vous reconnecter.");
      } else {
        setError("Une erreur s'est produite lors de l'enregistrement.");
      }
    }
  };

  return (
    <div className="incident-container">
      <Navbar />
      <form className="incident-form" onSubmit={handleSubmit}>
        <h2 className="incident-title">Ajouter un Incident</h2>

        {successMessage && (
          <div className="incident-success-message">{successMessage}</div>
        )}
        {error && (
          <div className="incident-error-message">{error}</div>
        )}

        <div className="incident-field-group">
          <div className="incident-field">
            <label className="incident-label">
              <FaHeading className="icon" /> Titre
            </label>
            <input
              type="text"
              name="titre"
              className="incident-input"
              placeholder="Titre de l'incident"
              value={nouvelIncident.titre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="incident-field">
            <label className="incident-label">
              <FaExclamationTriangle className="icon" /> Gravité
            </label>
            <select
              name="gravite"
              className="incident-select"
              value={nouvelIncident.gravite}
              onChange={handleChange}
            >
              <option value="Faible">Faible</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Élevée">Élevée</option>
            </select>
          </div>
        </div>

        <div className="incident-field">
          <label className="incident-label">
            <FaAlignLeft className="icon" /> Description
          </label>
          <textarea
            name="description"
            className="incident-input incident-textarea"
            placeholder="Description détaillée…"
            value={nouvelIncident.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="incident-field">
          <label className="incident-label">
            <FaEnvelope className="icon" /> Email du responsable
          </label>
          <input
            type="email"
            name="email_responsable"
            className="incident-input"
            placeholder="email@exemple.com"
            value={nouvelIncident.email_responsable}
            onChange={handleChange}
            required
          />
        </div>

        <div className="incident-form-actions">
          <button type="submit" className="incident-submit-button">
            <FaSave className="button-icon" /> Enregistrer l'incident
          </button>
          <button
            type="button"
            className="incident-cancel-button"
            onClick={() => navigate('/gestion-incidents')}
          >
            <FaTimes className="button-icon" /> Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AjoutIncident;