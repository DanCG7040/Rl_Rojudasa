import { useEffect, useState } from 'react';
import '../styles/hero.css';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <h1 className={`hero-title ${isVisible ? 'animate-fade-in' : ''}`}>
          RL ROJUDASA
        </h1>
        <p className={`hero-subtitle ${isVisible ? 'animate-fade-in-delay' : ''}`}>
          LIGAS Y COPAS COMPETITIVAS
        </p>
        <div className={`hero-date ${isVisible ? 'animate-fade-in-delay-2' : ''}`}>
          <span className="date-icon">📅</span>
          <span>Ligas: Meses Impares | Copas: Meses Pares</span>
        </div>
      </div>
    </section>
  );
}
