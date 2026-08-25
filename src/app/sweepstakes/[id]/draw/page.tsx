import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getPublicSweepstakeById,
  getPublicParticipantSamplePhones,
} from '@/services/sweepstakes.service';

export const dynamic = 'force-dynamic';

type PageParams = { id: string };
type PageProps = { params: Promise<PageParams> };

type SweepstakeResponse = {
  name?: string;
  participants?: number;
};

type ParticipantSample = {
  phone?: string;
  phoneNumber?: string;
  customerPhone?: string;
  customer?: {
    phone?: string;
    phoneNumber?: string;
  };
  storeName?: string;
  storeImage?: string;
  store?: {
    name?: string;
    storeName?: string;
    image?: string;
    storeImage?: string;
  };
};

type ParticipantSamplePayload =
  | Array<ParticipantSample | string>
  | {
      data?: Array<ParticipantSample | string>;
      participants?: Array<ParticipantSample | string>;
      samplePhones?: Array<ParticipantSample | string>;
      phones?: Array<ParticipantSample | string>;
    };

type RaffleParticipant = {
  phoneNumber: string;
  ticketNumber: string;
  storeName: string;
  storeImage?: string;
};

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

function getParticipantSamples(payload: ParticipantSamplePayload | null): Array<ParticipantSample | string> {
  if (Array.isArray(payload)) return payload;
  if (!payload) return [];
  return payload.data || payload.participants || payload.samplePhones || payload.phones || [];
}

function getSampleStoreName(sample: ParticipantSample | string): string | undefined {
  if (typeof sample === 'string') return undefined;
  return sample.storeName || sample.store?.storeName || sample.store?.name;
}

function normalizeParticipants(samples: Array<ParticipantSample | string>, fallbackStoreName: string): RaffleParticipant[] {
  const unique = new Map<string, RaffleParticipant>();

  for (const sample of samples) {
    const source = typeof sample === 'string' ? { phone: sample } : sample;
    const rawPhone =
      source.phoneNumber ||
      source.phone ||
      source.customerPhone ||
      source.customer?.phoneNumber ||
      source.customer?.phone ||
      '';
    const digits = rawPhone.replace(/\D/g, '');
    if (!digits) continue;

    const storeName = (
      source.storeName ||
      source.store?.storeName ||
      source.store?.name ||
      fallbackStoreName ||
      'Supermercado participante'
    ).trim();
    const phoneNumber = formatPhone(rawPhone);
    const ticketNumber = digits.slice(-6).padStart(6, '0');
    const key = `${digits}-${storeName}`;

    if (!unique.has(key)) {
      unique.set(key, {
        phoneNumber,
        ticketNumber,
        storeName,
        storeImage: source.storeImage || source.store?.storeImage || source.store?.image,
      });
    }
  }

  return Array.from(unique.values());
}

function injectRaffleData(html: string, data: unknown) {
  const serialized = JSON.stringify(data).replace(/</g, '\\u003c');
  return html.replace(
    /<script>\s*\(function\(\)\{/,
    `<script>\nwindow.SWEEPSTOUCH_RAFFLE_DATA = ${serialized};\n(function(){`
  );
}

export default async function PublicSweepstakeDrawPage({ params }: PageProps) {
  const { id } = await params;
  const [sweepstake, samplesPayload] = await Promise.all([
    getPublicSweepstakeById<SweepstakeResponse>(id),
    getPublicParticipantSamplePhones<ParticipantSamplePayload>(id),
  ]);

  const participantSamples = getParticipantSamples(samplesPayload);
  const fallbackStoreName =
    participantSamples.map(getSampleStoreName).find(Boolean) || 'Supermercado participante';
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
        allow="fullscreen"
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
