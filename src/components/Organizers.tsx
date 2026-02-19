import '../styles/organizers.css';

export default function Organizers() {
  return (
    <section className="organizers-section">
      <div className="container">
        <h2 className="section-title">ADMINISTRADORES</h2>
        <p className="section-subtitle">Los organizadores detrás de RL ROJUDASA</p>
        <div className="organizers-grid">
          <div className="organizer-card">
            <div className="organizer-photo">
              <div className="photo-placeholder">DC</div>
            </div>
            <h3 className="organizer-name">Daniel Cardenas</h3>
            <p className="organizer-info">
              Creador y organizador principal de RL ROJUDASA. Encargado del desarrollo del sistema propio de ligas y torneos, gestión de competencias y coordinación de eventos.
            </p>
            <div className="organizer-role">
              <span className="role-icon">👑</span>
              <span>Fundador & Organizador Principal</span>
            </div>
          </div>
          <div className="organizer-card">
            <div className="organizer-photo">
              <div className="photo-placeholder">JJR</div>
            </div>
            <h3 className="organizer-name">Juan Jose Roldan</h3>
            <p className="organizer-info">
              Co-organizador y desarrollador del sistema técnico. Trabaja en conjunto con Daniel para mantener y mejorar la plataforma de competencias, asegurando que todo funcione de manera organizada y competitiva.
            </p>
            <div className="organizer-role">
              <span className="role-icon">⚙️</span>
              <span>Co-organizador & Desarrollador</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
