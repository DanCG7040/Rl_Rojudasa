import { useEffect, useRef, useState } from 'react';
import '../styles/info.css';

interface InfoCard {
  icon: string;
  title: string;
  description: string;
  link: string;
}

const infoCards: InfoCard[] = [
  {
    icon: '📅',
    title: 'Ligas',
    description: 'Se juegan en meses impares: Enero, Marzo, Mayo, Julio, Septiembre y Noviembre. Sin costo de inscripción. Los primeros 4 aseguran su llave en el sorteo de la copa siguiente.',
    link: '/informacion/ligas'
  },
  {
    icon: '🏆',
    title: 'Copas',
    description: 'Se juegan en meses pares: Febrero, Abril, Junio, Agosto, Octubre y Diciembre. Con costo de entrada. El sorteo se realiza al final de cada liga.',
    link: '/informacion/copas'
  }
];

export default function TournamentInfo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleCards, setVisibleCards] = useState<boolean[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleCards((prev) => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll('.info-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="info-section" id="info" ref={sectionRef}>
      <div className="container">
        <h2 className="section-title animate-on-scroll">COMPETENCIAS</h2>
        <div className="info-grid">
          {infoCards.map((card, index) => (
            <a
              key={index}
              href={card.link}
              className={`info-card ${visibleCards[index] ? 'animate-on-scroll' : ''}`}
              data-index={index}
            >
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

