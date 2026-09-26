/**
 * Plantillas BASE (iguales para todas las tiendas). Las de cada tienda se guardan en el
 * backend (campaign-service /templates); estas son el punto de partida.
 * OJO: los placeholders distinguen mayúsculas — es #storeName, no #storename (ese saldría
 * literal en el SMS).
 */
export interface BaseTemplate {
  key: string;
  name: string;
  content: string;
}

export const BASE_TEMPLATES: readonly BaseTemplate[] = [
  {
    key: 'points-linklogin',
    name: 'Ahorra y gana puntos (link con sesión)',
    content:
      'Hello #name 👋#n#n🎊 Start saving and earning points here: 👉 #linklogin #n#n🛒 #storeName 📍 #n#nReply STOP to cancel',
  },
];

/** Vista previa de una línea: los #n se ven como saltos. */
export const previewText = (content: string) =>
  content.replace(/#n/g, ' ↵ ').replace(/\s+/g, ' ').trim();
