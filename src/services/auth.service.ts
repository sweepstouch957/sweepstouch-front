// src/services/auth.service.ts — password recovery flow (forgot / verify / reset)
import { api } from '@/libs/axios';

/** STEP 1 — request a reset code to be emailed. */
export async function forgotPassword(email: string): Promise<any> {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

/** STEP 2 — verify the 6-digit reset code. */
export async function verifyResetCode(email: string, code: string): Promise<any> {
  const { data } = await api.post('/auth/verify-reset-code', { email, code });
  return data;
}

/** STEP 3 — set the new password using the verified code. */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<any> {
  const { data } = await api.post('/auth/reset-password', { email, code, newPassword });
  return data;
}
