import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type PageParams = { id: string };
type PageProps = { params: Promise<PageParams> };

type SweepstakeResponse = {
  name?: string;
  participants?: number;
};

type ParticipantSample = {
  phone?: string;
  phoneNumber?: string;
  storeName?: string;
  storeImage?: string;
};

type RaffleParticipant = {
  phoneNumber: string;
  ticketNumber: string;
  storeName: string;
  storeImage?: string;
};

function getApiUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  if (!base) return null;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function getJson<T>(path: string): Promise<T | null> {
  const url = getApiUrl(path);
  if (!url) return null;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

function normalizeParticipants(samples: ParticipantSample[], fallbackStoreName: string): RaffleParticipant[] {
  const unique = new Map<string, RaffleParticipant>();

  for (const sample of samples) {
    const rawPhone = sample.phoneNumber || sample.phone || '';
    const digits = rawPhone.replace(/\D/g, '');
    if (!digits) continue;

    const storeName = (sample.storeName || fallbackStoreName || 'Supermercado participante').trim();
    const phoneNumber = formatPhone(rawPhone);
    const ticketNumber = digits.slice(-6).padStart(6, '0');
    const key = `${digits}-${storeName}`;

    if (!unique.has(key)) {
      unique.set(key, {
        phoneNumber,
        ticketNumber,
        storeName,
        storeImage: sample.storeImage,
      });
    }
  }

  return Array.from(unique.values());
}

function injectRaffleData(html: string, data: unknown) {
  const serialized = JSON.stringify(data).replace(/</g, '\\u003c');
  return html.replace('<script>\n(function(){', `<script>\nwindow.SWEEPSTOUCH_RAFFLE_DATA = ${serialized};\n(function(){`);
}

export default async function PublicSweepstakeDrawPage({ params }: PageProps) {
  const { id } = await params;
  const [sweepstake, samples] = await Promise.all([
    getJson<SweepstakeResponse>(`/sweepstakes/${id}`),
    getJson<ParticipantSample[]>(`/sweepstakes/participants/${id}/participants/sample-phones`),
  ]);

  const participantSamples = Array.isArray(samples) ? samples : [];
  const fallbackStoreName =
    participantSamples.find((sample) => sample.storeName)?.storeName || 'Supermercado participante';
  const participants = normalizeParticipants(participantSamples, fallbackStoreName);
  const raffleData = {
    title: sweepstake?.name || 'Sorteo',
    storeName: fallbackStoreName,
    participantCount: participants.length || sweepstake?.participants || 0,
    participants,
  };

  const sourceHtml = readFileSync(join(process.cwd(), 'public', 'sweepstouch-raffle.html'), 'utf8');
  const raffleHtml = injectRaffleData(sourceHtml, raffleData);

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#8a0345',
      }}
    >
      <iframe
        srcDoc={raffleHtml}
        sandbox="allow-scripts"
        title="Sweepstouch raffle"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          border: 0,
        }}
      />
    </main>
  );
}
