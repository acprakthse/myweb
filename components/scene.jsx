/* global React */
/* ============================================================
   HandDrawnScene — animated ink sketch of Smålandshamn port
   Richer skyline + 3 turbines + 2 PV arrays + BESS rack cluster
   + multiple cars + ship berthing with shore-power cable
   ============================================================ */

const HandDrawnScene = () => {
  return (
    <svg
      viewBox="0 0 1400 780"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-label="Hand-drawn port energy system illustration"
    >
      {/* ---------- CLOUDS ---------- */}
      <g style={{ animation: 'cloud-drift 14s ease-in-out infinite alternate' }}>
        <path className="ink"
          d="M 680 110 q -18 -30 -50 -22 q -10 -22 -38 -18 q -24 4 -28 24 q -26 -2 -30 20 q 4 14 22 14 l 130 0 q 16 -2 -6 -18 z" />
      </g>
      <g style={{ animation: 'cloud-drift 18s ease-in-out infinite alternate-reverse' }}>
        <path className="ink-thin"
          d="M 1060 80 q -14 -24 -40 -18 q -8 -16 -30 -14 q -20 4 -22 18 q -20 0 -22 14 q 4 10 16 10 l 104 0 q 12 -2 -6 -10 z" />
      </g>
      <g style={{ animation: 'cloud-drift 22s ease-in-out infinite alternate' }}>
        <path className="ink-thin"
          d="M 320 70 q -10 -18 -30 -14 q -6 -12 -22 -10 q -16 2 -18 14 q -16 0 -18 10 q 4 8 14 8 l 80 0 q 10 -2 -6 -8 z" opacity="0.7"/>
      </g>

      {/* ---------- SUN ---------- */}
      <g transform="translate(160, 150)">
        <g style={{ transformOrigin: '0 0', animation: 'spin-slow 40s linear infinite' }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30) * Math.PI / 180;
            const r1 = 62, r2 = i % 2 === 0 ? 92 : 82;
            const x1 = Math.cos(a) * r1, y1 = Math.sin(a) * r1;
            const x2 = Math.cos(a) * r2, y2 = Math.sin(a) * r2;
            return <line key={i} className="ink" x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
        <circle className="ink" cx="0" cy="0" r="48" fill="rgba(244,162,97,0.18)" />
        <circle className="ink-thin" cx="-4" cy="-6" r="44" fill="none" opacity="0.6" />
      </g>

      {/* ---------- PLANE ---------- */}
      <g style={{ animation: 'cloud-drift 22s linear infinite' }}>
        <g transform="translate(560, 170) rotate(-10)">
          <path className="ink" d="M -24 0 L 24 0 L 30 -4 L 16 -6 L 6 -18 L 2 -18 L 8 -6 L -12 -6 L -18 -12 L -22 -12 L -18 -4 L -28 -2 Z"
            fill="rgba(251,251,247,0.6)" />
          <path className="ink-thin" d="M -40 6 q -20 -2 -34 6" opacity="0.5" strokeDasharray="3 4" />
        </g>
      </g>

      {/* ---------- SKYLINE: 5 buildings ---------- */}
      {/* Bldg A — tallest */}
      <g transform="translate(240, 320)">
        <rect className="ink" x="0" y="0" width="70" height="200" fill="rgba(245,239,224,0.5)" />
        {[0,1,2,3,4,5,6].map(r => [0,1,2].map(c => (
          <rect key={`a-${r}-${c}`} className="ink-thin"
            x={10 + c*18} y={18 + r*25} width="10" height="14"
            fill="rgba(244,162,97,0.35)"
            style={{ animation: `flicker-led ${3 + (r+c)%3}s ease-in-out ${(r*3+c)*0.4}s infinite` }} />
        )))}
      </g>
      {/* Bldg B — short wide */}
      <g transform="translate(320, 360)">
        <rect className="ink" x="0" y="0" width="96" height="160" fill="rgba(245,239,224,0.5)" />
        {[0,1,2,3,4].map(r => [0,1,2,3].map(c => (
          <rect key={`b-${r}-${c}`} className="ink-thin"
            x={10 + c*20} y={14 + r*28} width="12" height="16"
            fill="rgba(244,162,97,0.3)"
            style={{ animation: `flicker-led ${3 + (r*c+1)%4}s ease-in-out ${(r*4+c)*0.3}s infinite` }} />
        )))}
        {/* rooftop PV on bldg B */}
        <path className="ink-thin" d="M 6 -4 L 90 -4 L 96 0 L 0 0 Z" fill="rgba(38,70,83,0.3)" />
        {[0,1,2,3,4].map(i => (
          <line key={i} className="ink-thin" x1={6 + i*18} y1="-4" x2={6 + i*18} y2="0" opacity="0.6"/>
        ))}
      </g>
      {/* Bldg C — medium tower */}
      <g transform="translate(430, 300)">
        <rect className="ink" x="0" y="0" width="58" height="220" fill="rgba(245,239,224,0.5)" />
        {[0,1,2,3,4,5,6,7].map(r => [0,1].map(c => (
          <rect key={`c-${r}-${c}`} className="ink-thin"
            x={8 + c*24} y={16 + r*24} width="14" height="12"
            fill="rgba(244,162,97,0.35)"
            style={{ animation: `flicker-led ${4 + (r+c)%3}s ease-in-out ${(r*2+c)*0.5}s infinite` }} />
        )))}
        <path className="ink" d="M 0 0 L 29 -18 L 58 0 Z" fill="rgba(245,239,224,0.5)" />
      </g>
      {/* Bldg D — wide low behind */}
      <g transform="translate(500, 380)">
        <rect className="ink" x="0" y="0" width="140" height="140" fill="rgba(245,239,224,0.45)" />
        {[0,1,2,3].map(r => [0,1,2,3,4].map(c => (
          <rect key={`d-${r}-${c}`} className="ink-thin"
            x={10 + c*25} y={14 + r*28} width="14" height="16"
            fill="rgba(244,162,97,0.28)"
            style={{ animation: `flicker-led ${3.5 + (r*c+1)%4}s ease-in-out ${(r*5+c)*0.25}s infinite` }} />
        )))}
      </g>
      {/* Bldg E — slim back */}
      <g transform="translate(655, 340)">
        <rect className="ink" x="0" y="0" width="44" height="180" fill="rgba(245,239,224,0.45)" />
        {[0,1,2,3,4,5].map(r => (
          <rect key={`e-${r}`} className="ink-thin"
            x={8} y={14 + r*26} width="28" height="14"
            fill="rgba(244,162,97,0.3)"
            style={{ animation: `flicker-led ${4 + r%3}s ease-in-out ${r*0.4}s infinite` }} />
        ))}
      </g>

      {/* ---------- WIND TURBINES x3 ---------- */}
      {/* Turbine 1 — large, foreground right */}
      <g transform="translate(900, 330)">
        <path className="ink" d="M 0 0 L -6 240 L 6 240 L 2 0 Z" fill="rgba(245,239,224,0.4)" />
        <circle className="ink" cx="0" cy="0" r="10" fill="var(--cream)" />
        <g style={{ transformOrigin: '0 0', animation: 'spin-med 5s linear infinite' }}>
          {[0, 120, 240].map(deg => (
            <g key={deg} transform={`rotate(${deg})`}>
              <path className="ink" d="M 0 0 Q 20 -30 60 -110 Q 66 -116 64 -108 Q 30 -14 4 6 Z"
                fill="rgba(251,251,247,0.7)" />
            </g>
          ))}
          <circle cx="0" cy="0" r="6" fill="var(--ink)" />
        </g>
      </g>
      {/* Turbine 2 — back, medium */}
      <g transform="translate(1070, 380)">
        <path className="ink" d="M 0 0 L -4 190 L 4 190 L 2 0 Z" fill="rgba(245,239,224,0.4)" />
        <circle className="ink" cx="0" cy="0" r="7" fill="var(--cream)" />
        <g style={{ transformOrigin: '0 0', animation: 'spin-med 6s linear infinite reverse' }}>
          {[0, 120, 240].map(deg => (
            <g key={deg} transform={`rotate(${deg})`}>
              <path className="ink" d="M 0 0 Q 14 -22 44 -80 Q 50 -84 48 -78 Q 22 -10 2 4 Z"
                fill="rgba(251,251,247,0.7)" />
            </g>
          ))}
          <circle cx="0" cy="0" r="4" fill="var(--ink)" />
        </g>
      </g>
      {/* Turbine 3 — far back, small */}
      <g transform="translate(1200, 410)">
        <path className="ink-thin" d="M 0 0 L -3 160 L 3 160 L 2 0 Z" fill="rgba(245,239,224,0.3)" />
        <circle className="ink-thin" cx="0" cy="0" r="5" fill="var(--cream)" />
        <g style={{ transformOrigin: '0 0', animation: 'spin-med 7s linear infinite' }}>
          {[0, 120, 240].map(deg => (
            <g key={deg} transform={`rotate(${deg})`}>
              <path className="ink-thin" d="M 0 0 Q 10 -16 32 -58 Q 36 -60 34 -56 Q 16 -8 2 4 Z"
                fill="rgba(251,251,247,0.6)" />
            </g>
          ))}
          <circle cx="0" cy="0" r="3" fill="var(--ink)" />
        </g>
      </g>

      {/* ---------- SOLAR PV ARRAYS x2 ---------- */}
      {/* PV array 1 — large ground-mounted */}
      <g transform="translate(450, 550)">
        <path className="ink" d="M 0 40 L 260 40 L 300 0 L 40 0 Z" fill="rgba(38,70,83,0.14)" />
        <path className="ink-thin" d="M 10 30 L 270 30 L 310 -10" opacity="0.5" />
        <path className="ink-thin" d="M 20 20 L 280 20 L 320 -20" opacity="0.5" />
        {[0,1,2,3,4,5,6,7].map(i => (
          <path key={i} className="ink-thin"
            d={`M ${i*38} 40 L ${i*38 + 40} 0`} opacity="0.5" />
        ))}
        <g style={{ animation: 'pulse-ink 3s ease-in-out infinite' }}>
          <path d="M 90 20 L 210 20 L 230 4 L 110 4 Z" fill="rgba(244,162,97,0.22)" />
        </g>
        <line className="ink" x1="30" y1="40" x2="26" y2="60" />
        <line className="ink" x1="260" y1="40" x2="264" y2="60" />
      </g>
      {/* PV array 2 — smaller, to the right */}
      <g transform="translate(780, 560)">
        <path className="ink" d="M 0 32 L 170 32 L 200 0 L 30 0 Z" fill="rgba(38,70,83,0.14)" />
        <path className="ink-thin" d="M 8 24 L 178 24 L 208 -8" opacity="0.5" />
        {[0,1,2,3,4,5].map(i => (
          <path key={i} className="ink-thin"
            d={`M ${i*32} 32 L ${i*32 + 30} 0`} opacity="0.5" />
        ))}
        <g style={{ animation: 'pulse-ink 3.5s ease-in-out infinite' }}>
          <path d="M 60 18 L 140 18 L 156 4 L 76 4 Z" fill="rgba(244,162,97,0.22)" />
        </g>
        <line className="ink" x1="20" y1="32" x2="18" y2="48" />
        <line className="ink" x1="170" y1="32" x2="172" y2="48" />
      </g>

      {/* ---------- BESS RACK CLUSTER (styled after reference) ---------- */}
      {/* 4 rack groups in an isometric-ish layout */}
      <g transform="translate(80, 520)">
        <BessRackGroup x={0}   y={30} count={3} scale={1}    opacity={1} />
        <BessRackGroup x={120} y={10} count={3} scale={1.05} opacity={1} />
        <BessRackGroup x={240} y={30} count={3} scale={1}    opacity={0.95} />
        <BessRackGroup x={340} y={50} count={3} scale={0.9}  opacity={0.9} />
        {/* label removed */}
        <g transform="translate(170, -6)">
        </g>
      </g>

      {/* ---------- GROUND LINE ---------- */}
      <line className="ink" x1="0" y1="670" x2="1400" y2="670" />
      <line className="ink-thin" x1="0" y1="674" x2="1400" y2="674" opacity="0.5" />

      {/* ---------- CARS x3 + EV CHARGER ---------- */}
      <g transform="translate(580, 648)">
        {/* sedan EV */}
        <CarShape fill="rgba(82,183,136,0.28)" />
      </g>
      <g transform="translate(680, 648)">
        {/* hatchback */}
        <CarShape fill="rgba(244,162,97,0.28)" windowFill="rgba(251,251,247,0.55)" />
      </g>
      <g transform="translate(780, 648)">
        {/* SUV darker */}
        <CarShape fill="rgba(38,70,83,0.22)" bigger />
      </g>

      {/* EV charger station */}
      <g transform="translate(860, 620)">
        <rect className="ink" x="0" y="0" width="44" height="60" fill="rgba(245,239,224,0.6)" />
        <rect className="ink-thin" x="6" y="6" width="32" height="16" fill="rgba(82,183,136,0.25)" />
        {/* small charger indicator light */}
        <circle cx="22" cy="44" r="4" fill="var(--terra)"
          style={{ animation: 'pulse-ink 1.2s ease-in-out infinite' }} />
        <path d="M 20 36 L 18 46 L 22 46 L 20 54 L 26 42 L 22 42 Z" fill="var(--terra)" opacity="0.9" />
        <path d="M 0 20 Q -30 30 -50 38"
          stroke="var(--sage)" strokeWidth="2.5" fill="none" strokeLinecap="round"
          strokeDasharray="6 6"
          style={{ animation: 'charge-flow 1.2s linear infinite' }} />
      </g>

      {/* ---------- WATER / WAVES ---------- */}
      <g clipPath="url(#water-clip)">
        <rect x="0" y="670" width="1400" height="110" fill="rgba(38,70,83,0.08)" />
        <g style={{ animation: 'wave-shift 6s linear infinite' }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <path key={`w1-${i}`} className="ink-thin"
              d={`M ${i*64} 712 q 16 -6 32 0 q 16 6 32 0`} opacity="0.6" />
          ))}
        </g>
        <g style={{ animation: 'wave-shift 9s linear infinite' }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <path key={`w2-${i}`} className="ink-thin"
              d={`M ${i*64 - 20} 742 q 14 -4 28 0 q 14 4 28 0`} opacity="0.4" />
          ))}
        </g>
      </g>
      <defs>
        <clipPath id="water-clip">
          <rect x="0" y="670" width="1400" height="110" />
        </clipPath>
      </defs>

      {/* ---------- DOCK / PIER ---------- */}
      <g>
        {/* pier surface */}
        <rect className="ink" x="940" y="666" width="240" height="10" fill="rgba(38,70,83,0.35)" />
        {/* pier pilings going into water */}
        {[0,1,2,3,4,5].map(i => (
          <line key={`pil-${i}`} className="ink" x1={960 + i*40} y1="676" x2={960 + i*40} y2="730" opacity="0.7" />
        ))}
        {/* bollards on pier */}
        <g transform="translate(970, 650)">
          <rect className="ink" x="-6" y="0" width="12" height="16" fill="rgba(38,70,83,0.5)" />
          <ellipse className="ink" cx="0" cy="0" rx="7" ry="3" fill="rgba(38,70,83,0.5)" />
        </g>
        <g transform="translate(1150, 650)">
          <rect className="ink" x="-6" y="0" width="12" height="16" fill="rgba(38,70,83,0.5)" />
          <ellipse className="ink" cx="0" cy="0" rx="7" ry="3" fill="rgba(38,70,83,0.5)" />
        </g>

        {/* OPS shore-power cabinet on pier */}
        <g transform="translate(1010, 618)">
          <rect className="ink" x="0" y="0" width="36" height="48" fill="rgba(82,183,136,0.35)" />
          <rect className="ink-thin" x="4" y="6" width="28" height="12" fill="rgba(251,251,247,0.75)" />
          <circle className="ink-thin" cx="10" cy="28" r="3" fill="rgba(244,162,97,0.8)"
            style={{ animation: 'flicker-led 1.2s ease-in-out infinite' }} />
          <circle className="ink-thin" cx="20" cy="28" r="3" fill="rgba(82,183,136,0.8)"
            style={{ animation: 'flicker-led 1.5s ease-in-out 0.3s infinite' }} />
          <line className="ink-thin" x1="4" y1="38" x2="32" y2="38" />
          <line className="ink-thin" x1="4" y1="42" x2="32" y2="42" />
          {/* lightning bolt */}
          <path d="M 22 20 L 14 32 L 19 32 L 14 44 L 24 30 L 19 30 Z" fill="var(--terra)"
            style={{ animation: 'pulse-ink 1.4s ease-in-out infinite' }} />
        </g>
      </g>

      {/* ---------- SHIP (berthed, receiving shore power from OPS) ---------- */}
      <g transform="translate(1100, 680)" style={{ animation: 'bob 4s ease-in-out infinite' }}>
        {/* hull */}
        <path className="ink" d="M -120 0 L 120 0 L 105 34 L -105 34 Z" fill="rgba(196,69,54,0.32)" />
        {/* hull stripe */}
        <path className="ink-thin" d="M -118 6 L 118 6" opacity="0.6" />
        <path d="M -116 8 L 116 8 L 114 14 L -114 14 Z" fill="rgba(251,251,247,0.5)" />
        {/* waterline */}
        <line className="ink-thin" x1="-110" y1="22" x2="110" y2="22" opacity="0.5" />
        {/* hull anchor port */}
        <circle className="ink" cx="-96" cy="16" r="3" fill="var(--ink)" />
        {/* main deck */}
        <rect className="ink" x="-78" y="-30" width="156" height="30" fill="rgba(251,251,247,0.82)" />
        {/* upper deck */}
        <rect className="ink" x="-48" y="-58" width="92" height="28" fill="rgba(251,251,247,0.82)" />
        {/* bridge */}
        <rect className="ink" x="-22" y="-80" width="44" height="22" fill="rgba(251,251,247,0.82)" />
        {/* bridge windows */}
        <rect x="-18" y="-76" width="40" height="10" fill="rgba(38,70,83,0.55)" />
        {/* lifeboats */}
        <ellipse className="ink" cx="-60" cy="-16" rx="10" ry="4" fill="rgba(244,162,97,0.7)" />
        <ellipse className="ink" cx="-38" cy="-16" rx="10" ry="4" fill="rgba(244,162,97,0.7)" />
        <ellipse className="ink" cx="38" cy="-16" rx="10" ry="4" fill="rgba(244,162,97,0.7)" />
        <ellipse className="ink" cx="60" cy="-16" rx="10" ry="4" fill="rgba(244,162,97,0.7)" />
        {/* portholes / windows (lit when receiving power) */}
        {[0,1,2,3,4,5,6].map(i => (
          <rect key={`sw1-${i}`} className="ink-thin"
            x={-68 + i*20} y="-26" width="10" height="6"
            fill="rgba(244,162,97,0.75)"
            style={{ animation: `flicker-led ${2.5 + (i%3)*0.7}s ease-in-out ${i*0.2}s infinite` }} />
        ))}
        {[0,1,2,3,4].map(i => (
          <rect key={`sw2-${i}`} className="ink-thin"
            x={-40 + i*18} y="-52" width="10" height="10"
            fill="rgba(244,162,97,0.7)"
            style={{ animation: `flicker-led ${3 + (i%2)*0.8}s ease-in-out ${i*0.25}s infinite` }} />
        ))}
        {/* funnel */}
        <rect className="ink" x="28" y="-48" width="16" height="22" fill="rgba(196,69,54,0.6)" />
        <rect className="ink-thin" x="30" y="-46" width="12" height="4" fill="rgba(38,70,83,0.5)" />
        {/* mast */}
        <line className="ink" x1="0" y1="-80" x2="0" y2="-104" />
        <line className="ink-thin" x1="-8" y1="-96" x2="8" y2="-96" />
        {/* flag (waving) */}
        <g style={{ transformOrigin: '0 -104px', animation: 'bob 2s ease-in-out infinite' }}>
          <path className="ink" d="M 0 -104 Q 10 -102 18 -100 Q 12 -98 14 -96 Q 8 -94 0 -96 Z" fill="var(--terra)" />
        </g>
        {/* navigation lights */}
        <circle cx="-22" cy="-78" r="2" fill="var(--terra)"
          style={{ animation: 'flicker-led 1s ease-in-out infinite' }} />
        <circle cx="22" cy="-78" r="2" fill="var(--sage)"
          style={{ animation: 'flicker-led 1.1s ease-in-out 0.4s infinite' }} />

        {/* SHORE POWER CABLE — from OPS cabinet to ship power inlet */}
        {/* main cable droop */}
        <path
          d="M -96 -14 Q -70 6 -40 4 Q -20 2 -6 -10"
          stroke="var(--ink)" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.55"
        />
        {/* animated electricity flowing along cable */}
        <path
          d="M -96 -14 Q -70 6 -40 4 Q -20 2 -6 -10"
          stroke="var(--sage)" strokeWidth="2.8" fill="none" strokeLinecap="round"
          strokeDasharray="6 7"
          style={{ animation: 'charge-flow 1.1s linear infinite' }}
        />
        {/* ship power inlet socket (glowing) */}
        <g transform="translate(-6, -10)">
          <rect className="ink" x="-6" y="-5" width="12" height="10" fill="rgba(82,183,136,0.6)" />
          <circle cx="0" cy="0" r="3" fill="var(--terra)"
            style={{ animation: 'pulse-ink 1s ease-in-out infinite' }} />
        </g>
        {/* energy particles along cable */}
        {[0, 0.33, 0.66].map((d, i) => (
          <circle key={`p-${i}`} r="2.5" fill="var(--terra)"
            style={{ animation: `cable-particle 2s linear ${d * 2}s infinite`, opacity: 0.9 }}>
            <animateMotion dur="2s" repeatCount="indefinite" begin={`${d * 2}s`}
              path="M -96 -14 Q -70 6 -40 4 Q -20 2 -6 -10" />
          </circle>
        ))}
      </g>

      {/* seagulls */}
      <g style={{ animation: 'cloud-drift 30s ease-in-out infinite alternate' }}>
        <path className="ink-thin" d="M 820 200 q 6 -8 12 0 q 6 -8 12 0" fill="none" />
        <path className="ink-thin" d="M 860 220 q 5 -6 10 0 q 5 -6 10 0" fill="none" />
        <path className="ink-thin" d="M 780 240 q 4 -5 8 0 q 4 -5 8 0" fill="none" />
      </g>
    </svg>
  );
};

/* ---------- BESS rack group sub-component (reference-inspired) ---------- */
const BessRackGroup = ({ x, y, count = 3, scale = 1, opacity = 1 }) => {
  // Each rack: box with red cap + vertical vents + small lightning bolt
  const W = 26 * scale, H = 58 * scale, depth = 10 * scale;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
      {/* ground shadow */}
      <ellipse cx={count * 14} cy={H + 6} rx={count * 18} ry="4" fill="rgba(27,67,50,0.18)" />
      {Array.from({ length: count }).map((_, i) => {
        const xo = i * (W * 0.78);
        return (
          <g key={i} transform={`translate(${xo}, 0)`}>
            {/* side face (darker) */}
            <path className="ink"
              d={`M ${W} 12 L ${W + depth} 6 L ${W + depth} ${H - 4} L ${W} ${H + 2} Z`}
              fill="rgba(38,70,83,0.3)" />
            {/* front box */}
            <rect className="ink" x="0" y="12" width={W} height={H - 10}
              fill="rgba(251,251,247,0.88)" />
            {/* red cap (top) */}
            <path className="ink"
              d={`M 0 12 L ${W} 12 L ${W + depth} 6 L ${depth} 6 Z`}
              fill="var(--terra)" />
            {/* vents — vertical lines */}
            {Array.from({ length: 5 }).map((_, v) => (
              <line key={v} className="ink-thin"
                x1={3 + v * 5} y1={22} x2={3 + v * 5} y2={H - 4}
                opacity="0.7" />
            ))}
            {/* lightning bolt */}
            <path
              d={`M ${W * 0.5 - 3} ${H * 0.35} L ${W * 0.5 + 2} ${H * 0.35} L ${W * 0.5 - 1} ${H * 0.52} L ${W * 0.5 + 4} ${H * 0.52} L ${W * 0.5 - 3} ${H * 0.72} L ${W * 0.5} ${H * 0.56} L ${W * 0.5 - 5} ${H * 0.56} Z`}
              fill="var(--terra)"
              style={{ animation: `pulse-ink ${1.5 + i * 0.3}s ease-in-out infinite` }} />
            {/* small feet */}
            <line className="ink-thin" x1="2" y1={H + 2} x2="2" y2={H + 6} />
            <line className="ink-thin" x1={W - 2} y1={H + 2} x2={W - 2} y2={H + 6} />
          </g>
        );
      })}
    </g>
  );
};

/* ---------- Car sub-component ---------- */
const CarShape = ({ fill, windowFill = 'rgba(251,251,247,0.6)', bigger }) => {
  const s = bigger ? 1.1 : 1;
  return (
    <g transform={`scale(${s})`}>
      <path className="ink"
        d="M -40 20 Q -42 4 -30 2 L -20 -14 Q -14 -20 -4 -20 L 22 -20 Q 32 -20 38 -12 L 48 2 Q 58 4 56 20 Z"
        fill={fill} />
      <path className="ink-thin" d="M -18 -2 L -10 -14 L 20 -14 L 30 -2 Z" fill={windowFill} />
      <line className="ink-thin" x1="6" y1="-14" x2="6" y2="-2" />
      <circle className="ink" cx="-22" cy="22" r="8" fill="var(--cream)" />
      <circle className="ink" cx="32" cy="22" r="8" fill="var(--cream)" />
      <circle cx="-22" cy="22" r="3" fill="var(--ink)" />
      <circle cx="32" cy="22" r="3" fill="var(--ink)" />
    </g>
  );
};

window.HandDrawnScene = HandDrawnScene;
