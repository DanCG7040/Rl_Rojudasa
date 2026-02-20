import { useEffect, useState } from 'react';
import '../styles/navigation.css';

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Detectar en qué página estamos
    const path = window.location.pathname;
    if (path === '/liga' || path === '/liga/') {
      setCurrentPage('liga');
    } else if (path === '/informacion' || path === '/informacion/') {
      setCurrentPage('informacion');
    } else if (path === '/copa' || path === '/copa/') {
      setCurrentPage('copa');
    } else if (path === '/acerca-de-nosotros' || path === '/acerca-de-nosotros/') {
      setCurrentPage('acerca-de-nosotros');
    } else if (path === '/historico' || path === '/historico/') {
      setCurrentPage('historico');
    } else {
      setCurrentPage('');
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Solo detectar secciones si estamos en la página principal
      if (!currentPage) {
        const sections = ['hero', 'info', 'rules', 'upcoming', 'bracket', 'map'];
        const current = sections.find(section => {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            return rect.top <= 100 && rect.bottom >= 100;
          }
          return false;
        });
        
        if (current) setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, page: string) => {
    e.preventDefault();
    const currentPath = window.location.pathname;
    const isOnPage = currentPath !== '/' && currentPath !== '';
    
    if (isOnPage && page !== currentPath.replace('/', '')) {
      // Si estamos en una página y queremos ir a otra, navegar normalmente
      window.location.href = `/${page}`;
    } else if (page && page !== 'home') {
      window.location.href = `/${page}`;
    } else {
      window.location.href = '/';
    }
  };

  const handleLogoClick = () => {
    const currentPath = window.location.pathname;
    setMenuOpen(false);
    if (currentPath !== '/' && currentPath !== '') {
      window.location.href = '/';
    } else {
      scrollToSection('hero');
    }
  };

  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''} ${menuOpen ? 'nav-menu-open' : ''}`}>
      <div className="nav-container">
        <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          RL ROJUDASA
        </div>
        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>
        <div className="nav-links">
          <a 
            href="/informacion"
            className={currentPage === 'informacion' ? 'active' : ''}
            onClick={(e) => { handleNavClick(e, 'informacion'); handleLinkClick(); }}
          >
            Información
          </a>
          <a 
            href="/liga"
            className={currentPage === 'liga' ? 'active' : ''}
            onClick={(e) => { handleNavClick(e, 'liga'); handleLinkClick(); }}
          >
            Liga
          </a>
          <a 
            href="/copa"
            className={currentPage === 'copa' ? 'active' : ''}
            onClick={(e) => { handleNavClick(e, 'copa'); handleLinkClick(); }}
          >
            Copa
          </a>
          <a 
            href="/historico"
            className={currentPage === 'historico' ? 'active' : ''}
            onClick={(e) => { handleNavClick(e, 'historico'); handleLinkClick(); }}
          >
            Histórico
          </a>
          <a 
            href="/acerca-de-nosotros"
            className={currentPage === 'acerca-de-nosotros' ? 'active' : ''}
            onClick={(e) => { handleNavClick(e, 'acerca-de-nosotros'); handleLinkClick(); }}
          >
            Acerca de nosotros
          </a>
        </div>
      </div>
    </nav>
  );
}
