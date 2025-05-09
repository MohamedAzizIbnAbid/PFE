import React, { useState, useEffect } from 'react';
import '../styles/PowerBIReport.css';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const getSessionId = () => sessionStorage.getItem('sessionId');
const getItem = key => {
  const sid = getSessionId();
  return sid ? localStorage.getItem(`${key}_${sid}`) : null;
};

const PowerBIReport = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [reportUrl, setReportUrl] = useState('');
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
      setIsRefreshing(true);
      setRefreshKey(prevKey => prevKey + 1);
      setTimeout(() => setIsRefreshing(false), 700);
  };
  
  useEffect(() => {
    const token = getItem('token');
    const role = getItem('role');
   

    if (!token) {
      navigate('/home');
    } else {
      let baseUrl = "https://app.powerbi.com/view?r=eyJrIjoiYzYwZjI1YWItMmEwZC00MTQ1LTlmNjktYWIzYWJlZjJjYzU5IiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9";

      if (role === 'utilisateur') {
        // 👉 Ajouter un filtre pour limiter l'affichage pour un utilisateur
        baseUrl += "&filter=Users/Role eq 'Utilisateur'";
      }
      // Si administrateur ➔ pas de filtre : il voit tout

      setReportUrl(baseUrl);
    }
  }, [navigate]);

  

  return (
    <>
      <Navbar />
      <div className="powerbi-container">
        {reportUrl && (
          <iframe
            key={refreshKey}
            title="Rapport Power BI"
            width="100%"
            height="800"
            src={reportUrl}
            frameBorder="0"
            allowFullScreen={true}
          />
        )}
      </div>

      <div className="export-buttons">
      <button 
    onClick={handleRefresh} 
    className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
>
    {isRefreshing ? '🔄' : '🔄 Rafraîchir'}
</button>
      </div>
    </>
  );
};

export default PowerBIReport;
