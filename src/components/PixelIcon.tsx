/**
 * Iconos con estilo pixel (currentColor). Hover → naranja vía CSS.
 * Para más iconos pixelados gratis:
 * - itch.io (buscar "pixel icons" o "free pixel art")
 * - OpenGameArt.org
 * - Kenney.nl (Game Icons, UI Pack)
 * - Flaticon (filtrar por "pixel" o "8 bit")
 * Usa SVG con fill="currentColor" para que el hover naranja funcione.
 */
interface PixelIconProps {
  name: 'calendar' | 'trophy' | 'coin' | 'swords';
  size?: number;
  className?: string;
}

const pixelIcons: Record<string, React.ReactNode> = {
  calendar: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="pixel-icon-svg">
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <rect x="2" y="2" width="3" height="2" />
      <rect x="6" y="2" width="4" height="2" />
      <rect x="11" y="2" width="3" height="2" />
      <rect x="4" y="6" width="2" height="2" />
      <rect x="7" y="6" width="2" height="2" />
      <rect x="10" y="6" width="2" height="2" />
      <rect x="4" y="9" width="2" height="2" />
      <rect x="7" y="9" width="2" height="2" />
      <rect x="10" y="9" width="2" height="2" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="pixel-icon-svg">
      <rect x="3" y="1" width="10" height="2" />
      <rect x="4" y="3" width="8" height="4" />
      <rect x="5" y="7" width="6" height="4" />
      <rect x="2" y="11" width="2" height="4" />
      <rect x="12" y="11" width="2" height="4" />
      <rect x="6" y="11" width="4" height="1" />
      <rect x="5" y="5" width="1" height="1" />
      <rect x="10" y="5" width="1" height="1" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="pixel-icon-svg">
      <rect x="3" y="5" width="10" height="1" />
      <rect x="2" y="6" width="12" height="4" />
      <rect x="3" y="10" width="10" height="1" />
    </svg>
  ),
  swords: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="pixel-icon-svg">
      <rect x="7" y="1" width="2" height="5" />
      <rect x="6" y="6" width="4" height="2" />
      <rect x="2" y="8" width="2" height="6" />
      <rect x="12" y="8" width="2" height="6" />
      <rect x="1" y="14" width="4" height="1" />
      <rect x="11" y="14" width="4" height="1" />
      <rect x="5" y="7" width="2" height="2" />
      <rect x="9" y="7" width="2" height="2" />
    </svg>
  )
};

export default function PixelIcon({ name, size = 64, className = '' }: PixelIconProps) {
  return (
    <span
      className={`pixel-icon-wrapper ${className}`}
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      aria-hidden
    >
      {pixelIcons[name]}
    </span>
  );
}
