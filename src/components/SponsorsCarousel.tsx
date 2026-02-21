import { useState, useEffect } from 'react';
import '../styles/sponsors-carousel.css';

const SPONSORS = [
  { src: '/img/taker.png', alt: 'Real Taker Cup' },
  { src: '/img/Rojudasa.png', alt: 'Rojudasa' }
];

export default function SponsorsCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SPONSORS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="sponsors-section" id="patrocinadores">
      <div className="container">
        <h2 className="sponsors-title">Patrocinadores</h2>
        <div className="sponsors-carousel">
          <button
            type="button"
            className="sponsors-carousel-btn prev"
            onClick={() => setCurrent((prev) => (prev - 1 + SPONSORS.length) % SPONSORS.length)}
            aria-label="Anterior"
          >
            ‹
          </button>
          <div className="sponsors-carousel-track">
            {SPONSORS.map((s, i) => (
              <div
                key={s.src}
                className={`sponsors-slide ${i === current ? 'active' : ''}`}
                aria-hidden={i !== current}
              >
                <div className="sponsors-slide-inner">
                  <img src={s.src} alt={s.alt} loading="lazy" />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="sponsors-carousel-btn next"
            onClick={() => setCurrent((prev) => (prev + 1) % SPONSORS.length)}
            aria-label="Siguiente"
          >
            ›
          </button>
          <div className="sponsors-dots">
            {SPONSORS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`sponsors-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Ir a patrocinador ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
