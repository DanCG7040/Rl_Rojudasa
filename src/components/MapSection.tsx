import { useState, useEffect } from 'react';
import '../styles/map-section.css';

// DFH Stadium es el mapa principal fijo para la final
const dfhStadium = { 
  name: 'DFH Stadium (10th Anniversary)', 
  image: '/img/dfh-stadium.jpg'
};

// Mapas aleatorios (excluyendo DFH Stadium principal) - imágenes en public/img
const randomMaps = [
  { name: 'DFH Stadium 29', image: '/img/dfh-stadium-29.webp' },
  { name: 'Neon Fields', image: '/img/neon-fields.webp' },
  { name: 'Stadium 98', image: '/img/stadium-98.webp' },
  { name: 'Stadium', image: '/img/stadium-755.jpg' },
  { name: 'Arena', image: '/img/stadium-840.jpeg' },
  { name: 'DFH Arena', image: '/img/dfh-arena.webp' },
  { name: 'Hot Wheels Stadium', image: '/img/hot-wheels.webp' },
];

export default function MapSection() {
  const [currentRandomMap, setCurrentRandomMap] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const selectRandomMap = () => {
      const randomIndex = Math.floor(Math.random() * randomMaps.length);
      setCurrentRandomMap(randomMaps[randomIndex]);
    };

    selectRandomMap();
    const interval = setInterval(selectRandomMap, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="map-section" id="map">
      <div className="container">
        <h2 className="section-title">ESTADIOS</h2>
        <p className="map-intro">
          Los estadios varían según el estado que escojan los participantes para darle una mejor identidad a la liga
        </p>
        
        {/* Imagen bonita + nombre - diseño simple */}
        {currentRandomMap && (
          <div className="map-display">
            <img 
              src={currentRandomMap.image} 
              alt={currentRandomMap.name} 
              className="map-display-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img/dfh-stadium.jpg';
              }}
            />
            <p className="map-display-name">{currentRandomMap.name}</p>
          </div>
        )}

        {/* DFH Stadium - mapa oficial para la final */}
        <div className="map-content dfh-section">
          <div className="map-image-wrapper" onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
            <img src={dfhStadium.image} alt={dfhStadium.name} className="map-image" />
            <div className="map-overlay">
              <div className="map-badge">🏆 FINAL</div>
            </div>
            <div className="map-name-display">
              <h4>{dfhStadium.name}</h4>
            </div>
          </div>
          <div className="map-info">
            <h3>{dfhStadium.name}</h3>
            <p className="map-description">
              Este es el estadio oficial para la final de los torneos. Un estadio icónico que ha sido testigo de las mejores competencias de Rocket League, ahora disponible en su edición especial del 10º aniversario.
            </p>
            <p className="map-note">
              <strong>Nota:</strong> Los participantes pueden elegir entre diferentes estadios según su preferencia y el estado del torneo. Los estadios se asignan aleatoriamente para mantener la diversidad y darle una mejor identidad a la liga.
            </p>
          </div>
        </div>
      </div>

      {/* Modal para ver imagen grande */}
      {showModal && (
        <div className="image-modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <img src={dfhStadium.image} alt={dfhStadium.name} className="modal-image" />
            <p className="modal-caption">{dfhStadium.name}</p>
          </div>
        </div>
      )}
    </section>
  );
}
