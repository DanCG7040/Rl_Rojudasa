import { useEffect, useState } from 'react';
import '../styles/navigation.css';

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLigaPage, setIsLigaPage] = useState(false);

  useEffect(() => {
    // Detectar si estamos en la página de liga
    const path = window.location.pathname;
    setIsLigaPage(path === '/liga' || path === '/liga/');

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Solo detectar secciones si no estamos en la página de liga
      if (!isLigaPage) {
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
  }, [isLigaPage]);

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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault();
    const currentPath = window.location.pathname;
    const onLigaPage = currentPath === '/liga' || currentPath === '/liga/';
    
    if (onLigaPage && section !== 'liga') {
      // Si estamos en la página de liga y queremos ir a otra sección, ir a la página principal
      window.location.href = `/#${section}`;
    } else if (section === 'liga') {
      window.location.href = '/liga';
    } else {
      scrollToSection(section);
    }
  };

  const handleLogoClick = () => {
    const currentPath = window.location.pathname;
    const onLigaPage = currentPath === '/liga' || currentPath === '/liga/';
    
    if (onLigaPage) {
      window.location.href = '/';
    } else {
      scrollToSection('hero');
    }
  };

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          RL ROJUDASA
        </div>
        <div className="nav-links">
          <a 
            href="#info" 
            className={activeSection === 'info' ? 'active' : ''}
            onClick={(e) => handleNavClick(e, 'info')}
          >
            Sistema
          </a>
          <a 
            href="#rules" 
            className={activeSection === 'rules' ? 'active' : ''}
            onClick={(e) => handleNavClick(e, 'rules')}
          >
            Reglas
          </a>
          <a 
            href="/liga"
            className={(isLigaPage || activeSection === 'league') ? 'active' : ''}
            onClick={(e) => handleNavClick(e, 'liga')}
          >
            Liga
          </a>
          <a 
            href="#upcoming" 
            className={activeSection === 'upcoming' ? 'active' : ''}
            onClick={(e) => handleNavClick(e, 'upcoming')}
          >
            Próximos
          </a>
          <a 
            href="#bracket" 
            className={activeSection === 'bracket' ? 'active' : ''}
            onClick={(e) => handleNavClick(e, 'bracket')}
          >
            Torneo
          </a>
          <a 
            href="#map" 
            className={activeSection === 'map' ? 'active' : ''}
            onClick={(e) => handleNavClick(e, 'map')}
          >
            Estadios
          </a>
        </div>
      </div>
    </nav>
  );
}
