'use client';
import React from 'react';
import Results from './results';

const CajerasTable: React.FC = () => {
  // De momento en blanco (sin fetch). Puedes conectar un servicio luego.
  return <Results cashiers={[]}
    isLoading={false} />;
};

export default CajerasTable;
