import { useEffect, useState } from 'react';
import '../styles/upcoming-matches.css';

interface Match {
  id: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  type: string;
}

export default function UpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 4;

  useEffect(() => {
    fetch('/api/data.json')
      .then(res => res.json())
      .then(data => setMatches(data.upcomingMatches))
      .catch(err => console.error('Error loading matches:', err));
  }, []);

  const totalSlides = Math.ceil(matches.length / itemsPerView);
  const showCarousel = matches.length > itemsPerView;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const TWITCH_URL = 'https://www.twitch.tv/dancg7040';

  const visibleMatches = matches.slice(
    currentIndex * itemsPerView,
    currentIndex * itemsPerView + itemsPerView
  );

  return (
    <section className="upcoming-matches-section" id="upcoming">
      <div className="container">
        <h2 className="section-title">PRÓXIMOS PARTIDOS</h2>
        <div className="matches-container">
          {showCarousel && (
            <button className="carousel-btn prev" onClick={prevSlide}>
              ‹
            </button>
          )}
          <div className={`matches-grid ${showCarousel ? 'carousel' : ''}`}>
            {visibleMatches.map((match) => (
              <a
                key={match.id}
                href={TWITCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="match-card match-card-link"
                title="Ver partido en Twitch"
              >
                <div className="match-type">{match.type}</div>
                <div className="match-teams">
                  <div className="team">{match.team1}</div>
                  <div className="vs">VS</div>
                  <div className="team">{match.team2}</div>
                </div>
                <div className="match-date-time">
                  <span className="date">{match.date}</span>
                  <span className="time">{match.time}</span>
                </div>
                <span className="match-watch-label">▶ Ver en Twitch</span>
              </a>
            ))}
          </div>
          {showCarousel && (
            <button className="carousel-btn next" onClick={nextSlide}>
              ›
            </button>
          )}
          {showCarousel && (
            <div className="carousel-dots">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
