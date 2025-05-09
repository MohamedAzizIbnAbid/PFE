import React, { useState, useEffect } from 'react'; // Ajout de useState dans les imports
import { useNavigate } from 'react-router-dom';
import '../styles/Page Entrée.css';
import heroBackground from '../assets/image.png';
import logoLeoni from '../assets/logo-leoni.png';
import factoryImage from '../assets/factory.jpg';
import technologyImage from '../assets/technology.jpg';
import reportingImage from '../assets/Web reporting.jpg';
import FacebookIcon from '../assets/facebook.jpg';
import LinkedInIcon from '../assets/linkedin.jpg';

const Accueil = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('about'); // Déplacé au niveau du composant principal

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'expertise', 'reporting', 'contact'];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-animate').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  
  const services = [
    {
      title: "Systèmes de Câblage Automobile",
      description: "Solutions complètes de câblage sur mesure pour véhicules particuliers et utilitaires",
      icon: "⚡"
    },
    {
      title: "Innovation Technologique",
      description: "Recherche et développement de solutions connectées pour la mobilité du futur",
      icon: "🔍"
    },
    {
      title: "Excellence Industrielle", 
      description: "Processus de fabrication optimisés et certifications qualité de haut niveau",
      icon: "🏆"
    }
  ];

  const stats = [
    { value: "75+", label: "Années d'expérience" },
    { value: "100 000+", label: "Collaborateurs mondiaux" },
    { value: "40+", label: "Sites de production" },
    { value: "1M+", label: "Véhicules équipés quotidiennement" }
  ];

  return (
    <div className="accueil-container">
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <img src={logoLeoni} alt="Leoni Tunisie Logo" />
          </div>
          <nav className="nav-links">
  <a href="#about" className={activeSection === 'about' ? 'active' : ''}>À propos</a>
  <a href="#expertise" className={activeSection === 'expertise' ? 'active' : ''}>Expertise</a>
  <a href="#reporting" className={activeSection === 'reporting' ? 'active' : ''}>Reporting</a>
  <a href="#contact" className={activeSection === 'contact' ? 'active' : ''}>Contact</a>
</nav>
          <button onClick={handleLoginClick} className="login-button">
            Espace Collaborateur
          </button>
        </div>
      </header>

      <section 
        id="hero" 
        className="hero-section section-anchor scroll-animate"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), url(${heroBackground})` }}
      >
        <div className="hero-content">
          <h1>LEONI Tunisie</h1>
          <p className="hero-subtitle">Leader mondial en solutions de câblage automobile et data management</p>
          <button 
            className="cta-button" 
            onClick={() => document.getElementById('expertise')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Découvrir notre expertise
          </button>
        </div>
      </section>

      <section id="stats" className="stats-section scroll-animate">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="about-section section-anchor scroll-animate">
        <div className="about-content">
          <div className="about-text">
            <h2>Notre Histoire et Vision</h2>
            <p>
              Fondé en 1917, LEONI est aujourd'hui un acteur majeur dans l'industrie automobile mondiale. 
              Notre site tunisien, établi en 2006, incarne l'excellence opérationnelle et l'innovation 
              technologique qui font la réputation du groupe.
            </p>
            <p>
              Notre mission : Développer des solutions de connectivité avancées qui façonnent l'avenir 
              de la mobilité tout en garantissant qualité, sécurité et performance environnementale.
            </p>
          </div>
          <div className="about-image">
            <img src={factoryImage} alt="Usine LEONI Tunisie" />
          </div>
        </div>
      </section>

      <section id="expertise" className="expertise-section section-anchor scroll-animate">
        <div className="section-header">
          <h2>Notre Expertise Industrielle</h2>
          <p>Des solutions intégrées pour l'industrie 4.0</p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card scroll-animate">
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="objectives" className="objectives-section scroll-animate">
        <div className="objectives-content">
          <h2>Nos Engagements Stratégiques</h2>
          <div className="objectives-grid">
            <div className="objective-card">
              <h3>Innovation Continue</h3>
              <p>Investissement constant en R&D pour anticiper les besoins du marché</p>
            </div>
            <div className="objective-card">
              <h3>Développement Durable</h3>
              <p>Approche éco-responsable dans tous nos processus industriels</p>
            </div>
            <div className="objective-card">
              <h3>Excellence Opérationnelle</h3>
              <p>Optimisation continue via le lean manufacturing et l'automatisation</p>
            </div>
          </div>
        </div>
      </section>

      <section id="reporting" className="reporting-section section-anchor scroll-animate">
        <div className="reporting-content">
          <div className="reporting-image">
            <img src={reportingImage} alt="Reporting LEONI" />
          </div>
          <div className="reporting-text">
            <h2>L'Importance du Reporting</h2>
            <p>
              Chez LEONI Tunisie, notre système de reporting avancé est au cœur de notre performance :
            </p>
            <ul>
              <li>Suivi en temps réel des indicateurs clés de production</li>
              <li>Analyse prédictive pour l'optimisation des ressources</li>
              <li>Transparence totale pour nos clients et partenaires</li>
              <li>Détection proactive des anomalies et amélioration continue</li>
            </ul>
            <p>
              Nos tableaux de bord personnalisés permettent une prise de décision éclairée à tous 
              les niveaux de l'organisation.
            </p>
          </div>
        </div>
      </section>

      <section id="technology" className="technology-section scroll-animate">
        <div className="technology-content">
          <div className="technology-text">
            <h2>Technologies de Pointe</h2>
            <p>
              Nous intégrons les dernières avancées technologiques dans nos processus:
            </p>
            <div className="tech-features">
              <div className="tech-feature">
                <h4>Automatisation Intelligente</h4>
                <p>Robots collaboratifs et lignes de production automatisées</p>
              </div>
              <div className="tech-feature">
                <h4>Data Analytics</h4>
                <p>Exploitation des données pour l'amélioration continue</p>
              </div>
              <div className="tech-feature">
                <h4>Connectivité 4.0</h4>
                <p>Solutions IoT pour le monitoring à distance</p>
              </div>
            </div>
          </div>
          <div className="technology-image">
            <img src={technologyImage} alt="Technologie LEONI" />
          </div>
        </div>
      </section>

      <section id="cta" className="cta-section scroll-animate">
        <h2>Prêt à découvrir notre écosystème ?</h2>
        <button 
          className="cta-button" 
          onClick={handleLoginClick}
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Accédez à votre espace
        </button>
      </section>

      <footer id="contact" className="footer section-anchor scroll-animate">
        <div className="footer-content">
          <div className="footer-section">
            <img src={logoLeoni} alt="LEONI Logo" className="footer-logo" />
            <p>Innovation, Qualité, Performance</p>
          </div>
          <div className="footer-section">
            <h3>Contactez-nous</h3>
            <p>📍 Zone Industrielle, Messaadine</p>
            <p>📧 arij.bach@leoni.com</p>
            <p>📞 +216 31 30 2202</p>
          </div>
          <div className="footer-section">
            <h3>Réseaux Sociaux</h3>
            <div className="social-icons">
              <a href="https://www.linkedin.com/company/leoni/" aria-label="LinkedIn">
                <img src={LinkedInIcon} alt="LinkedIn" />
              </a>
              <a href="https://www.facebook.com/LEONI.tunisia" aria-label="Facebook">
                <img src={FacebookIcon} alt="Facebook" />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 LEONI Tunisie. Tous droits réservés. | Politique de confidentialité</p>
        </div>
      </footer>
    </div>
  );
};

export default Accueil;