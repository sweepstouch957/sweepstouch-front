/** Animaciones de la oficina (caminar, teclear, vapor, globos). Se apagan con reduced-motion. */
export const OFFICE_CSS = `
  .ch .leg, .ch .arm { transform-box: fill-box; transform-origin: top center; }
  .ch.walk .leg.l { animation: legL .5s ease-in-out infinite; }
  .ch.walk .leg.r { animation: legR .5s ease-in-out infinite; }
  .ch.walk .arm.l { animation: legR .5s ease-in-out infinite; }
  .ch.walk .arm.r { animation: legL .5s ease-in-out infinite; }
  .ch.type .arm.l { animation: typeA .22s ease-in-out infinite; }
  .ch.type .arm.r { animation: typeA .22s ease-in-out infinite .11s; }
  @keyframes legL { 0%,100% { transform: rotate(-22deg) } 50% { transform: rotate(22deg) } }
  @keyframes legR { 0%,100% { transform: rotate(22deg) } 50% { transform: rotate(-22deg) } }
  @keyframes typeA { 0%,100% { transform: translateY(0) rotate(-40deg) } 50% { transform: translateY(2px) rotate(-40deg) } }
  .walker { transition-property: transform; transition-timing-function: linear; }
  .screen { animation: glow 1.4s ease-in-out infinite; }
  @keyframes glow { 0%,100% { opacity: .85 } 50% { opacity: 1 } }
  .blink { animation: glow .8s ease-in-out infinite; }
  .steam { animation: steam 2.2s ease-in-out infinite; }
  @keyframes steam { 0% { opacity: 0; transform: translateY(2px) } 50% { opacity: 1 } 100% { opacity: 0; transform: translateY(-4px) } }
  .bubble { animation: pop .25s ease both; }
  @keyframes pop { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
  @media (prefers-reduced-motion: reduce) { .ch *, .walker, .screen, .steam, .blink { animation: none !important; transition: none !important } }
`;
