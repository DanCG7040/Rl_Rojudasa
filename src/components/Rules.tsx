import { useState } from 'react';
import '../styles/rules.css';

interface Rule {
  number: string;
  title: string;
  description: string;
}

const rules: Rule[] = [
  {
    number: '01',
    title: 'Calendario de Competencias',
    description: 'Las ligas se juegan en meses impares (Enero, Marzo, Mayo, Julio, Septiembre, Noviembre) y se manejan como bimestrales para tener margen. Las copas se juegan en meses pares (Febrero, Abril, Junio, Agosto, Octubre, Diciembre) con el mismo sistema bimestral.'
  },
  {
    number: '02',
    title: 'Sistema de Clasificación',
    description: 'Las ligas no tienen costo de inscripción. Los primeros 4 lugares aseguran ser cabezas de serie en el sorteo de la copa del siguiente mes. Las copas tienen costo de entrada y pueden incluir repechajes.'
  },
  {
    number: '03',
    title: 'Formato de Partidos',
    description: 'Rondas normales: mejor de 3 juegos. Final: mejor de 5 juegos. Los partidos se juegan en horarios diferentes para que cada uno tenga tiempo de practicar y evitar saturación.'
  },
  {
    number: '04',
    title: 'Recompensas',
    description: 'Apuesta de 2k por torneo. El sistema premia tanto la consistencia en ligas como el rendimiento en copas. Los mejores equipos obtienen ventajas competitivas.'
  },
  {
    number: '05',
    title: 'Sistema Propio',
    description: 'Creamos nuestro propio sistema de liga y torneos para que todo quede más organizado y competitivo. Diseñado específicamente para RL ROJUDASA.'
  }
];

export default function Rules() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleRule = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section className="rules-section" id="rules">
      <div className="container">
        <h2 className="section-title animate-on-scroll">¿CÓMO SE JUEGA?</h2>
        <div className="rules-content">
          {rules.map((rule, index) => (
            <div
              key={index}
              className={`rule-item ${expandedIndex === index ? 'expanded' : ''}`}
              onClick={() => toggleRule(index)}
            >
              <div className="rule-header">
                <div className="rule-number">{rule.number}</div>
                <h3>{rule.title}</h3>
                <div className="rule-toggle">
                  {expandedIndex === index ? '−' : '+'}
                </div>
              </div>
              <div className={`rule-description ${expandedIndex === index ? 'show' : ''}`}>
                <p>{rule.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
