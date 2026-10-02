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
  /** Canal que activa al aplicarla (el piloto RCS marca "mixed"). */
  channel?: 'sms' | 'mixed';
}

/**
 * `#title` NO es un placeholder del envío: el picker lo cambia por el título de la campaña
 * al aplicar la plantilla (o por "Weekly Specials" si todavía no hay título).
 */
export const TITLE_TOKEN = '#title';
export const DEFAULT_HEADLINE = 'Weekly Specials';

export const BASE_TEMPLATES: readonly BaseTemplate[] = [
  {
    key: 'rcs-pilot-session',
    name: 'RCS piloto · especiales de la semana (link con sesión)',
    channel: 'mixed',
    // Con nombre y correo, #linklogin abre su panel Mi cuenta con la sesión; sólo con
    // nombre, la portada con sesión. El titular se arma con el título de la campaña.
    content:
      '#brand 🛒#n#n🍁 #title 🍂#n#nHi #name 👋#nStart saving 💰 and earning points ⭐#n👉 #linklogin#n#n📍 Address: #address#n#n#disclaimer',
  },
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
