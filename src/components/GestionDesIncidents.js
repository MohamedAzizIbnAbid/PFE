import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from './Navbar';
import '../styles/GestionDesIncidents.css';
import { 
  FaHeading,
  FaExclamationTriangle,
  FaAlignLeft,
  FaEnvelope,
  FaSave,
  FaTimes,
  FaEdit,
  FaTrash,
  FaBell,
  FaPlus
} from 'react-icons/fa';

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

const GestionDesIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [incidentAModifier, setIncidentAModifier] = useState(null);
  const [newIncident, setNewIncident] = useState({
    titre: "",
    description: "",
    gravite: "Faible",
    email_responsable: "",
  });
  const [error, setError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSignalConfirmation, setShowSignalConfirmation] = useState(false);
  const [currentIncidentId, setCurrentIncidentId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const role = getItem('role');
    const statut = getItem('statut');
    
    if (!role || (role !== 'utilisateur' && role !== 'administrateur')) {
      navigate('/home');
    }

    if (statut === "0") {
      navigate('/en-attente');
    } else {
      fetchIncidents();
    }
  }, [navigate]);

  const fetchIncidents = async () => {
    try {
      const response = await api.get('/incidents');
      setIncidents(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des incidents:', error);
      setError("Erreur lors de la récupération des incidents.");
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredIncidents = incidents.filter((incident) =>
    incident.titre && incident.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewIncident({ ...newIncident, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const gravite = newIncident.gravite ? newIncident.gravite.toLowerCase() : "faible";
      let response;

      if (incidentAModifier) {
        // Vérifier si le titre existe déjà (sauf pour l'incident en cours de modification)
        const titreExiste = incidents.some(
          (incident) => 
            incident.titre.toLowerCase() === newIncident.titre.toLowerCase() && 
            incident.id !== incidentAModifier.id
        );

        if (titreExiste) {
          setError("Erreur : Un incident avec ce titre existe déjà");
          return;
        }

        // Exclure email_responsable lors de la modification
        response = await api.put(`/incidents/${incidentAModifier.id}`, {
          titre: newIncident.titre,
          description: newIncident.description,
          gravite: gravite,
        });
        setConfirmationMessage("Incident modifié avec succès !");
      } else {
        response = await api.post("/incidents", {
          titre: newIncident.titre,
          description: newIncident.description,
          gravite: gravite,
          email_responsable: newIncident.email_responsable,
        });
        setConfirmationMessage("Incident ajouté avec succès !");
      }

      setShowSaveConfirmation(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 1500);
      fetchIncidents();
      resetForm();

    } catch (error) {
      console.error("Erreur lors de la création/modification de l'incident:", error);
      if (error.response?.status === 400) {
        setError("Erreur : Un incident avec ce titre existe déjà");
      } else if (error.response?.status === 401) {
        setError("Erreur : Non autorisé. Veuillez vous reconnecter.");
      } else {
        setError("Une erreur s'est produite lors de l'enregistrement.");
      }
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/incidents/${currentIncidentId}`);
      setConfirmationMessage("Incident supprimé avec succès !");
      setShowDeleteConfirmation(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 1500);
      fetchIncidents();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'incident:", error);
      setError("Impossible de supprimer l'incident.");
    }
  };

  const handleEdit = (incident) => {
    setIncidentAModifier(incident);
    setNewIncident({
      titre: incident.titre,
      description: incident.description,
      gravite: incident.gravite,
      email_responsable: incident.email_responsable,
    });
  };

  const handleSignal = async () => {
    try {
      const response = await api.post(`/incidents/${currentIncidentId}/signal`);
      setConfirmationMessage(response.data.message || "Email de signalement envoyé avec succès");
      setShowSignalConfirmation(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 1500);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de signalement :', error);
      setError('Erreur lors de l\'envoi de l\'email de signalement.');
    }
  };

  const resetForm = () => {
    setNewIncident({
      titre: "",
      description: "",
      gravite: "Faible",
      email_responsable: "",
    });
    setIncidentAModifier(null);
    setError("");
  };

  return (
    <div className="Container-Incidents">
      <Navbar />
       
      <div className="scrollable-content">
        {/* Bouton Ajouter Incident - masqué pendant la modification */}
        {!incidentAModifier && (
          <button 
            onClick={() => navigate("/ajout-incident")} 
            className="button button-ajouter"
          >
            <FaPlus className="button-icon" /> Ajouter Incident
          </button>
        )}

        {/* Message de confirmation */}
        {showConfirmation && (
          <div className="account-confirmation">
            <div className="confirmation-content">
              <p>{confirmationMessage}</p>
            </div>
          </div>
        )}

        {/* Formulaire pour ajouter ou modifier un incident */}
        {incidentAModifier && (
          <form onSubmit={handleSubmit} className="form45">
            <h2 className="form-title">Modifier Un Incident</h2>
            <div className="fieldGroup45">
              <div className="field45">
                <label className="labell">
                  <FaHeading className="icon" /> Titre
                </label>
                <input
                  type="text"
                  name="titre"
                  value={newIncident.titre}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div className="field45">
                <label className="labell">
                  <FaExclamationTriangle className="icon" /> Gravité
                </label>
                <select
                  name="gravite"
                  value={newIncident.gravite}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="Faible">Faible</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Élevée">Élevée</option>
                </select>
              </div>
            </div>

            <div className="field45">
              <label className="labell">
                <FaAlignLeft className="icon" /> Description
              </label>
              <textarea
                name="description"
                value={newIncident.description}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div className="field45">
              <label className="labell">
                <FaEnvelope className="icon" /> Email du responsable
              </label>
              <input
                type="email"
                name="email_responsable"
                value={newIncident.email_responsable}
                onChange={handleInputChange}
                className="input"
                required
                readOnly={incidentAModifier !== null} // Lecture seule en mode modification
              />
            </div>

            {error && <div className="error">{error}</div>}

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setShowSaveConfirmation(true)} 
                className="buttonModification"
              >
                <FaSave className="button-icon" /> Enregistrer
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                className="buttonAnnulers"
              >
                <FaTimes className="button-icon" /> Annuler
              </button>
            </div>

            {/* Popup de confirmation pour l'enregistrement */}
            {showSaveConfirmation && (
              <div className="confirmation-dialog-overlay">
                <div className="confirmation-dialog">
                  <h3>Confirmation</h3>
                  <p>Êtes-vous sûr de vouloir modifier cet incident ?</p>
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
          </form>
        )}

        {/* Barre de recherche - Masquée pendant la modification */}
        {!incidentAModifier && (
          <div className="searchContainer-incident">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="searchInput"
              placeholder="Rechercher un incident par titre"
            />
          </div>
        )}

        {/* Tableau des incidents avec scroll view - Masqué pendant la modification */}
        {!incidentAModifier && (
          <div className="table-container-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Titre</th>
                  <th className="th">Description</th>
                  <th className="th">Gravité</th>
                  <th className="th">Email du responsable</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident) => {
                    const role = getItem('role');
                    const isAdmin = role === 'administrateur';
                    
                    return (
                      <tr key={incident.id}>
                        <td className="td">{incident.titre}</td>
                        <td className="td">{incident.description}</td>
                        <td className={`td gravite-${incident.gravite.toLowerCase()}`}>
                          {incident.gravite}
                        </td>
                        <td className="td">{incident.email_responsable}</td>
                        <td className="td actions">
                          <button
                            onClick={() => {
                              setCurrentIncidentId(incident.id);
                              setShowSignalConfirmation(true);
                            }}
                            className="button-accepter"
                          >
                            <FaBell className="button-icon" /> Signaler
                          </button>
                          <button
                            onClick={() => handleEdit(incident)}
                            className="button--modifier"
                          >
                            <FaEdit className="button-icon" /> Modifier
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setCurrentIncidentId(incident.id);
                                setShowDeleteConfirmation(true);
                              }}
                              className="button-supprimer"
                            >
                              <FaTrash className="button-icon" /> Supprimer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="td no-incidents">
                      {searchQuery ? "Aucun incident trouvé pour cette recherche" : "Aucun incident à afficher"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Popup de confirmation pour la suppression */}
        {showDeleteConfirmation && (
          <div className="confirmation-dialog-overlay">
            <div className="confirmation-dialog">
              <h3>Confirmation</h3>
              <p>Êtes-vous sûr de vouloir supprimer cet incident ?</p>
              <div className="confirmation-dialog-actions">
                <button 
                  className="confirmation-btn confirmation-btn--confirm"
                  onClick={handleDelete}
                >
                  Oui, supprimer
                </button>
                <button 
                  className="confirmation-btn confirmation-btn--cancel"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup de confirmation pour le signalement */}
        {showSignalConfirmation && (
          <div className="confirmation-dialog-overlay">
            <div className="confirmation-dialog">
              <h3>Confirmation</h3>
              <p>Êtes-vous sûr de vouloir signaler cet incident ?</p>
              <div className="confirmation-dialog-actions">
                <button 
                  className="confirmation-btn confirmation-btn--confirm"
                  onClick={handleSignal}
                >
                  Oui, signaler
                </button>
                <button 
                  className="confirmation-btn confirmation-btn--cancel"
                  onClick={() => setShowSignalConfirmation(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionDesIncidents;