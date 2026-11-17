/**
 * Tutoriales del panel de circulares y listas: una guía por tarea, paso a paso, con las
 * palabras exactas de los botones. `video` (URL mp4 o de Cloudinary) es opcional: cuando se
 * grabe el video de una guía se pega acá y el modal lo reproduce arriba de los pasos.
 */
import type { PanelTab } from '../header/tabs';

export type Tutorial = {
  id: string;
  title: string;
  /** Para qué sirve, en una línea. */
  goal: string;
  /** Pestañas donde esta guía es la que se abre primero. */
  tabs: PanelTab[];
  video?: string;
  steps: { do: string; why?: string }[];
};

export const TUTORIALS: Tutorial[] = [
  {
    id: 'review',
    title: 'Revisar y publicar la lista',
    goal: 'Que los clientes vean sólo productos y precios que alguien validó contra el flyer.',
    tabs: ['products'],
    steps: [
      {
        do: 'Entra a Productos → "Hoy en la lista". Arriba ves qué flyer o circular está vigente y hasta qué fecha.',
        why: 'La vigencia la manejan los agentes: cuando vence, esos productos se ocultan solos.',
      },
      {
        do: 'Toca el botón flotante "Ver flyer o circular" para tener el arte a la vista mientras revisas.',
      },
      {
        do: 'Compara fila por fila: nombre, precio de oferta, precio regular, letra chica y foto. Los que trajo el flyer salen con la etiqueta "Por revisar".',
      },
      {
        do: 'Si algo está mal, haz clic encima y corrígelo ahí mismo. Enter guarda, Esc deshace.',
        why: 'Cada corrección queda protegida y los agentes aprenden de ella para la próxima semana.',
      },
      {
        do: 'Cuando todo coincide, toca "Publicar", marca la casilla "revisé todo" y confirma.',
        why: 'Queda registrado quién verificó la lista.',
      },
    ],
  },
  {
    id: 'edit-row',
    title: 'Corregir un producto',
    goal: 'Arreglar lo que la IA leyó mal sin salir de la tabla.',
    tabs: [],
    steps: [
      { do: 'Haz clic en el dato que quieres cambiar: nombre, marca, tamaño o cualquier precio.' },
      {
        do: 'Letra chica: escribe la condición tal como sale en el flyer ("2 for $5", "with $20 purchase").',
      },
      {
        do: 'Caja: si sólo se vende por caja, escribe cuánto trae ("15 lb"). Límite: el máximo por cliente. "Mostrador": un clic lo marca o lo quita.',
        why: 'Es lo que el cliente reclama en la caja si no sale en su lista.',
      },
      {
        do: 'Para cambiar la foto toca el lápiz de la fila: puedes subir, pegar, recortar del circular o generar con IA.',
      },
      {
        do: 'Deja el cursor quieto sobre cualquier campo o switch y aparece una ayuda que dice para qué sirve.',
      },
    ],
  },
  {
    id: 'find',
    title: 'Buscar productos vencidos o viejos',
    goal: 'Encontrar algo que ya no sale en la lista por defecto.',
    tabs: [],
    steps: [
      {
        do: 'Por defecto la tabla muestra sólo lo vigente y lo próximo; lo de flyers vencidos no aparece.',
      },
      { do: 'Escribe el nombre en el buscador: busca en TODO el catálogo, vencidos incluidos.' },
      {
        do: 'O cambia el filtro a "Todo el catálogo", "Ocultos" o "Esperan fecha" para verlos sin buscar.',
      },
    ],
  },
  {
    id: 'upcoming',
    title: 'Adelantar la semana que viene',
    goal: 'Dejar aprobado el próximo flyer para que salga solo en su fecha.',
    tabs: ['upcoming'],
    steps: [
      {
        do: 'Entra a Productos → "Próximas ofertas". Cada grupo es un flyer o circular con su fecha.',
      },
      { do: 'Revisa los productos del grupo contra el arte y corrige precios si hace falta.' },
      {
        do: 'Toca "Aprobar". Listo: ese día los productos se publican solos, sin que nadie entre.',
        why: 'Si no lo apruebas, ese día quedan "Por revisar" y ocultos hasta que alguien publique.',
      },
      { do: '¿Urge? "Publicar ahora" lo saca hoy mismo sin esperar la fecha.' },
    ],
  },
  {
    id: 'circular',
    title: 'Subir el circular de la semana',
    goal: 'Cargar el PDF o imagen del circular para que los agentes lean los productos.',
    tabs: ['circular'],
    steps: [
      { do: 'En la pestaña Circular, sube el archivo y pon las fechas en que rige.' },
      {
        do: 'Los agentes leen cada página, cargan los productos y revisan su propio trabajo. Puedes ver el avance en "Agentes IA".',
      },
      {
        do: 'Si sale un aviso de que la lectura falló, toca "Reintentar ahora".',
      },
      { do: 'Cuando terminen, ve a Productos y sigue la guía "Revisar y publicar la lista".' },
    ],
  },
  {
    id: 'campaign-list',
    title: 'Campaña con la lista escrita del cliente',
    goal: 'Usar la lista que manda la tienda como la fuente más confiable.',
    tabs: [],
    steps: [
      { do: 'En Campañas → crear campaña, sube el arte (imagen) como siempre.' },
      {
        do: 'Pega en "Lista de productos (opcional)" el texto tal cual lo mandó la tienda.',
        why: 'Esa lista manda: nombres y precios salen de ahí; el arte sólo aporta las fotos.',
      },
      {
        do: 'Al agendar, los agentes cargan los productos con la fecha de la campaña y avisan qué no cuadra entre la lista y el arte.',
      },
      { do: 'Revisa y publica (o aprueba por adelantado) como con cualquier flyer.' },
    ],
  },
  {
    id: 'lists',
    title: 'Ver listas y compras de clientes',
    goal: 'Saber qué arman y qué compran los clientes de la tienda.',
    tabs: ['lists', 'purchases', 'messages', 'postcard'],
    steps: [
      { do: 'Clientes → "Listas": todas las listas hechas, con el cliente y sus productos.' },
      {
        do: 'El botón de dashboard muestra los números: listas, productos más pedidos, mejores clientes y puntos.',
      },
      { do: 'Clientes → "Compras": los recibos escaneados y los puntos que se dieron.' },
    ],
  },
  {
    id: 'agents',
    title: 'Qué hacen los agentes',
    goal: 'Entender quién hace qué y dónde ver si algo falló.',
    tabs: ['agents', 'config'],
    steps: [
      {
        do: 'En "Agentes IA" ves la bitácora: qué leyó cada uno, qué corrigió y quién verificó la lista.',
      },
      {
        do: 'Ellos manejan las fechas: publican lo aprobado en su día y ocultan lo vencido.',
        why: 'Nunca prenden solos algo que nadie revisó.',
      },
      {
        do: 'Si una tienda no quiere listas o es "Sólo flyer", se cambia en Ajustes → Configuración.',
      },
    ],
  },
];

/** La guía que se abre primero según la pestaña en la que está la persona. */
export const tutorialFor = (tab: PanelTab) =>
  TUTORIALS.find((t) => t.tabs.includes(tab)) ?? TUTORIALS[0];
