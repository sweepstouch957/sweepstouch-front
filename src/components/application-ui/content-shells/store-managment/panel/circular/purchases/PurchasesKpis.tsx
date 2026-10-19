'use client';

import {
  KpiCard,
  KpiRow,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { PurchasesResponse } from '@/services/shopping-lists.service';
import { money } from '../shared';

export default function PurchasesKpis({ totals }: { totals: PurchasesResponse['totals'] }) {
  return (
    <KpiRow min={150}>
      <KpiCard
        label="Recibos escaneados"
        value={totals.receipts}
      />
      <KpiCard
        label="Validados"
        value={totals.success}
      />
      <KpiCard
        label="Rechazados"
        value={totals.failed}
      />
      <KpiCard
        label="Puntos acreditados"
        value={totals.pointsAwarded}
      />
      <KpiCard
        label="Gasto detectado"
        value={money(totals.spend)}
      />
    </KpiRow>
  );
}
