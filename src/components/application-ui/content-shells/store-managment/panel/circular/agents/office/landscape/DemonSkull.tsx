'use client';

import type { Colors } from './scene';

/** La calavera gigante del demonio, con la estatua del primer Rey Mago encima. */
export default function DemonSkull({ c }: { c: Colors }) {
  return (
    <>
      {/* la calavera gigante del demonio, con la estatua del primer Rey Mago encima */}
      <path
        d="M-262-12 Q-294-30 -287-74 Q-270-44 -249-35z M-188-12 Q-156-30 -163-74 Q-180-44 -201-35z"
        fill={c.skullDark}
      />
      <path
        d="M-270 70 V8 Q-270-46 -225-46 Q-180-46 -180 8 V70z"
        fill={c.skull}
      />
      <path
        d="M-225-46 Q-180-46 -180 8 V70 h-14 V8 Q-194-30 -225-46z"
        fill={c.skullDark}
        opacity={0.55}
      />
      {[-244, -207].map((ex) => (
        <g key={ex}>
          <ellipse
            cx={ex}
            cy={6}
            rx={11}
            ry={13}
            fill={c.socket}
          />
          <circle
            className="blink"
            cx={ex}
            cy={8}
            r={3}
            fill="#F87171"
          />
        </g>
      ))}
      <path
        d="M-225 20 l-5 12 h10z"
        fill={c.socket}
      />
      <path
        d="M-252 44 V70 M-241 44 V70 M-230 44 V70 M-219 44 V70 M-208 44 V70 M-197 44 V70 M-258 44 H-192"
        stroke={c.socket}
        strokeWidth={1.6}
        fill="none"
      />
      <path
        d="M-225-46 v-11 M-229-53 h8 M-221-55 l5-9"
        stroke={c.skullDark}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}
