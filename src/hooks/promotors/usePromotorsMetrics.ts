'use client';

import {
  getParticipationOverview,
  getPromoterRanking,
  promoterService,
  type ParticipationOverview,
  type PromoterRankingResponse,
} from '@/services/promotor.service';
import { useQuery } from '@tanstack/react-query';
import { endOfDay, startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { useMemo, useState } from 'react';

export type MetricsPeriod = 'today' | 'week' | 'month';

export interface UsePromotorsMetricsParams {
  period: MetricsPeriod;
}

function getPeriodDates(period: MetricsPeriod): { startDate: string; endDate: string } {
  const now = new Date();
  const end = endOfDay(now).toISOString();
  if (period === 'today') return { startDate: startOfDay(now).toISOString(), endDate: end };
  if (period === 'week') return { startDate: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), endDate: end };
  return { startDate: startOfMonth(now).toISOString(), endDate: end };
}

export function usePromotorsMetrics({ period }: UsePromotorsMetricsParams) {
  const { startDate, endDate } = useMemo(() => getPeriodDates(period), [period]);

  const { data: dashStats, isLoading: dashLoading } = useQuery({
    queryKey: ['promoter-dash-stats'],
    queryFn: () => promoterService.getDashboardStats(),
    staleTime: 2 * 60_000,
    retry: false,
  });

  const { data: rankingData, isLoading: rankingLoading } = useQuery({
    queryKey: ['promoter-ranking', period],
    queryFn: () => getPromoterRanking({ period, limit: 15 }),
    staleTime: 2 * 60_000,
    retry: false,
  });

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['promoter-overview', startDate, endDate],
    queryFn: () => getParticipationOverview({ startDate, endDate }),
    staleTime: 2 * 60_000,
    placeholderData: (prev) => prev,
    retry: false,
  });

  // Top promoters sorted by registrations (for goal tracking)
  const { data: topPromotersData, isLoading: topLoading } = useQuery({
    queryKey: ['promoters-top', period],
    queryFn: () =>
      promoterService.getAllPromoters({
        limit: 20,
        sortBy: 'totalRegistrations',
        order: 'desc',
      }),
    staleTime: 2 * 60_000,
    retry: false,
  });

  // Previous period overview for delta calculation
  const prevDates = useMemo(() => {
    const now = new Date();
    if (period === 'today') {
      const prev = subDays(now, 1);
      return { startDate: startOfDay(prev).toISOString(), endDate: endOfDay(prev).toISOString() };
    }
    if (period === 'week') {
      const prev = subDays(now, 7);
      return { startDate: startOfWeek(subDays(now, 7), { weekStartsOn: 1 }).toISOString(), endDate: endOfDay(prev).toISOString() };
    }
    const prev = subDays(startOfMonth(now), 1);
    return { startDate: startOfMonth(prev).toISOString(), endDate: endOfDay(prev).toISOString() };
  }, [period]);

  const { data: prevOverviewData } = useQuery({
    queryKey: ['promoter-overview-prev', prevDates.startDate, prevDates.endDate],
    queryFn: () => getParticipationOverview({ startDate: prevDates.startDate, endDate: prevDates.endDate }),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const isLoading = dashLoading || rankingLoading || overviewLoading || topLoading;

  const ranking = useMemo(() => rankingData?.ranking ?? [], [rankingData]);
  const totals = useMemo(() => rankingData?.totals, [rankingData]);
  const overview: ParticipationOverview = useMemo(
    () =>
      overviewData ?? {
        totalParticipations: 0,
        newUsers: 0,
        existingUsers: 0,
        totalPoints: 0,
        totalEarnings: 0,
        uniqueStoresCount: 0,
        uniquePromotersCount: 0,
        uniqueCustomersCount: 0,
      },
    [overviewData],
  );

  const topPromoters = useMemo(() => topPromotersData?.data ?? [], [topPromotersData]);

  // Goal: a promoter "reaches goal" if totalRegistrations >= 50 (configurable threshold)
  const GOAL_THRESHOLD = 50;
  const goalReached = useMemo(
    () => topPromoters.filter((p) => (p.totalRegistrations ?? 0) >= GOAL_THRESHOLD),
    [topPromoters],
  );

  // Delta vs previous period
  const delta = useMemo(() => {
    if (!prevOverviewData || !overviewData) return null;
    const prev = prevOverviewData.totalParticipations || 1;
    const curr = overviewData.totalParticipations;
    return Math.round(((curr - prev) / prev) * 100);
  }, [overviewData, prevOverviewData]);

  return {
    isLoading,
    dashStats,
    ranking,
    totals,
    overview,
    topPromoters,
    goalReached,
    delta,
    startDate,
    endDate,
    GOAL_THRESHOLD,
  };
}
