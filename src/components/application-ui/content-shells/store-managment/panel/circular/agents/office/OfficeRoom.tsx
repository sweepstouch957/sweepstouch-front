'use client';

/**
 * El claro donde trabajan los magos, ambientado en el Reino del Trébol: atardecer violeta,
 * la calavera del demonio, el castillo real a lo lejos y la base de los Toros Negros; pinos
 * al fondo, pasto en damero con tréboles y un sendero de tierra. No se mueve (salvo brillos).
 * Cada pieza vive en ./landscape. (El archivo conserva el nombre de cuando era una oficina.)
 */
import { memo } from 'react';
import BlackBullsBase from './landscape/BlackBullsBase';
import Clovers from './landscape/Clovers';
import DemonSkull from './landscape/DemonSkull';
import Ground from './landscape/Ground';
import Mana from './landscape/Mana';
import { SCENE } from './landscape/scene';
import Sky from './landscape/Sky';
import type { OfficePalette } from './palette';

function OfficeRoom({ pal }: { pal: OfficePalette }) {
  const c = pal.dark ? SCENE.dark : SCENE.light;
  return (
    <>
      <Sky
        c={c}
        dark={pal.dark}
      />
      <DemonSkull c={c} />
      <BlackBullsBase c={c} />
      <Ground pal={pal} />
      <Clovers pal={pal} />
      <Mana />
    </>
  );
}

export default memo(OfficeRoom);
