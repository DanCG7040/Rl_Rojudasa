import { useEffect, useRef, useState } from 'react';
import PixelIcon from './PixelIcon';
import '../styles/info.css';

interface InfoCard {
  icon: 'calendar' | 'trophy' | 'coin';
  iconImage?: string;
  title: string;
  description: string;
  modalContent: string;
  modalImage?: { name: string; image: string }; // ej. estadio de la final
}

const infoCards: InfoCard[] = [
  {
    icon: 'calendar',
    iconImage: '/icons/Liga.png',
    title: 'Ligas',
    description: 'Se juegan en meses impares con formato ida y vuelta. Sin costo de inscripción.',
    modalContent: `

Las ligas se empezarán a jugar en meses impares: Enero, Marzo, Mayo, Julio, Septiembre y Noviembre.
La idea es que se terminen dentro del mismo mes, pero las vamos a manejar como si fueran bimestrales para tener margen de error.
Ejemplo: Enero-Febrero (la que ya se jugará), Marzo-Abril, y así sucesivamente.

Las ligas se jugarán en diferentes tiempos y no en un día para poder hacer descansos entre los jugadores, que entrenen y den todo su esfuerzo. El formato será ida y vuelta y se jugará en un mes.

Los primeros 4 de la liga asegurarán ser cabezas de serie en el sorteo de la copa del siguiente mes.`
  },
  {
    icon: 'trophy',
    iconImage: '/icons/Copa.png',
    title: 'Copas',
    description: 'Se jugarán en meses pares cada dos meses. Los primeros 4 de la liga serán cabezas de grupo.',
    modalContent: `Las copas se jugarán en meses pares y se manejarán igual que las ligas.
Ejemplo: Febrero-Marzo sería la primera copa, Abril-Mayo, y así con las demás.

Se jugará cada dos meses y los primeros 4 de la liga serán los cabezas de grupo.

Para algunos jugadores que queden de último en la liga tendrán opción de repechaje para poder entrar al torneo.

En el torneo se jugarán el mejor de tres y la final el mejor de 5. La final se disputará en el estadio DFH Stadium (10th Anniversary).`,
    modalImage: {
      name: 'DFH Stadium (10th Anniversary)',
      image: '/img/dfh-stadium.jpg'
    }
  },
  {
    icon: 'coin',
    iconImage: '/icons/Medalla.png',
    title: 'Premio',
    description: 'La liga será gratis. La copa tendrá un valor de 1 a 2 mil pesos para incentivar la competición.',
    modalContent: `Las ligas no tendrán costo de inscripción.

Para darle un toque más competitivo a la copa, tendrá un valor de 1 a 2 mil pesos para incentivar la competición.

La idea es que haya una apuesta de 2k por torneo para meterle más emoción.`
  }
];

export default function TournamentInfo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleCards, setVisibleCards] = useState<boolean[]>([]);
  const [openModal, setOpenModal] = useState<number | null>(null);
  const [showStadiumImage, setShowStadiumImage] = useState(false);
  const [stadiumImageData, setStadiumImageData] = useState<{ image: string; name: string } | null>(null);

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

  const handleCardClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenModal(index);
  };

  const closeModal = () => {
    setOpenModal(null);
  };

  const openStadiumImage = (image: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStadiumImageData({ image, name });
    setShowStadiumImage(true);
  };

  const closeStadiumImage = () => {
    setShowStadiumImage(false);
    setStadiumImageData(null);
  };

  return (
    <>
      <section className="info-section" id="info" ref={sectionRef}>
        <div className="container">
          <h2 className="section-title animate-on-scroll">COMPETENCIAS</h2>
          <div className="info-grid">
            {infoCards.map((card, index) => (
              <div
                key={index}
                onClick={(e) => handleCardClick(index, e)}
                className={`info-card ${visibleCards[index] ? 'animate-on-scroll' : ''}`}
                data-index={index}
              >
                <div className="card-icon">
                  {card.iconImage ? (
                    <img
                      src={card.iconImage}
                      alt={card.title}
                      className={`card-icon-img pixel-icon-img ${card.iconImage.includes('Liga.png') ? 'card-icon-img-no-bg' : ''}`}
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <PixelIcon name={card.icon} size={64} />
                  )}
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modales */}
      {openModal !== null && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="Cerrar">×</button>
            <div className="modal-header">
              <div className="modal-icon">
                {infoCards[openModal].iconImage ? (
                  <img
                    src={infoCards[openModal].iconImage}
                    alt={infoCards[openModal].title}
                    className="modal-icon-img"
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <PixelIcon name={infoCards[openModal].icon} size={64} />
                )}
              </div>
              <h2>{infoCards[openModal].title}</h2>
            </div>
            <div className="modal-body">
              {infoCards[openModal].modalContent.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
              {infoCards[openModal].modalImage && (
                <div className="modal-stadium">
                  <p className="modal-stadium-note">Estadio de la final</p>
                  <h4 className="modal-stadium-title">{infoCards[openModal].modalImage!.name}</h4>
                  <img
                    src={infoCards[openModal].modalImage!.image}
                    alt={infoCards[openModal].modalImage!.name}
                    className="modal-stadium-img modal-stadium-img-clickable"
                    loading="lazy"
                    decoding="async"
                    onClick={(e) => openStadiumImage(infoCards[openModal].modalImage!.image, infoCards[openModal].modalImage!.name, e)}
                    title="Ver imagen"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-close-btn" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver imagen del estadio en grande */}
      {showStadiumImage && stadiumImageData && (
        <div className="stadium-image-overlay" onClick={closeStadiumImage}>
          <div className="stadium-image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeStadiumImage} aria-label="Cerrar">×</button>
            <img src={stadiumImageData.image} alt={stadiumImageData.name} className="stadium-image-full" loading="lazy" decoding="async" />
            <p className="stadium-image-caption">{stadiumImageData.name}</p>
            <div className="modal-footer">
              <button type="button" className="modal-close-btn" onClick={closeStadiumImage}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
