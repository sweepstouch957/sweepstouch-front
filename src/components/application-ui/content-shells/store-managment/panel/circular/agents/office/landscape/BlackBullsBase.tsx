'use client';

import { WINDOWS, type Colors } from './scene';

/** La base de los Toros Negros: torres torcidas, ventanas encendidas y su estandarte. */
export default function BlackBullsBase({ c }: { c: Colors }) {
  return (
    <>
      {/* la base de los Toros Negros: torres torcidas, ventanas encendidas y su estandarte */}
      <path
        d="M258 104 V0 h24 V104z M330 104 L334-8 L356-6 V104z"
        fill={c.base}
      />
      <path
        d="M270 104 V30 h70 V104z"
        fill={c.baseLight}
      />
      <path
        d="M284 30 L288-2 L322-6 L324 30z"
        fill={c.base}
      />
      <rect
        x={312}
        y={-24}
        width={6}
        height={14}
        fill={c.base}
      />
      <path
        d="M254 0 L270-28 L286 0z M329-8 L346-40 L361-6z M282-2 L306-26 L328-7z"
        fill={c.roof}
      />
      <path
        d="M270-28 L286 0 h-8z M346-40 L361-6 l-8-.5z M306-26 L328-7 l-9 .5z"
        fill="rgba(0,0,0,.22)"
      />
      {WINDOWS.map(([wx, wy], i) => (
        <rect
          key={`${wx},${wy}`}
          x={wx}
          y={wy}
          width={6}
          height={9}
          rx={3}
          fill="#FDE68A"
          className={i % 4 === 1 ? 'blink' : undefined}
        />
      ))}
      <path
        d="M270-28 v-20"
        stroke={c.gold}
        strokeWidth={1.4}
      />
      <path
        d="M270-48 h16 l-4 5 l4 5 h-16z"
        fill="#0B0B12"
        stroke={c.gold}
        strokeWidth={1}
      />
      <path
        className="steam"
        d="M315-27 q-4-4 0-8 q4-4 0-8"
        fill="none"
        stroke="rgba(226,232,240,.7)"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </>
  );
}
