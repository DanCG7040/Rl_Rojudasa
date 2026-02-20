import { useState, useEffect } from 'react';
import '../styles/map-section.css';

// Mapas aleatorios - solo estadios concretos. NUNCA usar rocket-league-bg.jpg aquí (es escena de juego).
const ALL_STADIUM_IMAGES = [
  { name: 'DFH Stadium 29', image: '/img/dfh-stadium-29.webp' },
  { name: 'Neon Fields', image: '/img/neon-fields.webp' },
  { name: 'Stadium 98', image: '/img/stadium-98.webp' },
  { name: 'Stadium', image: '/img/stadium-755.jpg' },
  { name: 'Arena', image: '/img/stadium-840.jpeg' },
  { name: 'DFH Arena', image: '/img/dfh-arena.webp' },
  { name: 'Hot Wheels Stadium', image: '/img/hot-wheels-stadium.webp' },
];

const FALLBACK_STADIUM = { name: 'Stadium 98', image: '/img/stadium-98.webp' };

const randomMaps = ALL_STADIUM_IMAGES.filter((m) => !m.image.toLowerCase().includes('rocket-league-bg'));

export default function MapSection() {
  const [currentRandomMap, setCurrentRandomMap] = useState<{ name: string; image: string } | null>(null);

  useEffect(() => {
    const selectRandomMap = () => {
      const list = randomMaps.length > 0 ? randomMaps : [FALLBACK_STADIUM];
      const randomIndex = Math.floor(Math.random() * list.length);
      setCurrentRandomMap(list[randomIndex]);
    };

    selectRandomMap();
    const interval = setInterval(selectRandomMap, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (!el.src.includes('rocket-league-bg')) {
      el.src = FALLBACK_STADIUM.image;
      el.onerror = null;
    }
  };

  return (
    <section className="map-section" id="map">
      <div className="container">
        <h2 className="section-title">ESTADIOS</h2>
        <p className="map-intro">
          Los estadios varían según el estado que escojan los participantes para darle una mejor identidad a la liga
        </p>
        
        {/* Imagen bonita + nombre - diseño simple. Nunca se muestra rocket-league-bg aquí. */}
        {currentRandomMap && (
          <div className="map-display">
            <img 
              src={currentRandomMap.image} 
              alt={currentRandomMap.name} 
              className="map-display-image"
              onError={handleImageError}
            />
            <p className="map-display-name">{currentRandomMap.name}</p>
          </div>
        )}
      </div>
    </section>
  );
}
