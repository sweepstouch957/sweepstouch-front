'use client';

import { useStoresWithoutFilters } from '@/hooks/stores/useStoresWithoutFilter';
import type { AudienceSimulatorResponse } from '@/services/campaing.service';
import type { Store } from '@/services/store.service';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { num, pct, StatCard } from './AudienceKpis';
import { GlassCard } from './ui';

function storeIdOf(s: Store) {
  return s._id || s.id;
}

function initials(name?: string) {
  const n = (name || '').trim();
  if (!n) return 'S';
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export function AudienceSimulator(props: {
  simStoreId: string;
  setSimStoreId: (v: string) => void;
  assumedCampaignsPerMonth: number;
  setAssumedCampaignsPerMonth: (n: number) => void;
  assumedLiftPct: number;
  setAssumedLiftPct: (n: number) => void;
  assumedChurnReductionPct: number;
  setAssumedChurnReductionPct: (n: number) => void;

  loading?: boolean;
  error?: boolean;

  data?: AudienceSimulatorResponse;
}) {
  const {
    simStoreId,
    setSimStoreId,
    assumedCampaignsPerMonth,
    setAssumedCampaignsPerMonth,
    assumedLiftPct,
    setAssumedLiftPct,
    assumedChurnReductionPct,
    setAssumedChurnReductionPct,
    loading,
    error,
    data,
  } = props;

  const storesQ = useStoresWithoutFilters();

  // ✅ opción seleccionada (Store) basada en simStoreId
  const selectedStore = useMemo(() => {
    if (!simStoreId?.trim()) return null;
    const list = storesQ.data ?? [];
    return (
      list.find((s) => storeIdOf(s) === simStoreId) ||
      list.find((s) => s.slug === simStoreId) || // por si alguna vez pasas slug
      null
    );
  }, [simStoreId, storesQ.data]);

  // ✅ si el store desaparece (por refetch) mantenemos UX consistente
  const [value, setValue] = useState<Store | null>(null);

  useEffect(() => {
    setValue(selectedStore);
  }, [selectedStore]);

  const baseline = data?.baseline;
  const projected = data?.scenario?.projected;
  const deltaAudience = data?.scenario?.delta?.audience ?? 0;

  return (
    <GlassCard
      title="“What if” Simulator"
      right={
        <Chip
          icon={<InsightsRoundedIcon />}
          label="Scenario planning"
          sx={(t) => ({
            fontWeight: 950,
            borderRadius: 999,
            bgcolor: alpha(t.palette.info.main, 0.12),
            color: t.palette.info.dark,
          })}
        />
      }
    >
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', mb: 1.25 }}
      >
        Select a store and estimate the upside if it starts sending campaigns.
      </Typography>

      <Divider sx={{ mb: 1.25 }} />

      <Grid
        container
        spacing={2}
      >
        {/* ✅ STORE AUTOCOMPLETE */}
        <Grid
          item
          xs={12}
          md={4}
        >
          <Autocomplete<Store, false, false, false>
            options={storesQ.data ?? []}
            value={value}
            loading={storesQ.isLoading}
            onChange={(_, next) => {
              setValue(next);
              setSimStoreId(next ? storeIdOf(next) : '');
            }}
            isOptionEqualToValue={(opt, val) => storeIdOf(opt) === storeIdOf(val)}
            getOptionLabel={(opt) => opt?.name ?? ''}
            renderOption={(props, option) => (
              <Box
                component="li"
                {...props}
                key={option.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  py: 1,
                }}
              >
                <Avatar
                  src={option.image || undefined}
                  alt={option.name}
                  key={option.name}
                  sx={(t) => ({
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    bgcolor: alpha(t.palette.primary.main, 0.14),
                    fontWeight: 900,
                    fontSize: 12,
                  })}
                >
                  {initials(option.name)}
                </Avatar>

                <Box
                  sx={{ minWidth: 0 }}
                  key={option.accessCode  }
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 900, lineHeight: 1.1 }}
                    noWrap
                  >
                    {option.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                    noWrap
                  >
                    {option.customerCount}
                    {option.active === false ? ' • inactive' : ''}
                  </Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Store"
                placeholder="Search store…"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {storesQ.isLoading ? (
                        <CircularProgress
                          color="inherit"
                          size={18}
                        />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {storesQ.isError ? (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mt: 0.75 }}
            >
              Failed to load stores — verify getStoresWithoutFilters().
            </Typography>
          ) : null}
        </Grid>

        {/* Inputs */}
        <Grid
          item
          xs={12}
          md={8}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
          >
            <TextField
              size="small"
              label="Campaigns / month"
              type="number"
              value={assumedCampaignsPerMonth}
              onChange={(e) => setAssumedCampaignsPerMonth(Number(e.target.value || 0))}
              sx={{ width: { xs: '100%', sm: 190 } }}
              inputProps={{ min: 0, max: 50 }}
            />
            <TextField
              size="small"
              label="Lift %"
              type="number"
              value={assumedLiftPct}
              onChange={(e) => setAssumedLiftPct(Number(e.target.value || 0))}
              sx={{ width: { xs: '100%', sm: 160 } }}
              inputProps={{ min: 0, max: 500 }}
            />
            <TextField
              size="small"
              label="Churn reduction %"
              type="number"
              value={assumedChurnReductionPct}
              onChange={(e) => setAssumedChurnReductionPct(Number(e.target.value || 0))}
              sx={{ width: { xs: '100%', sm: 210 } }}
              inputProps={{ min: 0, max: 100 }}
            />
          </Stack>
        </Grid>

        <Grid
          item
          xs={12}
        >
          {loading ? <LinearProgress /> : null}
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
        >
          <StatCard
            title="Baseline (current behavior)"
            value={num(baseline?.currentAudience ?? 0)}
            subtitle={`Net ${num(baseline?.netGrowth ?? 0)} • Growth ${pct(
              baseline?.growthPct ?? 0
            )} • Churn ${num(baseline?.churn ?? 0)}`}
            icon={<StorefrontRoundedIcon />}
            accent="primary"
          />
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
        >
          <StatCard
            title="Projected (with campaigns)"
            value={num(projected?.currentAudience ?? 0)}
            subtitle={`Net ${num(projected?.netGrowth ?? 0)} • Growth ${pct(
              projected?.growthPct ?? 0
            )} • Churn ${num(projected?.churn ?? 0)}`}
            icon={<CampaignRoundedIcon />}
            accent="success"
            right={
              data ? (
                <Chip
                  size="small"
                  label={`Δ +${num(deltaAudience)} audience`}
                  sx={(t) => ({
                    fontWeight: 950,
                    borderRadius: 999,
                    bgcolor: alpha(t.palette.success.main, 0.12),
                    color: t.palette.success.dark,
                  })}
                />
              ) : undefined
            }
          />
        </Grid>

        {error ? (
          <Grid
            item
            xs={12}
          >
            <Typography
              color="error"
              variant="body2"
            >
              Simulator error — verify /campaigns/audience/simulate and storeId.
            </Typography>
          </Grid>
        ) : null}

        {!simStoreId ? (
          <Grid
            item
            xs={12}
          >
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary' }}
            >
              Tip: start typing a store name and pick one from the list.
            </Typography>
          </Grid>
        ) : null}
      </Grid>
    </GlassCard>
  );
}
