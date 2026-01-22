/* ===================== Wheel SVG ===================== */
export function WheelSvg({ rotationDeg, size = 340 }: { rotationDeg: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.floor(size * 0.46);
  const segments = 8;

  const colors = [
    '#E11D48',
    '#2563EB',
    '#F59E0B',
    '#10B981',
    '#7C3AED',
    '#DB2777',
    '#06B6D4',
    '#EAB308',
  ];

  const paths = Array.from({ length: segments }).map((_, i) => {
    const a0 = (i * 2 * Math.PI) / segments - Math.PI / 2;
    const a1 = ((i + 1) * 2 * Math.PI) / segments - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const largeArc = a1 - a0 > Math.PI ? 1 : 0;
    const d = [
      `M ${cx} ${cy}`,
      `L ${x0} ${y0}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1}`,
      'Z',
    ].join(' ');
    return { d, fill: colors[i % colors.length] };
  });

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      style={{
        transform: `rotate(${rotationDeg}deg)`,
        transition: 'none',
        willChange: 'transform',
        filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.15))',
      }}
    >
      <defs>
        <radialGradient
          id="goldRim"
          cx="30%"
          cy="30%"
          r="80%"
        >
          <stop
            offset="0%"
            stopColor="#FFF2B0"
          />
          <stop
            offset="35%"
            stopColor="#FFD36B"
          />
          <stop
            offset="70%"
            stopColor="#E2A83B"
          />
          <stop
            offset="100%"
            stopColor="#8C5A12"
          />
        </radialGradient>
        <linearGradient
          id="goldShine"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#FFF8D6"
            stopOpacity="0.95"
          />
          <stop
            offset="40%"
            stopColor="#FFD36B"
            stopOpacity="0.25"
          />
          <stop
            offset="100%"
            stopColor="#8C5A12"
            stopOpacity="0.35"
          />
        </linearGradient>
      </defs>

      {paths.map((p, idx) => (
        <path
          key={idx}
          d={p.d}
          fill={p.fill}
        />
      ))}

      <circle
        cx={cx}
        cy={cy}
        r={r + 6}
        fill="none"
        stroke="url(#goldRim)"
        strokeWidth={10}
        opacity={0.98}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r + 1}
        fill="none"
        stroke="url(#goldShine)"
        strokeWidth={3}
        opacity={0.9}
      />

      <circle
        cx={cx}
        cy={cy}
        r={36}
        fill="white"
        opacity={0.95}
      />
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill="#111827"
        opacity={0.15}
      />
    </svg>
  );
}
