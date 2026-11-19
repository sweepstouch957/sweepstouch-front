'use client';

import { getHolidayCountryIds } from '@/services/calendar-origin';
import { calendarService, type CalendarEvent } from '@/services/calendar.service';
import { CalendarMonthRounded, PublicRounded, TouchAppOutlined } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRef, useState, type ReactNode } from 'react';
import { COUNTRIES, HOTSPOTS, MONTHS, YEAR } from './data';
import EventActions from './event-actions';
import EventDialog from './event-dialog';
import { daysUntilEvent, eventUrgency } from './event-urgency';
import s from './holiday-calendar.module.css';
import ImportHolidaysButton from './import-holidays-button';
import { useBusinessDate } from './use-business-date';

const dateKey = (month: number, day: number) => month * 100 + day;
const dateFromKey = (key: number) => new Date(YEAR, Math.floor(key / 100) - 1, key % 100);
const isoDate = (key: number) =>
  `${YEAR}-${String(Math.floor(key / 100)).padStart(2, '0')}-${String(key % 100).padStart(2, '0')}`;
const fullDate = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
type Holiday = { country: (typeof COUNTRIES)[number]; key: number; name: string; eventId: string };
const classes = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ');

function UrgencyLegend() {
  return (
    <div
      className={s.urgencyLegend}
      aria-label="Colores por proximidad del evento"
    >
      <span>
        <i className={s.urgencyGreen} />
        16 a 30 días
      </span>
      <span>
        <i className={s.urgencyYellow} />9 a 15 días
      </span>
      <span>
        <i className={s.urgencyRed} />0 a 8 días
      </span>
    </div>
  );
}
const urgencyClasses = {
  green: s.urgencyGreen,
  yellow: s.urgencyYellow,
  red: s.urgencyRed,
  neutral: '',
};

function Flag({ id, size }: { id: string; size?: 'sm' | 'xs' }) {
  return (
    <span
      className={classes(s.flag, size && s[size])}
      title={COUNTRIES.find((c) => c.id === id)?.n}
    >
      <Image
        src={`/holiday-calendar/flags/${id}.svg`}
        alt={COUNTRIES.find((c) => c.id === id)?.n ?? id}
        width={30}
        height={20}
        unoptimized
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </span>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={classes(s.card, className)}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

type CalendarProps = {
  month: number;
  selected: number;
  today: number;
  referenceDate: string;
  countryId: string | null;
  visible: Holiday[];
  events: CalendarEvent[];
  onMonth: (month: number) => void;
  onDate: (key: number) => void;
  onClear: () => void;
};
function CalendarPanel({
  month,
  selected,
  today,
  referenceDate,
  countryId,
  visible,
  events,
  onMonth,
  onDate,
  onClear,
}: CalendarProps) {
  const first = (new Date(YEAR, month - 1, 1).getDay() + 6) % 7;
  const days = new Date(YEAR, month, 0).getDate();
  const country = COUNTRIES.find((c) => c.id === countryId);
  return (
    <section className={classes(s.card, s.cal)}>
      <div className={s.calhead}>
        <button
          type="button"
          className={s.nav}
          disabled={month === 1}
          aria-label="Mes anterior"
          onClick={() => onMonth(month - 1)}
        >
          ‹
        </button>
        <h2>
          {MONTHS[month - 1]} {YEAR}
        </h2>
        <button
          type="button"
          className={s.nav}
          disabled={month === 12}
          aria-label="Mes siguiente"
          onClick={() => onMonth(month + 1)}
        >
          ›
        </button>
      </div>
      <div className={s.filterbar}>
        {country ? (
          <>
            <Flag
              id={country.id}
              size="sm"
            />
            Mostrando solo {country.n}
            <button
              type="button"
              onClick={onClear}
            >
              Ver todos
            </button>
          </>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
      <div className={s.wk}>
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className={s.days}>
        {Array.from({ length: first }, (_, i) => (
          <div
            key={`empty-${i}`}
            className={classes(s.d, s.empty)}
          />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1,
            key = dateKey(month, day);
          const holidays = visible.filter((h) => h.key === key);
          const ids = [...new Set(holidays.map((h) => h.country.id))];
          const date = isoDate(key);
          const dayEvents = events.filter(
            (event) => event.date <= date && (event.endDate || event.date) >= date
          );
          const urgency =
            holidays.length || dayEvents.length ? eventUrgency(date, referenceDate) : 'neutral';
          return (
            <button
              type="button"
              key={key}
              data-urgency={urgency}
              className={classes(
                s.d,
                urgencyClasses[urgency],
                !!(holidays.length || dayEvents.length) && s.has,
                selected === key && s.sel,
                today === key && s.today
              )}
              onClick={() => onDate(key)}
              aria-pressed={selected === key}
              aria-current={today === key ? 'date' : undefined}
              aria-label={`${fullDate.format(dateFromKey(key))}${
                holidays.length
                  ? ': ' + holidays.map((h) => `${h.country.n}: ${h.name}`).join(', ')
                  : ', sin festivos'
              }${dayEvents.length ? `, ${dayEvents.length} eventos` : ''}`}
              title={holidays.map((h) => `${h.country.n}: ${h.name}`).join('\n')}
            >
              <span className={s.n}>{day}</span>
              {!!dayEvents.length && (
                <span
                  className={s.eventMarker}
                  title={`${dayEvents.length} eventos`}
                >
                  • {dayEvents.length}
                </span>
              )}
              {!!ids.length && (
                <span className={s.fl}>
                  {ids.slice(0, 3).map((id) => (
                    <Flag
                      key={id}
                      id={id}
                      size="xs"
                    />
                  ))}
                  {ids.length > 3 && <span className={s.more}>+{ids.length - 3}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <UrgencyLegend />
      <div className={s.months}>
        {MONTHS.map((name, i) => {
          const count = new Set(
            visible.filter((h) => Math.floor(h.key / 100) === i + 1).map((h) => h.key)
          ).size;
          return (
            <button
              type="button"
              key={name}
              className={month === i + 1 ? s.on : undefined}
              onClick={() => onMonth(i + 1)}
              aria-pressed={month === i + 1}
              aria-label={`${name}, ${count} fechas festivas`}
            >
              {name.slice(0, 3)}
              {!!count && <span className={s.c}>{count}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Upcoming({
  visible,
  today,
  referenceDate,
  countryId,
  onDate,
}: {
  visible: Holiday[];
  today: number;
  referenceDate: string;
  countryId: string | null;
  onDate: (key: number) => void;
}) {
  const grouped: (Holiday & { end: number })[] = [];
  for (const holiday of visible.filter((h) => h.key >= today)) {
    const previous = [...grouped]
      .reverse()
      .find((h) => h.country.id === holiday.country.id && h.name === holiday.name);
    if (
      previous &&
      dateFromKey(holiday.key).getTime() - dateFromKey(previous.end).getTime() === 86400000
    )
      previous.end = holiday.key;
    else grouped.push({ ...holiday, end: holiday.key });
  }
  return (
    <section className={classes(s.card, s.up)}>
      <div className={s.uphead}>
        <h2>Próximos festivos</h2>
        <span>{COUNTRIES.find((c) => c.id === countryId)?.n ?? 'Todos los países'}</span>
      </div>
      <UrgencyLegend />
      <div className={s.uplist}>
        {grouped.slice(0, countryId ? 8 : 10).map((h) => {
          const diff = daysUntilEvent(isoDate(h.key), referenceDate);
          const urgency = eventUrgency(isoDate(h.key), referenceDate);
          return (
            <button
              type="button"
              className={classes(s.upc, urgencyClasses[urgency])}
              data-urgency={urgency}
              key={`${h.eventId}-${h.country.id}-${h.key}`}
              onClick={() => onDate(h.key)}
            >
              <span className={s.t}>
                <Flag id={h.country.id} />
                {h.key % 100}
                {h.end !== h.key ? `–${h.end % 100}` : ''}{' '}
                {MONTHS[Math.floor(h.key / 100) - 1].slice(0, 3).toLowerCase()}. {YEAR}
              </span>
              <span className={s.nm}>{h.name}</span>
              <span className={s.pill}>{h.country.s ?? h.country.n}</span>
              <span className={s.in}>
                {diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : `En ${diff} días`}
              </span>
            </button>
          );
        })}
        {!grouped.length && <div className={s['empty-msg']}>No quedan festivos en 2026.</div>}
      </div>
      <div className={s.legend}>
        {COUNTRIES.map((c) => (
          <span key={c.id}>
            <Flag
              id={c.id}
              size="sm"
            />
            {c.s ?? c.n}
          </span>
        ))}
      </div>
    </section>
  );
}

export default function HolidayCalendar() {
  const referenceDate = useBusinessDate();
  const referenceYear = Number(referenceDate.slice(0, 4));
  const today =
    referenceYear === YEAR
      ? dateKey(Number(referenceDate.slice(5, 7)), Number(referenceDate.slice(8, 10)))
      : referenceYear < YEAR
        ? 101
        : 9999;
  const [filter, setFilter] = useState<string | null>(null);
  const [month, setMonth] = useState(() => (today === 9999 ? 1 : Math.floor(today / 100)));
  const [selected, setSelected] = useState(() => (today === 9999 ? 101 : today));
  const calendarRef = useRef<HTMLDivElement>(null);
  const [addingEvent, setAddingEvent] = useState(false);
  const {
    data: calendarEvents = [],
    isLoading: loadingEvents,
    isError: eventsError,
    refetch,
  } = useQuery({
    queryKey: ['calendar', YEAR],
    queryFn: () => calendarService.feed(`${YEAR}-01-01`, `${YEAR}-12-31`),
    staleTime: 60_000,
  });
  const events = calendarEvents.filter(
    (event) =>
      event.source === 'event' && event.calendarScope === 'holiday' && event.status !== 'cancelado'
  );
  const savedHolidays: Holiday[] = events
    .flatMap((event) =>
      getHolidayCountryIds(event).flatMap((countryId) => {
        const country = COUNTRIES.find((item) => item.id === countryId);
        return country
          ? [
              {
                country,
                key: dateKey(Number(event.date.slice(5, 7)), Number(event.date.slice(8, 10))),
                name: event.title,
                eventId: event._id,
              },
            ]
          : [];
      })
    )
    .sort((a, b) => a.key - b.key);
  const filteredEvents = events.filter(
    (event) =>
      !filter || !getHolidayCountryIds(event).length || getHolidayCountryIds(event).includes(filter)
  );
  const selectedEvents = filteredEvents
    .filter(
      (event) =>
        event.date <= isoDate(selected) && (event.endDate || event.date) >= isoDate(selected)
    )
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const country = COUNTRIES.find((c) => c.id === filter);
  const visible = savedHolidays.filter((h) => !filter || h.country.id === filter);
  const selectedHolidays = visible.filter((h) => h.key === selected);
  const goDate = (key: number, scroll = false) => {
    setSelected(key);
    setMonth(Math.floor(key / 100));
    if (scroll) calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const pickCountry = (id: string, fromMap = false) => {
    const next = filter === id && !fromMap ? null : id;
    setFilter(next);
    if (next) {
      const dates = savedHolidays.filter((h) => h.country.id === next);
      const target = dates.find((h) => h.key >= today) ?? dates[0];
      if (target) goDate(target.key, fromMap);
    }
  };
  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <header>
          <div className={s.logo}>
            <CalendarMonthRounded sx={{ color: '#fff', fontSize: 30 }} />
          </div>
          <div>
            <h1>Calendario Festivo 2026</h1>
            <p className={s.sub}>10 países · Un solo calendario</p>
          </div>
          <div className={s.tag}>Conecta culturas, organiza tus fechas</div>
        </header>
        <ImportHolidaysButton
          events={calendarEvents}
          disabled={loadingEvents || eventsError}
        />
        <div className={s.grid}>
          <Section
            title="Selecciona un país"
            className={s.countries}
          >
            <div className={s.clist}>
              {COUNTRIES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={classes(s.cbtn, filter === c.id && s.on)}
                  onClick={() => pickCountry(c.id)}
                  aria-pressed={filter === c.id}
                >
                  <Flag id={c.id} />
                  <span>{c.n}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={classes(s.allbtn, !filter && s.on)}
              onClick={() => setFilter(null)}
              aria-pressed={!filter}
            >
              <PublicRounded sx={{ fontSize: 18 }} />
              Todos los países
            </button>
          </Section>
          <div className={classes(s.side, s.mapwrap)}>
            <section className={classes(s.card, s.mapcard)}>
              <div className={s.map}>
                <Image
                  src="/holiday-calendar/mapa.jpg"
                  alt="Mapa de América Latina con los diez países del calendario"
                  fill
                  sizes="(max-width: 1150px) 100vw, 55vw"
                  priority
                />
                {Object.entries(HOTSPOTS).flatMap(([id, zones]) =>
                  zones.map(([x, y, width, height, shape]) => (
                    <button
                      type="button"
                      key={`${id}-${x}-${y}`}
                      className={classes(s.hot, !!shape && s.shape, filter === id && s.on)}
                      aria-label={`Ver calendario de ${COUNTRIES.find((c) => c.id === id)?.n}`}
                      aria-pressed={filter === id}
                      onClick={() => pickCountry(id, true)}
                      style={{
                        left: `${(x / 868) * 100}%`,
                        top: `${(y / 596) * 100}%`,
                        width: `${(width / 868) * 100}%`,
                        height: `${(height / 596) * 100}%`,
                      }}
                    />
                  ))
                )}
              </div>
              <div className={s.maphint}>
                <TouchAppOutlined sx={{ fontSize: 16, color: '#FC0680' }} />
                Toca un país en el mapa para ver su calendario.
              </div>
            </section>
          </div>
          <div
            className={s.calendarwrap}
            ref={calendarRef}
          >
            <CalendarPanel
              month={month}
              selected={selected}
              today={today}
              referenceDate={referenceDate}
              countryId={filter}
              visible={visible}
              events={filteredEvents}
              onMonth={setMonth}
              onDate={goDate}
              onClear={() => setFilter(null)}
            />
          </div>
          <Section
            className={s.selectedSection}
            title={
              <>
                <CalendarMonthRounded sx={{ fontSize: 16 }} />
                Fecha seleccionada
              </>
            }
          >
            <div
              className={s.selbox}
              aria-live="polite"
            >
              <div className={s.dayToolbar}>
                <div>
                  <div className={s.seldate}>
                    {fullDate
                      .format(dateFromKey(selected))
                      .replace(/^./, (letter) => letter.toUpperCase())}
                  </div>
                  <p className={s.dayCount}>
                    {selectedEvents.filter((event) => getHolidayCountryIds(event).length).length}{' '}
                    festivos ·{' '}
                    {selectedEvents.filter((event) => !getHolidayCountryIds(event).length).length}{' '}
                    otros eventos
                  </p>
                </div>
                <button
                  type="button"
                  className={s.addEvent}
                  onClick={() => setAddingEvent(true)}
                >
                  + Agregar evento
                </button>
              </div>
              {loadingEvents && <p role="status">Cargando eventos…</p>}
              {eventsError && (
                <p role="alert">
                  No se pudieron cargar los eventos.{' '}
                  <button
                    type="button"
                    onClick={() => void refetch()}
                  >
                    Reintentar
                  </button>
                </p>
              )}
              <div className={s.dayEvents}>
                {selectedEvents.map((event) => (
                  <article
                    className={s.customEvent}
                    key={event._id}
                  >
                    <div className={s.eventMeta}>
                      <span>
                        {getHolidayCountryIds(event).length ? (
                          <span className={s.eventCountries}>
                            {getHolidayCountryIds(event).map((id) => (
                              <span key={id}>
                                <Flag
                                  id={id}
                                  size="sm"
                                />
                                {COUNTRIES.find((country) => country.id === id)?.n}
                              </span>
                            ))}
                          </span>
                        ) : (
                          'Evento'
                        )}
                      </span>
                      <span>{event.startTime || 'Todo el día'}</span>
                    </div>
                    <h3>{event.title}</h3>
                    {event.description && <p>{event.description}</p>}
                    <EventActions
                      event={event}
                      onSaved={(saved) =>
                        goDate(
                          dateKey(Number(saved.date.slice(5, 7)), Number(saved.date.slice(8, 10)))
                        )
                      }
                    />
                  </article>
                ))}
              </div>
              {!selectedHolidays.length &&
                !selectedEvents.length &&
                !loadingEvents &&
                !eventsError && (
                  <div className={s['empty-msg']}>
                    {country
                      ? `Sin festivos en ${country.n} este día.`
                      : 'Ningún país tiene festivo este día.'}
                  </div>
                )}
            </div>
          </Section>
        </div>
        {country && (
          <Section
            className={s.up}
            title={
              <>
                <Flag
                  id={country.id}
                  size="sm"
                />
                Festivos 2026 · {country.n} <span>({visible.length} fechas)</span>
              </>
            }
          >
            <div className={s.yearlist}>
              {visible.map(({ key, name, eventId }) => (
                <button
                  type="button"
                  className={classes(s.yrow, key < today && s.past)}
                  key={eventId}
                  onClick={() => goDate(key, true)}
                >
                  <span className={s.yd}>
                    {key % 100} {MONTHS[Math.floor(key / 100) - 1].slice(0, 3)}
                  </span>
                  <span className={s.weekday}>
                    {dateFromKey(key).toLocaleDateString('es', { weekday: 'long' })}
                  </span>
                  <span className={s.yn}>{name}</span>
                </button>
              ))}
              {country.note && <div className={s.note}>Nota: {country.note}</div>}
            </div>
          </Section>
        )}
        <Upcoming
          visible={visible}
          today={today}
          referenceDate={referenceDate}
          countryId={filter}
          onDate={(key) => goDate(key, true)}
        />
        {addingEvent && (
          <EventDialog
            initialDate={isoDate(selected)}
            initialCountryId={filter}
            onClose={() => setAddingEvent(false)}
            onSaved={(event) => {
              setAddingEvent(false);
              goDate(dateKey(Number(event.date.slice(5, 7)), Number(event.date.slice(8, 10))));
            }}
          />
        )}
        <footer>
          Fuente: “Días festivos 2026 — Calendario de feriados de 10 países de América Latina”.
          Documento informativo: la aplicación de los feriados puede variar según legislación
          laboral, sector, región y traslados oficiales. Confírmalos con la autoridad de cada país
          antes de usarlos para nómina o planificación.
        </footer>
      </div>
    </div>
  );
}
