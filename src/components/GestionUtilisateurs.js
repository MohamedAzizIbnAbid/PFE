import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from './Navbar';
import '../styles/GestionUtilisateurs.css';
import { 
  FaUserEdit, 
  FaEnvelope, 
  FaSave, 
  FaTimes,
  FaIdCard,
  FaUserCog,
  FaBuilding,
  FaUserPlus,
  FaCheck,
  FaBan,
  FaTrash,
  FaEdit
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

const GestionUtilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [utilisateurAModifier, setUtilisateurAModifier] = useState(null);
  const [nouvelUtilisateur, setNouvelUtilisateur] = useState({
    matricule: "",
    nom_utilisateur: "",
    email: "",
    role: "",
    site: "",
  });
  const [error, setError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showActivateConfirmation, setShowActivateConfirmation] = useState(false);
  const [showDeactivateConfirmation, setShowDeactivateConfirmation] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = getItem('token');
    const role = getItem('role');
    const statut = getItem('statut');
    if (!token || role !== 'administrateur') {
      navigate('/home');
    }

    if (statut === "0") {
      navigate('/en-attente');
    } else {
      fetchUtilisateurs();
    }
  }, [navigate]);

  const fetchUtilisateurs = async () => {
    try {
      const response = await api.get("/utilisateurs");
      const sortedUsers = response.data.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
      setUtilisateurs(sortedUsers);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
      setError("Erreur lors de la récupération des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      const response = await api.put(`/utilisateurs/activate/${currentUserId}`);
      
      if (response.data.success) {
        setConfirmationMessage(
          response.data.emailSent
            ? "Compte activé avec succès et email envoyé !"
            : "Compte activé avec succès, mais l'email n'a pas pu être envoyé."
        );
        fetchUtilisateurs();
        console.log(
          response.data.emailSent
            ? "Email d'activation envoyé avec succès"
            : "Email d'activation non envoyé"
        );
      } else {
        setError(response.data.message || "Erreur lors de l'activation");
      }
      
      setShowActivateConfirmation(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 1500);
      
    } catch (error) {
      console.error("Erreur complète d'activation:", {
        error: error.response?.data || error.message,
        stack: error.stack
      });
      setError(error.response?.data?.message || "Erreur lors de l'activation");
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateReason) {
      setError("Veuillez saisir une raison de désactivation");
      return;
    }

    try {
      const response = await api.put(`/utilisateurs/deactivate/${currentUserId}`, { 
        reason: deactivateReason 
      });

      if (response.data.success) {
        setConfirmationMessage(
          response.data.emailSent
            ? "Compte désactivé avec succès et email envoyé !"
            : "Compte désactivé avec succès, mais l'email n'a pas pu être envoyé."
        );
        setDeactivateReason("");
        fetchUtilisateurs();
        console.log(
          response.data.emailSent
            ? "Email de désactivation envoyé avec succès"
            : "Email de désactivation non envoyé"
        );
      } else {
        setError(response.data.message || "Erreur lors de la désactivation");
      }
      
      setShowDeactivateConfirmation(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 1500);
      
    } catch (error) {
      console.error("Erreur complète de désactivation:", {
        error: error.response?.data || error.message,
        stack: error.stack
      });
      setError(error.response?.data?.message || "Erreur lors de la désactivation");
    }
  };

  const handleChange = (e) => {
    setNouvelUtilisateur({ ...nouvelUtilisateur, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const dataToSend = {
        matricule: nouvelUtilisateur.matricule,
        nom_utilisateur: nouvelUtilisateur.nom_utilisateur,
        email: nouvelUtilisateur.email,
        role: nouvelUtilisateur.role,
        site: nouvelUtilisateur.site,
      };
  
      await api.put(`/utilisateurs/${utilisateurAModifier.id}`, dataToSend);
      setConfirmationMessage("Utilisateur modifié avec succès !");
      setShowSaveConfirmation(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 1500);
      fetchUtilisateurs();
      resetForm();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      setError("Erreur: Email ou Matricule déjà utilisé");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/utilisateurs/${currentUserId}`);
      setConfirmationMessage("Utilisateur supprimé avec succès !");
      setShowDeleteConfirmation(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 1500);
      fetchUtilisateurs();
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      setError("Impossible de supprimer l'utilisateur.");
    }
  };

  const handleEdit = (utilisateur) => {
    setUtilisateurAModifier(utilisateur);
    setNouvelUtilisateur({
      matricule: utilisateur.matricule,
      nom_utilisateur: utilisateur.nom_utilisateur,
      email: utilisateur.email,
      role: utilisateur.role,
      site: utilisateur.site,
    });
  };

  const resetForm = () => {
    setNouvelUtilisateur({
      matricule: "",
      nom_utilisateur: "",
      email: "",
      role: "",
      site: "",
    });
    setUtilisateurAModifier(null);
    setError("");
  };

  const filteredUtilisateurs = utilisateurs.filter(utilisateur =>
    utilisateur.nom_utilisateur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-Utilisateurs">
      <Navbar />
      
      {showConfirmation && (
        <div className="account-confirmation">
          <div className="confirmation-content">
            <p>{confirmationMessage}</p>
          </div>
        </div>
      )}

      {utilisateurAModifier ? (
        <form onSubmit={handleSubmit} className="form">
          <h2 className="form-title">Modifier Un utilisateur</h2>
          
          <div className="fieldGroup--">
            <div className="field">
              <label className="label-matricule">
                <FaIdCard className="icon" /> Matricule
              </label>
              <input
                type="text"
                name="matricule"
                value={nouvelUtilisateur.matricule}
                onChange={handleChange}
                className="input-matricule"
                required
              />
            </div>
            <div className="field">
              <label className="label-nom">
                <FaUserEdit className="icon" /> Nom d'utilisateur
              </label>
              <input
                type="text"
                name="nom_utilisateur"
                value={nouvelUtilisateur.nom_utilisateur}
                onChange={handleChange}
                className="input-nom-utilisateur"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">
              <FaEnvelope className="icon" /> Email
            </label>
            <input
              type="email"
              name="email"
              value={nouvelUtilisateur.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="fieldGroup--">
            <div className="field">
              <label className="label">
                <FaUserCog className="icon" /> Rôle
              </label>
              <select
                name="role"
                value={nouvelUtilisateur.role}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="utilisateur">Utilisateur</option>
                <option value="administrateur">Administrateur</option>
              </select>
            </div>
            <div className="field">
              <label className="label">
                <FaBuilding className="icon" /> Site
              </label>
              <select
                name="site"
                value={nouvelUtilisateur.site}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="Leoni Mateur Nord">Leoni Mateur Nord</option>
                <option value="Leoni Mateur Sud">Leoni Mateur Sud</option>
                <option value="Leoni Sidi Bouali">Leoni Sidi Bouali</option>
                <option value="Leoni Manzel Hayet">Leoni Manzel Hayet</option>
                <option value="Leoni Sousse">Leoni Sousse</option>
              </select>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="buttonGroup">
            <button 
              type="button" 
              onClick={() => setShowSaveConfirmation(true)}
              className="button--Modifier"
            >
              <FaSave className="button-icon" /> Enregistrer
            </button>
            <button 
              type="button" 
              onClick={resetForm} 
              className="button----Annuler"
            >
              <FaTimes className="button-icon" /> Annuler
            </button>
          </div>

          {showSaveConfirmation && (
            <div className="confirmation-dialog-overlay">
              <div className="confirmation-dialog">
                <h3>Confirmation</h3>
                <p>Êtes-vous sûr de vouloir modifier cet utilisateur ?</p>
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
      ) : (
        <>
          <div className="header-actions">
            <button 
              onClick={() => navigate("/ajout-utilisateur")} 
              className="button"
            >
              <FaUserPlus className="button-icon" /> Ajouter un Utilisateur
            </button>
            
            <div className="searchContainer-utilisateur">
              <input
                type="text"
                placeholder="Rechercher par nom d'utilisateur"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="searchInput"
              />
            </div>
          </div>

          <div className="table-scroll-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">ID</th>
                  <th className="th">Matricule</th>
                  <th className="th">Nom</th>
                  <th className="th">Email</th>
                  <th className="th">Rôle</th>
                  <th className="th">Site</th>
                  <th className="th">Date de création</th>
                  <th className="th">Statut</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUtilisateurs.length > 0 ? (
                  filteredUtilisateurs.map((utilisateur) => (
                    <tr key={utilisateur.id}>
                      <td className="td">{utilisateur.id}</td>
                      <td className="td">{utilisateur.matricule}</td>
                      <td className="td">{utilisateur.nom_utilisateur}</td>
                      <td className="td">{utilisateur.email}</td>
                      <td className="td">{utilisateur.role}</td>
                      <td className="td">{utilisateur.site}</td>
                      <td className="td">{utilisateur.date_creation}</td>
                      <td className="td">
                        {utilisateur.statut === 1
                          ? "Actif"
                          : utilisateur.statut === 0
                          ? "En attente"
                          : "Désactivé"}
                      </td>
                      <td className="td actions">
                        <button 
                          onClick={() => handleEdit(utilisateur)} 
                          className="button--modifier"
                        >
                          <FaEdit className="button-icon" /> Modifier
                        </button>
                        <button 
                          onClick={() => {
                            setCurrentUserId(utilisateur.id);
                            setShowDeleteConfirmation(true);
                          }} 
                          className="button-supprimer"
                        >
                          <FaTrash className="button-icon" /> Supprimer
                        </button>
                        
                        {(utilisateur.statut === 0 || utilisateur.statut === 2) && (
                          <button 
                            onClick={() => {
                              setCurrentUserId(utilisateur.id);
                              setShowActivateConfirmation(true);
                            }} 
                            className="button-accepter"
                          >
                            <FaCheck className="button-icon" /> Activer
                          </button>
                        )}
                        
                        {utilisateur.statut === 1 && (
                          <button 
                            onClick={() => {
                              setCurrentUserId(utilisateur.id);
                              setShowDeactivateConfirmation(true);
                            }} 
                            className="button-Rejeter-Utilisateur"
                          >
                            <FaBan className="button-icon" /> Désactiver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="td no-data">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {showDeleteConfirmation && (
            <div className="confirmation-dialog-overlay">
              <div className="confirmation-dialog">
                <h3>Confirmation</h3>
                <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
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

          {showActivateConfirmation && (
            <div className="confirmation-dialog-overlay">
              <div className="confirmation-dialog">
                <h3>Confirmation</h3>
                <p>Êtes-vous sûr de vouloir activer ce compte ?</p>
                <div className="confirmation-dialog-actions">
                  <button 
                    className="confirmation-btn confirmation-btn--confirm"
                    onClick={handleActivate}
                  >
                    Oui, activer
                  </button>
                  <button 
                    className="confirmation-btn confirmation-btn--cancel"
                    onClick={() => setShowActivateConfirmation(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDeactivateConfirmation && (
            <div className="confirmation-dialog-overlay">
              <div className="confirmation-dialog">
                <h3>Confirmation</h3>
                <p>Êtes-vous sûr de vouloir désactiver ce compte ?</p>
                <div className="confirmation-dialog-field">
                  <label>Raison de désactivation :</label>
                  <textarea
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    placeholder="Saisissez la raison de désactivation"
                    required
                  />
                </div>
                <div className="confirmation-dialog-actions">
                  <button 
                    className="confirmation-btn confirmation-btn--confirm"
                    onClick={handleDeactivate}
                    disabled={!deactivateReason}
                  >
                    Oui, désactiver
                  </button>
                  <button 
                    className="confirmation-btn confirmation-btn--cancel"
                    onClick={() => {
                      setShowDeactivateConfirmation(false);
                      setDeactivateReason("");
                    }}
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
  );
};

export default GestionUtilisateurs;