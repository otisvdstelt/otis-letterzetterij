/** De filters die papier gescheurd en verf nat laten lijken, bij naam gebruikt in het stijlblad */
export function PaperFilters() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        {/* De deckle, de rafelige rand van een vel dat met de hand geschept is */}
        <filter id="deckle" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="4" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="deckle-fine" x="-6%" y="-12%" width="112%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="11" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Een kwast die geen rechte lijn houdt */}
        <filter id="wobble" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Pigment dat in nat papier uitloopt */}
        <filter id="bleed" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="2" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="14" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>
    </svg>
  )
}
